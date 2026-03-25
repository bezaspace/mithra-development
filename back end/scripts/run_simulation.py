from __future__ import annotations

import argparse
import asyncio
import re
import shutil
from pathlib import Path
import sys

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import simulation_service
from app.simulation_models import SimulationRunRequest
from app.simulation_models import SimulationScenario


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run a patient-grounded Raksha simulation from the terminal."
    )
    parser.add_argument(
        "patient",
        help="Patient user_id or full_name from the seeded patient database.",
    )
    parser.add_argument(
        "--scenario",
        dest="scenario_id",
        help="Optional scenario_id from /api/simulations/scenarios.",
    )
    parser.add_argument(
        "--max-turns",
        type=int,
        default=5,
        help="Maximum number of simulated user turns for an inline terminal scenario.",
    )
    return parser.parse_args()


async def main() -> int:
    args = parse_args()
    patient = resolve_patient(args.patient)
    if patient is None:
        print(
            f"[sim] Could not find a patient matching '{args.patient}'. "
            "Use a user_id like user-001 or the patient's full name."
        )
        return 1

    request = build_request(
        patient_user_id=str(patient["user_id"]),
        patient_name=str(patient["full_name"]),
        scenario_id=args.scenario_id,
        max_turns=args.max_turns,
    )
    try:
        summary = await simulation_service.run(request)
    except Exception as exc:  # noqa: BLE001
        model = getattr(simulation_service, "_default_assistant_model", "unknown")
        print(
            f"[sim] Simulation failed for patient {patient['user_id']} using model {model}: {type(exc).__name__}: {exc}"
        )
        return 1
    source_report = Path(summary.markdown_report_path)
    root_dir = Path(__file__).resolve().parents[2]
    root_report = root_dir / build_root_report_name(str(patient["full_name"]))
    shutil.copyfile(source_report, root_report)

    print(f"[sim] Patient: {patient['full_name']} ({patient['user_id']})")
    print(f"[sim] Run id: {summary.run_id}")
    print(f"[sim] Report: {root_report}")
    print(f"[sim] Events: {summary.events_path}")
    return 0


def resolve_patient(query: str) -> dict[str, str] | None:
    normalized = query.strip().casefold()
    if not normalized:
        return None

    patients = simulation_service.list_patients()
    for patient in patients:
        if str(patient.get("user_id", "")).strip().casefold() == normalized:
            return patient
    for patient in patients:
        if str(patient.get("full_name", "")).strip().casefold() == normalized:
            return patient
    return None


def build_request(
    *,
    patient_user_id: str,
    patient_name: str,
    scenario_id: str | None,
    max_turns: int,
) -> SimulationRunRequest:
    if scenario_id:
        return SimulationRunRequest(
            scenario_id=scenario_id,
            patient_user_id=patient_user_id,
            max_turns=max_turns,
        )

    return SimulationRunRequest(
        scenario=SimulationScenario(
            scenario_id=f"terminal_{patient_user_id}",
            title=f"Terminal quick simulation for {patient_name}",
            patient_user_id=patient_user_id,
            starting_prompt="Hi Raksha, what should I be doing right now for my recovery today?",
            conversation_plan=(
                "Act like the selected patient. Ask for current rehab guidance, answer follow-up "
                "questions naturally, and continue until the assistant provides grounded advice, "
                "logs one useful action, or the conversation reaches a natural stopping point."
            ),
            user_persona=(
                "Recovering neuro-rehabilitation patient who wants practical help and answers in a "
                "natural, human way."
            ),
            max_turns=max_turns,
            expected_signals=["tool:get_current_schedule_item"],
            end_when=["The assistant provides grounded recovery guidance."],
        )
    )


def build_root_report_name(patient_name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._ -]+", "", patient_name).strip()
    cleaned = cleaned or "patient"
    return f"{cleaned}_simulation.md"


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
