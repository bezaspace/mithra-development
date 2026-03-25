from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response

from app.simulation_models import SimulationRunRequest
from app.simulation_service import SimulationService


def build_simulation_router(simulation_service: SimulationService) -> APIRouter:
    router = APIRouter(prefix="/api/simulations", tags=["simulations"])

    @router.get("/scenarios")
    async def list_scenarios() -> list[dict[str, object]]:
        return [
            scenario.model_dump(mode="json")
            for scenario in simulation_service.list_scenarios()
        ]

    @router.get("/patients")
    async def list_patients() -> list[dict[str, object]]:
        return simulation_service.list_patients()

    @router.post("/runs")
    async def create_run(request: SimulationRunRequest) -> dict[str, object]:
        try:
            summary = await simulation_service.run(request)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return summary.model_dump(mode="json")

    @router.get("/runs/{run_id}")
    async def get_run(run_id: str) -> dict[str, object]:
        try:
            return simulation_service.get_run_summary(run_id)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Run not found.") from exc

    @router.get("/runs/{run_id}/report")
    async def get_run_report(run_id: str) -> Response:
        try:
            report = simulation_service.get_run_report(run_id)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Run not found.") from exc
        return Response(content=report, media_type="text/markdown")

    @router.get("/runs/{run_id}/events")
    async def get_run_events(run_id: str) -> Response:
        try:
            events = simulation_service.get_run_events(run_id)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Run not found.") from exc
        return Response(content=events, media_type="application/x-ndjson")

    return router
