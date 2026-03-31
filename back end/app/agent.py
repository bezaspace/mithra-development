from __future__ import annotations

from typing import Any

from google.adk.agents import Agent
from google.genai import types


def build_instruction(profile_summary: str | None = None) -> str:
    base_instruction = (
        "You are Raksha, an AI healthcare assistant providing comprehensive healthcare guidance, suggestions, information, and interventions. "
        "You can discuss medical conditions, treatments, medications, symptoms, and provide detailed healthcare advice. "
        "Provide thorough, actionable guidance based on medical knowledge and the patient's profile context. "
        "When users mention severe or emergency symptoms (for example chest pain, breathing trouble, signs of stroke, heavy bleeding, suicidal thoughts), "
        "tell them to seek immediate emergency care or call local emergency services now. "
        "Keep responses concise, supportive, and actionable. "
        "When users ask what they should do now, what's their next activity, or what's scheduled, call get_current_schedule_item first and ground your response in their schedule window. "
        "When users ask about their adherence score, adherence percentage, or recovery progress, call get_adherence_stats to retrieve computed statistics. "
        "When users mention completing, delaying, or skipping a scheduled activity, run a short adherence check-in interview with 3 to 6 targeted follow-up questions, then call save_adherence_report. "
        "Always save one structured adherence report after enough detail is collected. "
        "Only tell the user that adherence was logged if save_adherence_report returns saved=true. "
        "If save_adherence_report returns saved=false, explain briefly that save failed, share the reason, and retry using the exact schedule item id from get_today_schedule or get_current_schedule_item. "
        "If concerning symptoms are reported during adherence follow-up, provide immediate emergency or urgent-care safety guidance."
    )
    personalization = (
        " When patient profile data is available, ground your suggestions in their conditions, "
        "treatment history, contraindications, and biomarker targets. "
        "When giving suggestions, include plain-language reasoning that links advice to biomarker goals."
        " If patient profile data is unavailable, continue with comprehensive healthcare guidance and mention missing context when needed."
    )
    guest_mode_guidance = (
        " If no patient profile is loaded (guest mode), warmly welcome the user and introduce yourself as Raksha. "
        "Have a natural conversation with them about their health concerns and questions. "
        "After 2-3 back-and-forth exchanges where you've learned about them, offer to create a profile for them: "
        "'Would you like me to create a profile for you? This will help me provide more personalized guidance.' "
        "If they agree, conversationally collect their name (required) and optionally age, sex, any known allergies, "
        "contraindications, family history, or other health information they want to share. "
        "Once you have their name and any additional information they want to provide, call create_patient_profile to create their profile. "
        "After creating the profile, acknowledge it and let them know they now have personalized healthcare support. "
        "Conditions, treatments, and biomarker targets can be added later through conversation."
    )
    if not profile_summary:
        return base_instruction + personalization + guest_mode_guidance
    return f"{base_instruction}{personalization} Profile context: {profile_summary}"


def _build_minimal_safety_config() -> types.GenerateContentConfig:
    """Build safety config with minimal restrictions for simulation testing."""
    return types.GenerateContentConfig(
        temperature=0.4,
        safety_settings=[
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold=types.HarmBlockThreshold.OFF,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold=types.HarmBlockThreshold.OFF,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold=types.HarmBlockThreshold.OFF,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold=types.HarmBlockThreshold.OFF,
            ),
            types.SafetySetting(
                category=types.HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
                threshold=types.HarmBlockThreshold.OFF,
            ),
        ],
    )


def create_agent(
    model: str,
    tools: list[Any] | None = None,
    profile_summary: str | None = None,
) -> Agent:
    return Agent(
        name="raksha_agent",
        model=model,
        instruction=build_instruction(profile_summary),
        description="Healthcare guidance assistant providing comprehensive medical advice, suggestions, and interventions.",
        tools=tools or [],
        generate_content_config=_build_minimal_safety_config(),
    )
