from __future__ import annotations

from scripts.run_simulation import build_root_report_name
from scripts.run_simulation import build_request


def test_build_root_report_name_uses_patient_name() -> None:
    assert build_root_report_name("Rajesh Kumar") == "Rajesh Kumar_simulation.md"
    assert build_root_report_name("Patient:/01") == "Patient01_simulation.md"


def test_build_request_builds_inline_terminal_scenario() -> None:
    request = build_request(
        patient_user_id="user-001",
        patient_name="Rajesh Kumar",
        scenario_id=None,
        max_turns=5,
    )

    assert request.scenario is not None
    assert request.scenario.patient_user_id == "user-001"
    assert request.scenario.title == "Terminal quick simulation for Rajesh Kumar"
    assert request.scenario.max_turns == 5
