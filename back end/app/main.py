from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.assistant_runtime import AssistantRuntimeFactory
from app.config import get_settings
from app.dashboard_api import build_dashboard_router
from app.dashboard_repository import DashboardRepository
from app.dashboard_service import DashboardService
from app.live_bridge import LiveBridge
from app.logging_config import configure_logging
from app.patient_profile_repository import PatientProfileRepository
from app.patient_profile_service import PatientProfileService
from app.schedule_api import build_schedule_router
from app.schedule_repository import ScheduleRepository
from app.schedule_service import ScheduleService
from app.simulation_api import build_simulation_router
from app.simulation_service import GeminiSimulatedPatientClient
from app.simulation_service import SimulationService


settings = get_settings()
configure_logging(settings.log_level)
app = FastAPI(title="Raksha Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

backend_root = Path(__file__).resolve().parent.parent
seed_sql_path = Path(settings.profile_seed_sql_path)
if not seed_sql_path.is_absolute():
    seed_sql_path = (backend_root / seed_sql_path).resolve()

profile_db_url = settings.profile_db_url
sqlite_relative_prefix = "sqlite:///"
sqlite_absolute_prefix = "sqlite:////"
if profile_db_url.startswith(sqlite_relative_prefix) and not profile_db_url.startswith(
    sqlite_absolute_prefix
):
    relative_db_path = profile_db_url[len(sqlite_relative_prefix) :]
    absolute_db_path = (backend_root / relative_db_path).resolve()
    profile_db_url = f"sqlite:///{absolute_db_path}"

patient_profile_repository = PatientProfileRepository(
    db_url=profile_db_url,
    seed_sql_path=seed_sql_path,
)
patient_profile_repository.initialize()
patient_profile_service = PatientProfileService(patient_profile_repository)

schedule_seed_sql_path = Path(settings.schedule_seed_sql_path)
if not schedule_seed_sql_path.is_absolute():
    schedule_seed_sql_path = (backend_root / schedule_seed_sql_path).resolve()

schedule_db_url = settings.schedule_db_url
if schedule_db_url.startswith(
    sqlite_relative_prefix
) and not schedule_db_url.startswith(sqlite_absolute_prefix):
    relative_db_path = schedule_db_url[len(sqlite_relative_prefix) :]
    absolute_db_path = (backend_root / relative_db_path).resolve()
    schedule_db_url = f"sqlite:///{absolute_db_path}"

schedule_repository = ScheduleRepository(
    db_url=schedule_db_url,
    seed_sql_path=schedule_seed_sql_path,
)
schedule_repository.initialize()
schedule_service = ScheduleService(schedule_repository)

# Dashboard setup - uses same database as patient profiles
dashboard_repository = DashboardRepository(
    db_url=profile_db_url,
)
dashboard_repository.initialize()
dashboard_service = DashboardService(
    dashboard_repository=dashboard_repository,
    schedule_service=schedule_service,
)

assistant_runtime_factory = AssistantRuntimeFactory(
    app_name=settings.app_name,
    default_model=settings.gemini_model,
    gemini_api_key=settings.gemini_api_key,
    patient_profile_service=patient_profile_service,
    schedule_service=schedule_service,
)

simulation_output_dir = Path(settings.simulation_output_dir)
if not simulation_output_dir.is_absolute():
    simulation_output_dir = (backend_root / simulation_output_dir).resolve()

simulation_scenarios_dir = Path(settings.simulation_scenarios_dir)
if not simulation_scenarios_dir.is_absolute():
    simulation_scenarios_dir = (backend_root / simulation_scenarios_dir).resolve()

simulation_service = SimulationService(
    assistant_runtime_factory=assistant_runtime_factory,
    patient_profile_service=patient_profile_service,
    schedule_service=schedule_service,
    simulated_patient_client=GeminiSimulatedPatientClient(
        api_key=settings.gemini_api_key,
        default_model=settings.gemini_simulator_model,
    ),
    output_dir=simulation_output_dir,
    scenarios_dir=simulation_scenarios_dir,
    default_simulator_model=settings.gemini_simulator_model,
    default_assistant_model=settings.gemini_model,
    default_max_turns=settings.simulation_max_turns_default,
)

bridge = LiveBridge(
    app_name=settings.app_name,
    model=settings.gemini_model,
    gemini_api_key=settings.gemini_api_key,
    patient_profile_service=patient_profile_service,
    schedule_service=schedule_service,
    dashboard_repository=dashboard_repository,
)
app.include_router(build_schedule_router(schedule_service))
app.include_router(build_dashboard_router(dashboard_service))
app.include_router(build_simulation_router(simulation_service))


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/patients")
async def list_patients() -> list[dict[str, Any]]:
    return patient_profile_service.list_patients()


@app.websocket("/ws/live")
async def ws_live(websocket: WebSocket) -> None:
    user_id = websocket.query_params.get("user_id", "raksha-user")
    timezone = websocket.query_params.get("timezone")
    await bridge.run_websocket(websocket, user_id=user_id, timezone_name=timezone)
