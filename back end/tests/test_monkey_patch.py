from __future__ import annotations

import pytest
from google.genai import types

from app.monkey_patch import (
    _is_gemini_3_1_model,
    _patched_send_content,
    _patched_send_realtime,
)


class _SessionStub:
    def __init__(self) -> None:
        self.sent_inputs: list[object] = []
        self.realtime_calls: list[dict[str, object]] = []

    async def send(self, *, input: object) -> None:
        self.sent_inputs.append(input)

    async def send_realtime_input(self, **kwargs: object) -> None:
        self.realtime_calls.append(kwargs)


class _ConnectionStub:
    def __init__(self, model_version: str | None) -> None:
        self._model_version = model_version
        self._gemini_session = _SessionStub()


@pytest.mark.asyncio
async def test_patched_send_content_uses_realtime_text_for_gemini_3_1() -> None:
    connection = _ConnectionStub("gemini-3.1-flash-live-preview")
    content = types.Content(role="user", parts=[types.Part(text="hello world")])

    await _patched_send_content(connection, content)

    assert connection._gemini_session.realtime_calls == [{"text": "hello world"}]
    assert connection._gemini_session.sent_inputs == []


@pytest.mark.asyncio
async def test_patched_send_content_keeps_tool_response_path() -> None:
    connection = _ConnectionStub("gemini-3.1-flash-live-preview")
    response = types.FunctionResponse(name="publish_recommendations", response={})
    content = types.Content(
        role="tool",
        parts=[types.Part(function_response=response)],
    )

    await _patched_send_content(connection, content)

    assert len(connection._gemini_session.sent_inputs) == 1
    assert connection._gemini_session.realtime_calls == []


@pytest.mark.asyncio
async def test_patched_send_content_keeps_legacy_content_path_for_non_3_1() -> None:
    connection = _ConnectionStub("gemini-2.0-flash-live-001")
    content = types.Content(role="user", parts=[types.Part(text="hello world")])

    await _patched_send_content(connection, content)

    assert len(connection._gemini_session.sent_inputs) == 1
    assert connection._gemini_session.realtime_calls == []


@pytest.mark.asyncio
async def test_patched_send_realtime_uses_audio_field_for_audio_blobs() -> None:
    connection = _ConnectionStub("gemini-3.1-flash-live-preview")
    audio_blob = types.Blob(data=b"\x00\x01", mime_type="audio/pcm;rate=16000")

    await _patched_send_realtime(connection, audio_blob)

    assert connection._gemini_session.realtime_calls == [{"audio": audio_blob}]


@pytest.mark.asyncio
async def test_patched_send_realtime_keeps_media_field_for_non_audio_blobs() -> None:
    connection = _ConnectionStub("gemini-3.1-flash-live-preview")
    image_blob = types.Blob(data=b"\x89PNG", mime_type="image/png")

    await _patched_send_realtime(connection, image_blob)

    assert connection._gemini_session.realtime_calls == [{"media": image_blob}]


def test_detects_gemini_3_1_models() -> None:
    assert _is_gemini_3_1_model("gemini-3.1-flash-live-preview") is True
    assert _is_gemini_3_1_model("gemini-2.0-flash-live-001") is False
    assert _is_gemini_3_1_model(None) is False
