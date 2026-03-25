from __future__ import annotations

import asyncio
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter
from typing import Any, Protocol
from uuid import uuid4

from google import genai

from app.assistant_runtime import AssistantConversationContext
from app.assistant_runtime import AssistantRuntimeFactory
from app.patient_profile_service import PatientProfileService
from app.patient_profile_service import SimulationPatientContext
from app.schedule_service import ScheduleService
from app.simulation_models import SimulatedUserTurn
from app.simulation_models import SimulationEvent
from app.simulation_models import SimulationRunRequest
from app.simulation_models import SimulationRunSummary
from app.simulation_models import SimulationScenario
from app.simulation_models import SimulationTurnResult


class SimulatedPatientClient(Protocol):
    async def generate_next_turn(
        self,
        *,
        scenario: SimulationScenario,
        patient_context: SimulationPatientContext,
        conversation_history: list[dict[str, str]],
        turn_id: int,
        schedule_snapshot: dict[str, Any] | None,
    ) -> SimulatedUserTurn: ...


@dataclass
class ResolvedScenario:
    scenario: SimulationScenario
    patient_context: SimulationPatientContext
    timezone_name: str | None
    max_turns: int


class GeminiSimulatedPatientClient:
    def __init__(self, *, api_key: str, default_model: str) -> None:
        self._client = genai.Client(api_key=api_key)
        self._default_model = default_model

    async def generate_next_turn(
        self,
        *,
        scenario: SimulationScenario,
        patient_context: SimulationPatientContext,
        conversation_history: list[dict[str, str]],
        turn_id: int,
        schedule_snapshot: dict[str, Any] | None,
    ) -> SimulatedUserTurn:
        prompt = _build_simulated_patient_prompt(
            scenario=scenario,
            patient_context=patient_context,
            conversation_history=conversation_history,
            turn_id=turn_id,
            schedule_snapshot=schedule_snapshot,
        )
        response = await asyncio.to_thread(
            self._client.models.generate_content,
            model=self._default_model,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": {
                    "type": "object",
                    "properties": {
                        "response": {"type": "string"},
                        "done": {"type": "boolean"},
                        "done_reason": {"type": "string"},
                    },
                    "required": ["response", "done"],
                },
            },
        )
        try:
            payload = json.loads(response.text)
        except json.JSONDecodeError:
            payload = {"response": response.text, "done": False}
        return SimulatedUserTurn.model_validate(payload)


