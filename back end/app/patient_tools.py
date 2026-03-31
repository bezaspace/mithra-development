from __future__ import annotations

from typing import Any, Callable

from app.patient_profile_service import BIOMARKER_TARGETS_STATE_KEY
from app.patient_profile_service import PATIENT_PROFILE_STATE_KEY
from app.patient_profile_service import PROFILE_AVAILABLE_STATE_KEY
from app.patient_profile_service import PROFILE_SUMMARY_STATE_KEY


def build_patient_tools() -> list[Callable[..., dict[str, Any]]]:
    def get_patient_profile_summary(tool_context) -> dict[str, Any]:
        """
        Returns persisted patient profile context for personalized recommendations.
        Use this when tailoring suggestions to conditions, treatments, and biomarker targets.
        """
        is_available = bool(tool_context.state.get(PROFILE_AVAILABLE_STATE_KEY, False))
        if not is_available:
            return {
                "profileAvailable": False,
                "message": "No saved patient profile is available for this user.",
                "profileSummary": "",
                "biomarkerTargets": [],
            }

        summary = str(tool_context.state.get(PROFILE_SUMMARY_STATE_KEY, "")).strip()
        profile = tool_context.state.get(PATIENT_PROFILE_STATE_KEY, {})
        biomarker_targets = tool_context.state.get(BIOMARKER_TARGETS_STATE_KEY, [])
        if not isinstance(profile, dict):
            profile = {}
        if not isinstance(biomarker_targets, list):
            biomarker_targets = []

        return {
            "profileAvailable": True,
            "profileSummary": summary,
            "biomarkerTargets": biomarker_targets,
            "conditions": profile.get("conditions", []),
            "treatments": profile.get("treatments", []),
            "allergies": profile.get("allergies", []),
            "contraindications": profile.get("contraindications", []),
        }

    def create_patient_profile(
        full_name: str,
        age: int | None = None,
        sex: str | None = None,
        allergies: list[str] | None = None,
        contraindications: list[str] | None = None,
        family_history: list[str] | None = None,
        notes: str | None = None,
    ) -> dict[str, Any]:
        """
        Create a new patient profile with the provided information.
        Call this when the user agrees to create a profile after you've collected their basic information.
        Required: full_name. Optional: age, sex, allergies, contraindications, family_history, notes.
        Returns a dict with created status and the new user_id.
        """
        import uuid
        import re

        # Create URL-safe ID from name
        name_slug = re.sub(r"[^a-zA-Z0-9\s]", "", full_name).lower().strip()
        name_slug = re.sub(r"\s+", "-", name_slug)

        # Add random suffix to ensure uniqueness
        random_suffix = uuid.uuid4().hex[:6]
        user_id = f"{name_slug}-{random_suffix}"

        return {
            "success": True,
            "user_id": user_id,
            "full_name": full_name,
            "age": age,
            "sex": sex,
            "allergies": allergies or [],
            "contraindications": contraindications or [],
            "family_history": family_history or [],
            "notes": notes,
            "message": f"Patient profile created successfully for {full_name}. The session will now be updated with the new profile.",
        }

    return [get_patient_profile_summary, create_patient_profile]
