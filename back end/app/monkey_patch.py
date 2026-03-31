"""
Monkey-patch for Google ADK to support Gemini 3.1 Flash Live model.

This patch addresses the incompatibility between ADK v1.28.0 and
gemini-3.1-flash-live-preview model, which causes WebSocket errors 1007/1011.

Based on PR #5076: https://github.com/google/adk-python/pull/5076

The patch:
1. Patches send_content() to route text through send_realtime_input(text=...) for 3.1 models
   instead of wrapping in LiveClientContent which 3.1 rejects for non-function-response content
2. Ensures audio Blobs use the audio= parameter (already done in ADK v1.28.0)

This is a temporary fix until Google merges PR #5076 into an official release.
"""

import logging
from typing import TYPE_CHECKING

from google.genai import types

logger = logging.getLogger("raksha.monkey_patch")

if TYPE_CHECKING:
    from google.adk.models.gemini_llm_connection import GeminiLlmConnection


def patch_gemini_3_1_support():
    """Apply monkey-patches to ADK for Gemini 3.1 Flash Live compatibility."""
    try:
        from google.adk.models import gemini_llm_connection

        original_send_content = gemini_llm_connection.GeminiLlmConnection.send_content

        async def patched_send_content(
            self: "GeminiLlmConnection", content: types.Content
        ):
            """Patched send_content that routes text through send_realtime_input for 3.1 models."""
            assert content.parts
            if content.parts[0].function_response:
                # All parts have to be function responses - unchanged
                function_responses = [part.function_response for part in content.parts]
                logger.debug("Sending LLM function response: %s", function_responses)
                await self._gemini_session.send(
                    input=types.LiveClientToolResponse(
                        function_responses=function_responses
                    ),
                )
            else:
                # For 3.1 models, route text through send_realtime_input(text=...)
                # because 3.1 rejects LiveClientContent for non-function-response content
                if self._model_version and "3.1" in self._model_version:
                    logger.debug(
                        "Gemini 3.1 model detected - routing text through send_realtime_input(text=...)"
                    )
                    # Extract text from content parts
                    text_parts = [part.text for part in content.parts if part.text]
                    if text_parts:
                        full_text = "".join(text_parts)
                        await self._gemini_session.send_realtime_input(text=full_text)
                    else:
                        logger.warning("No text parts found in content for 3.1 model")
                else:
                    # Original behavior for non-3.1 models
                    logger.debug("Sending LLM new content %s", content)
                    await self._gemini_session.send(
                        input=types.LiveClientContent(
                            turns=[content],
                            turn_complete=True,
                        )
                    )

        gemini_llm_connection.GeminiLlmConnection.send_content = patched_send_content
        logger.info("Applied Gemini 3.1 Flash Live monkey-patch to send_content()")

    except ImportError as e:
        logger.error("Failed to import gemini_llm_connection for monkey-patch: %s", e)
    except Exception as e:
        logger.error("Failed to apply Gemini 3.1 monkey-patch: %s", e)