class SimulationService:
    def __init__(
        self,
        *,
        assistant_runtime_factory: AssistantRuntimeFactory,
        patient_profile_service: PatientProfileService,
        schedule_service: ScheduleService,
        simulated_patient_client: SimulatedPatientClient,
        output_dir: Path,
        scenarios_dir: Path,
        default_simulator_model: str,
        default_assistant_model: str,
        default_max_turns: int,
    ) -> None:
        self._assistant_runtime_factory = assistant_runtime_factory
        self._patient_profile_service = patient_profile_service
        self._schedule_service = schedule_service
        self._simulated_patient_client = simulated_patient_client
        self._output_dir = output_dir
        self._scenarios_dir = scenarios_dir
        self._default_simulator_model = default_simulator_model
        self._default_assistant_model = default_assistant_model
        self._default_max_turns = default_max_turns

    def list_scenarios(self) -> list[SimulationScenario]:
        if not self._scenarios_dir.exists():
            return []
        scenarios: list[SimulationScenario] = []
        for path in sorted(self._scenarios_dir.glob("*.json")):
            scenarios.append(
                SimulationScenario.model_validate_json(path.read_text(encoding="utf-8"))
            )
        return scenarios

    def list_patients(self) -> list[dict[str, Any]]:
        return self._patient_profile_service.list_patients()

    async def run(self, request: SimulationRunRequest) -> SimulationRunSummary:
        resolved = self._resolve_request(request)
        run_id = f"sim_{uuid4().hex[:10]}"
        run_dir = self._output_dir / run_id
        run_dir.mkdir(parents=True, exist_ok=True)

        assistant_context = await self._assistant_runtime_factory.create_text_conversation(
            patient_user_id=resolved.patient_context.patient_user_id,
            timezone_name=resolved.timezone_name,
            model=request.assistant_model,
        )
        started_at = datetime.now(timezone.utc).isoformat()
        schedule_snapshot = self._schedule_service.get_today_schedule(
            user_id=resolved.patient_context.patient_user_id,
            timezone_name=resolved.timezone_name,
        )
        events: list[SimulationEvent] = []
        turn_summaries: list[dict[str, Any]] = []

        events.append(
            SimulationEvent(
                run_id=run_id,
                patient_user_id=resolved.patient_context.patient_user_id,
                turn_id=0,
                actor="system",
                event_type="run_started",
                payload={
                    "scenario_id": resolved.scenario.scenario_id,
                    "title": resolved.scenario.title,
                    "patient_name": resolved.patient_context.patient_name,
                    "timezone": resolved.timezone_name,
                },
            )
        )
        events.append(
            SimulationEvent(
                run_id=run_id,
                patient_user_id=resolved.patient_context.patient_user_id,
                turn_id=0,
                actor="system",
                event_type="profile_status",
                payload=assistant_context.profile_status_event,
            )
        )
        events.append(
            SimulationEvent(
                run_id=run_id,
                patient_user_id=resolved.patient_context.patient_user_id,
                turn_id=0,
                actor="system",
                event_type="schedule_snapshot",
                payload=schedule_snapshot,
            )
        )

        conversation_history: list[dict[str, str]] = []
        pending_user_text = resolved.scenario.starting_prompt.strip()
        completed_turns = 0

        for turn_id in range(1, resolved.max_turns + 1):
            if not pending_user_text:
                break

            completed_turns = turn_id
            events.append(
                SimulationEvent(
                    run_id=run_id,
                    patient_user_id=resolved.patient_context.patient_user_id,
                    turn_id=turn_id,
                    actor="sim_user",
                    event_type="message",
                    payload={"text": pending_user_text},
                )
            )
            conversation_history.append({"role": "user", "text": pending_user_text})

            turn_started = perf_counter()
            turn_result = await self._run_assistant_turn(
                assistant_context=assistant_context,
                user_text=pending_user_text,
            )
            latency_ms = int((perf_counter() - turn_started) * 1000)

            for fragment in turn_result.assistant_fragments:
                events.append(
                    SimulationEvent(
                        run_id=run_id,
                        patient_user_id=resolved.patient_context.patient_user_id,
                        turn_id=turn_id,
                        actor="assistant",
                        event_type="message_fragment",
                        payload={"text": fragment},
                        latency_ms=latency_ms,
                    )
                )
            for tool_call in turn_result.tool_calls:
                events.append(
                    SimulationEvent(
                        run_id=run_id,
                        patient_user_id=resolved.patient_context.patient_user_id,
                        turn_id=turn_id,
                        actor="tool",
                        event_type="tool_call",
                        payload=tool_call,
                    )
                )
            for tool_output in turn_result.tool_outputs:
                events.append(
                    SimulationEvent(
                        run_id=run_id,
                        patient_user_id=resolved.patient_context.patient_user_id,
                        turn_id=turn_id,
                        actor="tool",
                        event_type="tool_output",
                        payload=tool_output,
                    )
                )
            for emitted_event in turn_result.emitted_events:
                events.append(
                    SimulationEvent(
                        run_id=run_id,
                        patient_user_id=resolved.patient_context.patient_user_id,
                        turn_id=turn_id,
                        actor="system",
                        event_type="emitted_event",
                        payload=emitted_event,
                    )
                )
            if turn_result.assistant_reply:
                conversation_history.append(
                    {"role": "assistant", "text": turn_result.assistant_reply}
                )

            turn_summaries.append(
                {
                    "turn_id": turn_id,
                    "user_text": pending_user_text,
                    "assistant_reply": turn_result.assistant_reply,
                    "tool_calls": turn_result.tool_calls,
                    "tool_outputs": turn_result.tool_outputs,
                    "emitted_events": turn_result.emitted_events,
                }
            )

            if turn_id >= resolved.max_turns:
                break

            simulated_turn = await self._simulated_patient_client.generate_next_turn(
                scenario=resolved.scenario,
                patient_context=resolved.patient_context,
                conversation_history=conversation_history,
                turn_id=turn_id + 1,
                schedule_snapshot=schedule_snapshot,
            )
            events.append(
                SimulationEvent(
                    run_id=run_id,
                    patient_user_id=resolved.patient_context.patient_user_id,
                    turn_id=turn_id,
                    actor="system",
                    event_type="simulator_decision",
                    payload=simulated_turn.model_dump(mode="json"),
                )
            )
            if simulated_turn.done:
                pending_user_text = ""
                break
            pending_user_text = simulated_turn.response.strip()

        completed_at = datetime.now(timezone.utc).isoformat()
        signal_results = self._evaluate_expected_signals(
            scenario=resolved.scenario,
            turn_summaries=turn_summaries,
            events=events,
        )

        summary = SimulationRunSummary(
            run_id=run_id,
            scenario_id=resolved.scenario.scenario_id,
            title=resolved.scenario.title,
            patient_user_id=resolved.patient_context.patient_user_id,
            patient_name=resolved.patient_context.patient_name,
            status="completed",
            assistant_model=request.assistant_model or self._default_assistant_model,
            simulator_model=request.simulator_model or self._default_simulator_model,
            session_id=assistant_context.conversation.session_id,
            turn_count=completed_turns,
            output_dir=str(run_dir),
            markdown_report_path=str(run_dir / "run.md"),
            events_path=str(run_dir / "events.jsonl"),
            started_at=started_at,
            completed_at=completed_at,
            expected_signal_results=signal_results,
        )
        self._write_artifacts(
            run_dir=run_dir,
            summary=summary,
            scenario=resolved.scenario,
            patient_context=resolved.patient_context,
            turn_summaries=turn_summaries,
            events=events,
        )
        return summary

    def get_run_summary(self, run_id: str) -> dict[str, Any]:
        return json.loads(
            (self._output_dir / run_id / "run_meta.json").read_text(encoding="utf-8")
        )

    def get_run_report(self, run_id: str) -> str:
        return (self._output_dir / run_id / "run.md").read_text(encoding="utf-8")

    def get_run_events(self, run_id: str) -> str:
        return (self._output_dir / run_id / "events.jsonl").read_text(encoding="utf-8")

    async def _run_assistant_turn(
        self,
        *,
        assistant_context: AssistantConversationContext,
        user_text: str,
    ) -> SimulationTurnResult:
        output = await assistant_context.conversation.send_user_message(user_text)
        assistant_reply = " ".join(fragment.strip() for fragment in output.assistant_texts if fragment.strip()).strip()
        return SimulationTurnResult(
            assistant_reply=assistant_reply,
            assistant_fragments=output.assistant_texts,
            tool_calls=output.tool_calls,
            tool_outputs=output.tool_outputs,
            emitted_events=output.emitted_events,
        )

    def _resolve_request(self, request: SimulationRunRequest) -> ResolvedScenario:
        if request.assistant_model and request.assistant_model != self._default_assistant_model:
            raise ValueError(
                "assistant_model must match the configured Gemini Live model for simulations."
            )
        scenario = self._resolve_scenario(request)
        patient_user_id = request.patient_user_id or scenario.patient_user_id
        if patient_user_id != scenario.patient_user_id:
            raise ValueError(
                "patient_user_id override must match the scenario patient_user_id."
            )

        patient_context = self._patient_profile_service.load_simulation_context(
            patient_user_id
        )
        if patient_context is None:
            raise ValueError(f"Unknown patient_user_id '{patient_user_id}'.")

        timezone_name = (
            request.timezone
            or scenario.timezone
            or os.environ.get("TZ")
            or "UTC"
        )
        max_turns = request.max_turns or scenario.max_turns or self._default_max_turns
        return ResolvedScenario(
            scenario=scenario,
            patient_context=patient_context,
            timezone_name=timezone_name,
            max_turns=max_turns,
        )

    def _resolve_scenario(self, request: SimulationRunRequest) -> SimulationScenario:
        if request.scenario is not None:
            return request.scenario

        for scenario in self.list_scenarios():
            if scenario.scenario_id == request.scenario_id:
                return scenario
        raise ValueError(f"Unknown scenario_id '{request.scenario_id}'.")

    def _write_artifacts(
        self,
        *,
        run_dir: Path,
        summary: SimulationRunSummary,
        scenario: SimulationScenario,
        patient_context: SimulationPatientContext,
        turn_summaries: list[dict[str, Any]],
        events: list[SimulationEvent],
    ) -> None:
        (run_dir / "events.jsonl").write_text(
            "".join(
                json.dumps(event.model_dump(mode="json"), ensure_ascii=True) + "\n"
                for event in events
            ),
            encoding="utf-8",
        )
        (run_dir / "run_meta.json").write_text(
            json.dumps(summary.model_dump(mode="json"), indent=2, ensure_ascii=True),
            encoding="utf-8",
        )
        (run_dir / "run.md").write_text(
            _build_markdown_report(
                summary=summary,
                scenario=scenario,
                patient_context=patient_context,
                turn_summaries=turn_summaries,
            ),
            encoding="utf-8",
        )

    def _evaluate_expected_signals(
        self,
        *,
        scenario: SimulationScenario,
        turn_summaries: list[dict[str, Any]],
        events: list[SimulationEvent],
    ) -> dict[str, bool]:
        results: dict[str, bool] = {}
        all_tool_calls = [
            tool_call
            for turn in turn_summaries
            for tool_call in turn.get("tool_calls", [])
        ]
        all_emitted_events = [
            event.payload
            for event in events
            if event.event_type == "emitted_event"
        ]
        all_replies = " ".join(
            str(turn.get("assistant_reply", "")) for turn in turn_summaries
        ).lower()

        for signal in scenario.expected_signals:
            if signal.startswith("tool:"):
                target = signal.split(":", 1)[1]
                results[signal] = any(
                    str(tool_call.get("name", "")) == target for tool_call in all_tool_calls
                )
                continue
            if signal.startswith("event:"):
                target = signal.split(":", 1)[1]
                results[signal] = any(
                    str(payload.get("type", "")) == target for payload in all_emitted_events
                )
                continue
            if signal.startswith("reply:"):
                target = signal.split(":", 1)[1].strip().lower()
                results[signal] = target in all_replies
                continue
            results[signal] = False

        return results


