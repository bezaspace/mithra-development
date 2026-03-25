from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.agents.run_config import RunConfig
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.agent import create_agent
from app.booking_state import SessionBookingState
from app.doctor_repository import DoctorRepository
from app.doctor_tools import build_doctor_tools
from app.live_bridge import LiveBridge
from app.patient_profile_service import PatientProfileService
from app.patient_tools import build_patient_tools
from app.schedule_service import SCHEDULE_TIMEZONE_STATE_KEY
from app.schedule_service import SCHEDULE_USER_ID_STATE_KEY
from app.schedule_service import ScheduleService
from app.schedule_tools import build_schedule_tools


@dataclass
class AssistantTurnOutput:
    assistant_texts: list[str]
    tool_calls: list[dict[str, Any]]
    tool_outputs: list[dict[str, Any]]
    emitted_events: list[dict[str, Any]]


class AssistantConversation(Protocol):
    session_id: str
    model: str
    patient_user_id: str

    async def send_user_message(self, text: str) -> AssistantTurnOutput: ...


@dataclass
class AssistantConversationContext:
    conversation: AssistantConversation
    profile_status_event: dict[str, Any]


class ADKAssistantConversation:
    def __init__(
        self,
        *,
        runner: Runner,
        session_id: str,
        patient_user_id: str,
        model: str,
        live_request_queue: LiveRequestQueue,
        live_events: Any,
    ) -> None:
        self._runner = runner
        self.session_id = session_id
        self.patient_user_id = patient_user_id
        self.model = model
        self._live_request_queue = live_request_queue
        self._live_events = live_events

    async def send_user_message(self, text: str) -> AssistantTurnOutput:
        assistant_texts: list[str] = []
        tool_calls: list[dict[str, Any]] = []
        tool_outputs: list[dict[str, Any]] = []
        emitted_events: list[dict[str, Any]] = []
        saw_response = False

        content = types.Content(role="user", parts=[types.Part(text=text)])
        self._live_request_queue.send_content(content)

        while True:
            event = await anext(self._live_events)
            if getattr(event, "error_code", None) or getattr(event, "error_message", None):
                raise RuntimeError(
                    f"Live assistant error {getattr(event, 'error_code', 'unknown')}: "
                    f"{getattr(event, 'error_message', 'unknown error')}"
                )
            tool_calls.extend(_extract_function_calls(event))

            for function_response in LiveBridge._get_function_responses(event):
                raw_response = getattr(function_response, "response", None)
                normalized = _normalize_payload(raw_response)
                if normalized is not None:
                    tool_outputs.append(normalized)
                payload = LiveBridge._extract_ui_payload_from_function_response(function_response)
                if payload:
                    emitted_events.append(payload)
                saw_response = True

            output_t = getattr(event, "output_transcription", None)
            if output_t and getattr(output_t, "text", None):
                assistant_texts.append(str(output_t.text))
                saw_response = True

            event_content = getattr(event, "content", None)
            if event_content:
                for part in getattr(event_content, "parts", []) or []:
                    if getattr(part, "text", None):
                        assistant_texts.append(str(part.text))
                        saw_response = True

            if getattr(event, "turn_complete", None):
                break

        return AssistantTurnOutput(
            assistant_texts=assistant_texts,
            tool_calls=tool_calls,
            tool_outputs=tool_outputs,
            emitted_events=emitted_events,
        )


