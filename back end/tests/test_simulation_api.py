from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.simulation_api import build_simulation_router
from app.simulation_models import SimulationScenario


class _SimulationServiceStub:
    def list_scenarios(self) -> list[SimulationScenario]:
        return [
            SimulationScenario(
                scenario_id="scenario-1",
                title="Scenario 1",
                patient_user_id="user-001",
                starting_prompt="Hello",
                conversation_plan="Say hello.",
                user_persona="Plain patient",
            )
        ]

    def list_patients(self) -> list[dict[str, str]]:
        return [{"user_id": "user-001", "full_name": "Patient One"}]

    async def run(self, request):
        return type(
            "Summary",
            (),
            {
                "model_dump": lambda self, mode="json": {
                    "run_id": "sim_1",
                    "patient_user_id": "user-001",
                }
            },
        )()

    def get_run_summary(self, run_id: str) -> dict[str, str]:
        if run_id != "sim_1":
            raise FileNotFoundError
        return {"run_id": "sim_1"}

    def get_run_report(self, run_id: str) -> str:
        if run_id != "sim_1":
            raise FileNotFoundError
        return "# report"

    def get_run_events(self, run_id: str) -> str:
        if run_id != "sim_1":
            raise FileNotFoundError
        return "{\"event\":1}\n"


def test_simulation_api_exposes_internal_endpoints() -> None:
    app = FastAPI()
    app.include_router(build_simulation_router(_SimulationServiceStub()))
    client = TestClient(app)

    scenarios = client.get("/api/simulations/scenarios")
    assert scenarios.status_code == 200
    assert scenarios.json()[0]["scenario_id"] == "scenario-1"

    patients = client.get("/api/simulations/patients")
    assert patients.status_code == 200
    assert patients.json()[0]["user_id"] == "user-001"

    run = client.post(
        "/api/simulations/runs",
        json={"scenario_id": "scenario-1"},
    )
    assert run.status_code == 200
    assert run.json()["run_id"] == "sim_1"

    report = client.get("/api/simulations/runs/sim_1/report")
    assert report.status_code == 200
    assert report.text == "# report"