def _build_simulated_patient_prompt(
    *,
    scenario: SimulationScenario,
    patient_context: SimulationPatientContext,
    conversation_history: list[dict[str, str]],
    turn_id: int,
    schedule_snapshot: dict[str, Any] | None,
) -> str:
    schedule_lines: list[str] = []
    if schedule_snapshot:
        for item in schedule_snapshot.get("items", [])[:5]:
            title = str(item.get("title", "")).strip()
            start = str(item.get("windowStartLocal", "")).strip()
            end = str(item.get("windowEndLocal", "")).strip()
            if title:
                schedule_lines.append(f"- {title} ({start} to {end})")
    transcript = "\n".join(
        f"{entry['role'].upper()}: {entry['text']}" for entry in conversation_history[-12:]
    )
    schedule_block = "\n".join(schedule_lines) if schedule_lines else "- No schedule items loaded"

    return (
        "You are simulating a patient talking to a neuro-rehabilitation assistant.\n"
        f"Patient identity must remain fixed as {patient_context.patient_user_id} ({patient_context.patient_name}).\n"
        f"Persona: {scenario.user_persona}\n"
        f"Conversation plan: {scenario.conversation_plan}\n"
        f"Patient grounding: {patient_context.prompt_context}\n"
        f"Today's schedule:\n{schedule_block}\n"
        f"This is turn {turn_id}.\n"
        "Respond in first person as the patient. Be realistic, concise, and consistent with the profile. "
        "Do not reveal chart data unless it would naturally come up in conversation. "
        "If the scenario goals are complete, set done=true and keep response short.\n"
        f"Conversation so far:\n{transcript}\n"
    )