class AssistantRuntimeFactory:
    def __init__(
        self,
        *,
        app_name: str,
        default_model: str,
        gemini_api_key: str,
        patient_profile_service: PatientProfileService | None = None,
        schedule_service: ScheduleService | None = None,
    ) -> None:
        self._app_name = app_name
        self._default_model = default_model
        self._gemini_api_key = gemini_api_key
        self._patient_profile_service = patient_profile_service
        self._schedule_service = schedule_service
        self._session_service = InMemorySessionService()
        data_path = Path(__file__).resolve().parent / "data" / "mock_doctors.json"
        self._doctor_repository = DoctorRepository.from_json_file(data_path)

    async def create_text_conversation(
        self,
        *,
        patient_user_id: str,
        timezone_name: str | None = None,
        model: str | None = None,
    ) -> AssistantConversationContext:
        os.environ["GOOGLE_API_KEY"] = self._gemini_api_key
        os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "FALSE")

        profile_context = self._load_profile_context(patient_user_id)
        booking_state = SessionBookingState(self._doctor_repository.list_doctors())
        state = {
            **profile_context.state,
            SCHEDULE_USER_ID_STATE_KEY: patient_user_id,
        }
        if timezone_name and timezone_name.strip():
            state[SCHEDULE_TIMEZONE_STATE_KEY] = timezone_name.strip()

        tools = (
            build_doctor_tools(self._doctor_repository, booking_state)
            + build_patient_tools()
            + build_schedule_tools(self._schedule_service)
        )
        resolved_model = model or self._default_model
        agent = create_agent(
            resolved_model,
            tools=tools,
            profile_summary=profile_context.profile_summary,
        )
        runner = Runner(
            app_name=self._app_name,
            agent=agent,
            session_service=self._session_service,
        )
        session = await runner.session_service.create_session(
            app_name=self._app_name,
            user_id=patient_user_id,
            state=state,
        )
        live_request_queue = LiveRequestQueue()
        live_events = runner.run_live(
            user_id=patient_user_id,
            session_id=session.id,
            live_request_queue=live_request_queue,
            run_config=self._build_live_text_capture_config(),
        )
        return AssistantConversationContext(
            conversation=ADKAssistantConversation(
                runner=runner,
                session_id=session.id,
                patient_user_id=patient_user_id,
                model=resolved_model,
                live_request_queue=live_request_queue,
                live_events=live_events,
            ),
            profile_status_event={
                "type": "profile_status",
                "loaded": profile_context.loaded,
                "source": profile_context.source,
                "message": profile_context.message,
            },
        )

    def _load_profile_context(self, user_id: str):
        if self._patient_profile_service is None:
            return LiveBridge(
                app_name=self._app_name,
                model=self._default_model,
                gemini_api_key=self._gemini_api_key,
            )._load_profile_context(user_id)
        return self._patient_profile_service.load_profile_context(user_id)

    @staticmethod
    def _build_live_text_capture_config() -> RunConfig:
        return RunConfig(
            response_modalities=[types.Modality.AUDIO],
            output_audio_transcription=types.AudioTranscriptionConfig(),
            input_audio_transcription=types.AudioTranscriptionConfig(),
            realtime_input_config=types.RealtimeInputConfig(
                activity_handling=types.ActivityHandling.START_OF_ACTIVITY_INTERRUPTS,
                automatic_activity_detection=types.AutomaticActivityDetection(
                    disabled=True,
                    start_of_speech_sensitivity=types.StartSensitivity.START_SENSITIVITY_HIGH,
                    end_of_speech_sensitivity=types.EndSensitivity.END_SENSITIVITY_LOW,
                    prefix_padding_ms=80,
                    silence_duration_ms=300,
                ),
            ),
        )


def _extract_function_calls(event: Any) -> list[dict[str, Any]]:
    getter = getattr(event, "get_function_calls", None)
    if not callable(getter):
        return []

    normalized: list[dict[str, Any]] = []
    for function_call in getter() or []:
        name = str(getattr(function_call, "name", "")).strip()
        args = getattr(function_call, "args", None)
        if not isinstance(args, dict):
            args = {}
        normalized.append({"name": name, "args": args})
    return normalized


def _normalize_payload(raw_payload: Any) -> dict[str, Any] | None:
    if isinstance(raw_payload, dict):
        return raw_payload
    if isinstance(raw_payload, str):
        try:
            parsed = json.loads(raw_payload)
        except json.JSONDecodeError:
            return {"rawText": raw_payload}
        if isinstance(parsed, dict):
            return parsed
    return None
