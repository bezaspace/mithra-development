from __future__ import annotations

from pathlib import Path

import pytest

from app.assistant_runtime import AssistantConversationContext
from app.assistant_runtime import AssistantTurnOutput
from app.patient_profile_service import SimulationPatientContext
from app.simulation_models import SimulatedUserTurn
from app.simulation_models import SimulationRunRequest
from app.simulation_models import SimulationScenario
from app.simulation_service import SimulationService


class _AssistantConversationStub:
    def __init__(self, *, patient_user_id: str) -> None:
        self.session_id = "session-test"
        self.model = "assistant-test"
        self.patient_user_id = patient_user_id
        self.messages: list[str] = []

    async def send_user_message(self, text: str) -> AssistantTurnOutput:
        self.messages.append(text)
        return AssistantTurnOutput(
            assistant_texts=["Here is your current recovery guidance."],
            tool_calls=[{"name": "get_current_schedule_item", "args": {"timezone": "UTC"}}],
            tool_outputs=[{"message": "It is currently time for your walk."}],
            emitted_events=[{"type": "schedule_snapshot", "items": []}],
        )


class _AssistantRuntimeFactoryStub:
    def __init__(self) -> None:
        self.user_ids: list[str] = []

    async def create_text_conversation(
        self,
        *,
        patient_user_id: str,
        timezone_name: str | None = None,
        model: str | None = None,
    ) -> AssistantConversationContext:
        self.user_ids.append(patient_user_id)
        return AssistantConversationContext(
            conversation=_AssistantConversationStub(patient_user_id=patient_user_id),
            profile_status_event={
                "type": "profile_status",
                "loaded": True,
                "source": "db",
                "message": "Loaded patient profile.",
            },
        )


class _PatientProfileServiceStub:
    def __init__(self, *, available: bool = True) -> None:
        self.available = available

    def list_patients(self) -> list[dict[str, str]]:
        return [{"user_id": "user-007", "full_name": "Test Patient"}]

    def load_simulation_context(self, user_id: str) -> SimulationPatientContext | None:
        if not self.available or user_id != "user-007":
            return None
        return SimulationPatientContext(
            patient_user_id="user-007",
            patient_name="Test Patient",
            profile_summary="Patient: Test Patient. Known conditions: Hypertension.",
            prompt_context="Patient name: Test Patient. Clinical summary: Hypertension.",
            raw_context={"user_id": "user-007"},
        )


class _ScheduleServiceStub:
    def get_today_schedule(
        self,
        *,
        user_id: str,
        timezone_name: str | None,
        date_str: str | None = None,
    ) -> dict[str, object]:
        return {
            "date": "2026-03-24",
            "timezone": timezone_name or "UTC",
            "items": [
                {
                    "title": "Walk",
                    "windowStartLocal": "10:00",
                    "windowEndLocal": "10:30",
                }
            ],
            "timeline": [],
        }


class _SimulatedPatientClientStub:
    async def generate_next_turn(
        self,
        *,
        scenario: SimulationScenario,
        patient_context: SimulationPatientContext,
        conversation_history: list[dict[str, str]],
        turn_id: int,
        schedule_snapshot: dict[str, object] | None,
    ) -> SimulatedUserTurn:
        return SimulatedUserTurn(response="Thanks, that helps.", done=True, done_reason="complete")


def _build_service(tmp_path: Path, *, patient_available: bool = True) -> tuple[SimulationService, _AssistantRuntimeFactoryStub]:
    factory = _AssistantRuntimeFactoryStub()
    service = SimulationService(
        assistant_runtime_factory=factory,
        patient_profile_service=_PatientProfileServiceStub(available=patient_available),
        schedule_service=_ScheduleServiceStub(),
        simulated_patient_client=_SimulatedPatientClientStub(),
        output_dir=tmp_path / "simulations",
        scenarios_dir=tmp_path / "scenarios",
        default_simulator_model="gemini-3.1-flash-lite-preview",
        default_assistant_model="assistant-test",
        default_max_turns=4,
    )
    return service, factory


@pytest.mark.asyncio
async def test_simulation_run_uses_same_patient_identity_and_writes_artifacts(tmp_path: Path) -> None:
    service, factory = _build_service(tmp_path)
    request = SimulationRunRequest(
        scenario=SimulationScenario(
            scenario_id="schedule_check",
            title="Schedule check",
            patient_user_id="user-007",
            starting_prompt="What should I do now?",
            conversation_plan="Ask for immediate guidance and stop after grounded help is given.",
            user_persona="Practical patient",
            max_turns=3,
            expected_signals=["tool:get_current_schedule_item", "event:schedule_snapshot"],
        )
    )

    summary = await service.run(request)

    assert factory.user_ids == ["user-007"]
    assert summary.patient_user_id == "user-007"
    assert summary.expected_signal_results["tool:get_current_schedule_item"] is True
    assert summary.expected_signal_results["event:schedule_snapshot"] is True
    assert Path(summary.markdown_report_path).exists()
    assert Path(summary.events_path).exists()
    assert "Test Patient" in Path(summary.markdown_report_path).read_text(encoding="utf-8")


@pytest.mark.asyncio
async def test_simulation_run_rejects_unknown_patient(tmp_path: Path) -> None:
    service, _factory = _build_service(tmp_path, patient_available=False)
    request = SimulationRunRequest(
        scenario=SimulationScenario(
            scenario_id="invalid_patient",
            title="Invalid patient",
            patient_user_id="user-404",
            starting_prompt="Hello",
            conversation_plan="Say hello.",
            user_persona="Plain patient",
        )
    )

    with pytest.raises(ValueError, match="Unknown patient_user_id"):
        await service.run(request)


@pytest.mark.asyncio
async def test_simulation_run_rejects_patient_override_mismatch(tmp_path: Path) -> None:
    service, _factory = _build_service(tmp_path)
    request = SimulationRunRequest(
        patient_user_id="user-999",
        scenario=SimulationScenario(
            scenario_id="mismatch",
            title="Mismatch",
            patient_user_id="user-007",
            starting_prompt="Hello",
            conversation_plan="Say hello.",
            user_persona="Plain patient",
        ),
    )

    with pytest.raises(ValueError, match="override must match"):
        await service.run(request)


@pytest.mark.asyncio
async def test_simulation_run_rejects_assistant_model_override(tmp_path: Path) -> None:
    service, _factory = _build_service(tmp_path)
    request = SimulationRunRequest(
        assistant_model="different-model",
        scenario=SimulationScenario(
            scenario_id="locked_model",
            title="Locked model",
            patient_user_id="user-007",
            starting_prompt="Hello",
            conversation_plan="Say hello.",
            user_persona="Plain patient",
        ),
    )

    with pytest.raises(ValueError, match="assistant_model must match"):
        await service.run(request)