def _build_markdown_report(
    *,
    summary: SimulationRunSummary,
    scenario: SimulationScenario,
    patient_context: SimulationPatientContext,
    turn_summaries: list[dict[str, Any]],
) -> str:
    lines = [
        f"# Simulation Run {summary.run_id}",
        "",
        "## Summary",
        f"- Scenario: `{scenario.scenario_id}` - {scenario.title}",
        f"- Patient: `{summary.patient_user_id}` - {summary.patient_name}",
        f"- Assistant model: `{summary.assistant_model}`",
        f"- Simulator model: `{summary.simulator_model}`",
        f"- Assistant session: `{summary.session_id}`",
        f"- Started: `{summary.started_at}`",
        f"- Completed: `{summary.completed_at}`",
        "",
        "## Scenario",
        f"- Starting prompt: {scenario.starting_prompt}",
        f"- Conversation plan: {scenario.conversation_plan}",
        f"- Persona: {scenario.user_persona}",
        "",
        "## Patient Grounding",
        patient_context.prompt_context or "No patient context loaded.",
        "",
        "## Expected Signals",
    ]
    if summary.expected_signal_results:
        for signal, matched in summary.expected_signal_results.items():
            lines.append(f"- `{signal}`: {'matched' if matched else 'missing'}")
    else:
        lines.append("- None declared")

    lines.append("")
    lines.append("## Transcript")
    for turn in turn_summaries:
        lines.append("")
        lines.append(f"### Turn {turn['turn_id']}")
        lines.append(f"**Simulated patient:** {turn['user_text']}")
        lines.append("")
        lines.append(f"**Raksha:** {turn['assistant_reply'] or '(no text reply captured)'}")
        lines.append("")
        lines.append("**Tool calls**")
        if turn["tool_calls"]:
            for tool_call in turn["tool_calls"]:
                lines.append(
                    f"- `{tool_call.get('name', 'unknown')}` `{json.dumps(tool_call.get('args', {}), ensure_ascii=True)}`"
                )
        else:
            lines.append("- None")
        lines.append("")
        lines.append("**Tool outputs**")
        if turn["tool_outputs"]:
            for payload in turn["tool_outputs"]:
                lines.append("```json")
                lines.append(json.dumps(payload, indent=2, ensure_ascii=True))
                lines.append("```")
        else:
            lines.append("- None")
        lines.append("")
        lines.append("**Emitted events**")
        if turn["emitted_events"]:
            for payload in turn["emitted_events"]:
                lines.append("```json")
                lines.append(json.dumps(payload, indent=2, ensure_ascii=True))
                lines.append("```")
        else:
            lines.append("- None")
    lines.append("")
    return "\n".join(lines)
