"""Runtime ADK compatibility patch for Gemini 3.1 Flash Live."""

from __future__ import annotations

import logging
import platform
from importlib import metadata
from typing import TYPE_CHECKING, Any

from google.genai import types

if TYPE_CHECKING:
    from google.adk.models.gemini_llm_connection import GeminiLlmConnection


logger = logging.getLogger("raksha.monkey_patch")


def _package_version(name: str) -> str:
    try:
        return metadata.version(name)
    except metadata.PackageNotFoundError:
        return "unknown"


def _is_gemini_3_1_model(model_version: str | None) -> bool:
    return bool(model_version and "3.1" in model_version)


async def _patched_send_content(
    self: "GeminiLlmConnection", content: types.Content
) -> None:
    """Route Gemini 3.1 text turns through the realtime text channel."""
    assert content.parts
    if content.parts[0].function_response:
        function_responses = [part.function_response for part in content.parts]
        logger.debug("Sending LLM function response: %s", function_responses)
        await self._gemini_session.send(
            input=types.LiveClientToolResponse(
                function_responses=function_responses
            ),
        )
        return

    if _is_gemini_3_1_model(getattr(self, "_model_version", None)):
        text_parts = [part.text for part in content.parts if part.text]
        if text_parts:
            full_text = "".join(text_parts)
            logger.debug(
                "Gemini 3.1 model detected; routing text content through send_realtime_input(text=...)"
            )
            await self._gemini_session.send_realtime_input(text=full_text)
            return

        logger.warning("No text parts found in content for Gemini 3.1 live turn")
        return

    logger.debug("Sending LLM new content %s", content)
    await self._gemini_session.send(
        input=types.LiveClientContent(
            turns=[content],
            turn_complete=True,
        )
    )


async def _patched_send_realtime(
    self: "GeminiLlmConnection", input: Any
) -> None:
    """Force audio blobs onto the new live API audio field."""
    if isinstance(input, types.Blob):
        logger.debug("Sending LLM Blob.")
        if input.mime_type and input.mime_type.startswith("audio/"):
            await self._gemini_session.send_realtime_input(audio=input)
            return
        await self._gemini_session.send_realtime_input(media=input)
        return

    if isinstance(input, types.ActivityStart):
        logger.debug("Sending LLM activity start signal.")
        await self._gemini_session.send_realtime_input(activity_start=input)
        return

    if isinstance(input, types.ActivityEnd):
        logger.debug("Sending LLM activity end signal.")
        await self._gemini_session.send_realtime_input(activity_end=input)
        return

    raise ValueError("Unsupported input type: %s" % type(input))


def patch_gemini_3_1_support():
    """Apply monkey-patches to ADK for Gemini 3.1 Flash Live compatibility."""
    try:
        from google.adk.models import gemini_llm_connection

        gemini_llm_connection.GeminiLlmConnection.send_content = _patched_send_content
        gemini_llm_connection.GeminiLlmConnection.send_realtime = _patched_send_realtime

        print(
            "[RAKSHA] ADK live compatibility patch active "
            f"(python={platform.python_version()}, "
            f"google-adk={_package_version('google-adk')}, "
            f"google-genai={_package_version('google-genai')}, "
            "patched=send_content,send_realtime)"
        )

    except ImportError as e:
        print(f"[RAKSHA] Failed to import gemini_llm_connection for monkey-patch: {e}")
    except Exception as e:
        print(f"[RAKSHA] Failed to apply Gemini 3.1 monkey-patch: {e}")
