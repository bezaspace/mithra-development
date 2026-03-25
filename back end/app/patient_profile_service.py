from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol
from typing import Any

from app.patient_profile_models import AllergyRecord
from app.patient_profile_models import BiomarkerTarget
from app.patient_profile_models import PatientProfile

PATIENT_PROFILE_STATE_KEY = "app:patient_profile"
BIOMARKER_TARGETS_STATE_KEY = "app:biomarker_targets"
PROFILE_AVAILABLE_STATE_KEY = "app:profile_available"
PROFILE_SUMMARY_STATE_KEY = "app:profile_summary"


@dataclass
class ProfileContextResult:
    state: dict[str, Any]
    profile_summary: str | None
    loaded: bool
    source: str
    message: str


@dataclass
class SimulationPatientContext:
    patient_user_id: str
    patient_name: str
    profile_summary: str
    prompt_context: str
    raw_context: dict[str, Any]


class PatientProfileLoader(Protocol):
    def get_by_user_id(self, user_id: str) -> PatientProfile | None: ...
    def list_all(self) -> list[dict[str, Any]]: ...


class PatientProfileService:
    def __init__(self, repository: PatientProfileLoader) -> None:
        self._repository = repository

    def list_patients(self) -> list[dict[str, Any]]:
        return self._repository.list_all()

    def load_profile_context(self, user_id: str) -> ProfileContextResult:
        profile = self._repository.get_by_user_id(user_id)
        if profile is None:
            return ProfileContextResult(
                state={
                    PROFILE_AVAILABLE_STATE_KEY: False,
                    PATIENT_PROFILE_STATE_KEY: {},
                    BIOMARKER_TARGETS_STATE_KEY: [],
                    PROFILE_SUMMARY_STATE_KEY: "",
                },
                profile_summary=None,
                loaded=False,
                source="none",
                message="No saved patient profile found. Continuing with general guidance.",
            )

        summary = self._build_summary(profile)
        return ProfileContextResult(
            state={
                PROFILE_AVAILABLE_STATE_KEY: True,
                PATIENT_PROFILE_STATE_KEY: profile.model_dump(mode="json"),
                BIOMARKER_TARGETS_STATE_KEY: [
                    target.model_dump(mode="json")
                    for target in profile.biomarker_targets
                ],
                PROFILE_SUMMARY_STATE_KEY: summary,
            },
            profile_summary=summary,
            loaded=True,
            source="db",
            message="Loaded saved patient profile for personalized guidance.",
        )

    def load_simulation_context(self, user_id: str) -> SimulationPatientContext | None:
        profile = self._repository.get_by_user_id(user_id)
        if profile is None:
            return None

        summary = self._build_summary(profile)
        detailed_payload: dict[str, Any] = {}
        loader = getattr(self._repository, "get_simulation_patient", None)
        if callable(loader):
            loaded = loader(user_id)
            if isinstance(loaded, dict):
                detailed_payload = loaded

        patient_name = (
            str(detailed_payload.get("full_name", "")).strip()
            or str(profile.full_name or "").strip()
            or user_id
        )
        raw_context = {
            "user_id": user_id,
            "full_name": patient_name,
            "age": detailed_payload.get("age", profile.age),
            "sex": detailed_payload.get("sex", profile.sex),
            "phone": detailed_payload.get("phone"),
            "email": detailed_payload.get("email"),
            "surgery_info": detailed_payload.get("surgery_info", {}),
            "emergency_contact": detailed_payload.get("emergency_contact", {}),
            "profile": detailed_payload.get("profile", profile.model_dump(mode="json")),
        }

        return SimulationPatientContext(
            patient_user_id=user_id,
            patient_name=patient_name,
            profile_summary=summary,
            prompt_context=self._build_simulation_prompt_context(raw_context, summary),
            raw_context=raw_context,
        )

    @staticmethod
    def _build_summary(profile: PatientProfile) -> str:
        condition_names = [
            condition.name for condition in profile.conditions if condition.name
        ][:3]
        treatment_names = [
            treatment.name for treatment in profile.treatments if treatment.name
        ][:3]
        biomarker_labels = [
            PatientProfileService._format_biomarker_target(target)
            for target in profile.biomarker_targets
        ][:4]

        parts: list[str] = []
        if profile.full_name:
            parts.append(f"Patient: {profile.full_name}.")
        if condition_names:
            parts.append(f"Known conditions: {', '.join(condition_names)}.")
        if treatment_names:
            parts.append(f"Current or prior treatments: {', '.join(treatment_names)}.")
        if biomarker_labels:
            parts.append(f"Biomarker targets: {', '.join(biomarker_labels)}.")
        allergy_labels: list[str] = [
            PatientProfileService._format_allergy(allergy)
            for allergy in profile.allergies
        ]
        allergy_labels = [label for label in allergy_labels if label][:3]
        if allergy_labels:
            parts.append(f"Allergies: {', '.join(allergy_labels)}.")
        if profile.contraindications:
            parts.append(
                f"Contraindications: {', '.join(profile.contraindications[:3])}."
            )
        if profile.notes:
            parts.append(f"Clinician notes: {profile.notes}.")

        return " ".join(parts)

    @staticmethod
    def _format_biomarker_target(target: BiomarkerTarget) -> str:
        unit = f" {target.unit}" if target.unit else ""
        return f"{target.biomarker} ({target.target}{unit})"

    @staticmethod
    def _format_allergy(allergy: str | AllergyRecord) -> str:
        if isinstance(allergy, str):
            return allergy.strip()
        return allergy.allergen.strip()

    @staticmethod
    def _build_simulation_prompt_context(raw_context: dict[str, Any], summary: str) -> str:
        surgery = raw_context.get("surgery_info") or {}
        surgery_parts: list[str] = []
        surgery_type = str(surgery.get("type", "")).strip()
        surgery_reason = str(surgery.get("reason", "")).strip()
        surgery_date = str(surgery.get("date", "")).strip()
        if surgery_type:
            surgery_parts.append(f"Surgery: {surgery_type}.")
        if surgery_reason:
            surgery_parts.append(f"Reason: {surgery_reason}.")
        if surgery_date:
            surgery_parts.append(f"Surgery date: {surgery_date}.")

        demographic_parts: list[str] = []
        if raw_context.get("full_name"):
            demographic_parts.append(f"Patient name: {raw_context['full_name']}.")
        if raw_context.get("age") is not None:
            demographic_parts.append(f"Age: {raw_context['age']}.")
        if raw_context.get("sex"):
            demographic_parts.append(f"Sex: {raw_context['sex']}.")

        context_parts = demographic_parts + surgery_parts
        if summary:
            context_parts.append(f"Clinical summary: {summary}")

        return " ".join(context_parts).strip()
