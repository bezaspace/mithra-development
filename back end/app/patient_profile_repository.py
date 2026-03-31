from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine, select

from app.patient_profile_models import AllergyRecord
from app.patient_profile_models import PatientProfile
from app.patient_profile_models import PatientProfileRow

logger = logging.getLogger("raksha.patient_profile_repository")


class PatientProfileRepository:
    def __init__(self, db_url: str, seed_sql_path: Path) -> None:
        connect_args = (
            {"check_same_thread": False} if db_url.startswith("sqlite") else {}
        )
        self._engine = create_engine(db_url, connect_args=connect_args)
        self._seed_sql_path = seed_sql_path

    def initialize(self) -> None:
        SQLModel.metadata.create_all(self._engine)

        if not self._seed_sql_path.exists():
            logger.warning(
                "patient_profile_seed_missing seed_sql_path=%s",
                self._seed_sql_path,
            )
            return

        sql_script = self._seed_sql_path.read_text(encoding="utf-8").strip()
        if not sql_script:
            logger.warning(
                "patient_profile_seed_empty seed_sql_path=%s",
                self._seed_sql_path,
            )
            return

        statements = [
            statement.strip()
            for statement in sql_script.split(";")
            if statement.strip()
        ]
        if not statements:
            return

        with Session(self._engine) as session:
            for statement in statements:
                session.exec(text(statement))
            session.commit()

    def get_by_user_id(self, user_id: str) -> PatientProfile | None:
        normalized_user_id = user_id.strip()
        if not normalized_user_id:
            return None

        with Session(self._engine) as session:
            row = session.exec(
                select(PatientProfileRow).where(
                    PatientProfileRow.user_id == normalized_user_id
                )
            ).first()
            if row is None:
                return None
            return self._row_to_profile(row)

    def list_all(self) -> list[dict[str, Any]]:
        with Session(self._engine) as session:
            rows = session.exec(select(PatientProfileRow)).all()
            return [
                {"user_id": row.user_id, "full_name": row.full_name} for row in rows
            ]

    def _row_to_profile(self, row: PatientProfileRow) -> PatientProfile | None:
        try:
            conditions = self._decode_list(
                row.conditions_json, field_name="conditions_json", user_id=row.user_id
            )
            treatments = self._decode_list(
                row.treatments_json, field_name="treatments_json", user_id=row.user_id
            )
            allergies = self._normalize_allergies(
                self._decode_list(
                    row.allergies_json, field_name="allergies_json", user_id=row.user_id
                ),
                user_id=row.user_id,
            )
            contraindications = self._decode_list(
                row.contraindications_json,
                field_name="contraindications_json",
                user_id=row.user_id,
            )
            family_history = self._decode_list(
                row.family_history_json,
                field_name="family_history_json",
                user_id=row.user_id,
            )
            biomarker_targets = self._decode_list(
                row.biomarker_targets_json,
                field_name="biomarker_targets_json",
                user_id=row.user_id,
            )
        except ValueError:
            return None

        try:
            return PatientProfile.model_validate(
                {
                    "user_id": row.user_id,
                    "full_name": row.full_name,
                    "age": row.age,
                    "sex": row.sex,
                    "conditions": conditions,
                    "treatments": treatments,
                    "allergies": allergies,
                    "contraindications": contraindications,
                    "family_history": family_history,
                    "biomarker_targets": biomarker_targets,
                    "notes": row.notes,
                    "updated_at": row.updated_at,
                }
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "patient_profile_invalid_shape user_id=%s error_type=%s",
                row.user_id,
                type(exc).__name__,
            )
            return None

    @staticmethod
    def _normalize_allergies(
        raw_allergies: list[Any], *, user_id: str
    ) -> list[str | AllergyRecord]:
        normalized: list[str | AllergyRecord] = []
        for allergy in raw_allergies:
            if isinstance(allergy, str):
                cleaned = allergy.strip()
                if cleaned:
                    normalized.append(cleaned)
                continue

            if not isinstance(allergy, dict):
                logger.warning(
                    "patient_profile_allergy_ignored user_id=%s reason=unsupported_type type=%s",
                    user_id,
                    type(allergy).__name__,
                )
                continue

            allergen = str(allergy.get("allergen") or allergy.get("name") or "").strip()
            if not allergen:
                logger.warning(
                    "patient_profile_allergy_ignored user_id=%s reason=missing_allergen",
                    user_id,
                )
                continue

            normalized.append(
                AllergyRecord(
                    allergen=allergen,
                    reaction=PatientProfileRepository._optional_text(
                        allergy.get("reaction")
                    ),
                    severity=PatientProfileRepository._optional_text(
                        allergy.get("severity")
                    ),
                )
            )

        return normalized

    @staticmethod
    def _optional_text(value: Any) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        return text or None

    @staticmethod
    def _decode_list(raw: str, *, field_name: str, user_id: str) -> list[Any]:
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning(
                "patient_profile_json_decode_failed user_id=%s field=%s",
                user_id,
                field_name,
            )
            raise ValueError(field_name) from None

        if isinstance(parsed, list):
            return parsed

        logger.warning(
            "patient_profile_json_not_list user_id=%s field=%s",
            user_id,
            field_name,
        )
        raise ValueError(field_name)

    @staticmethod
    def _decode_object(
        raw: str | None, *, field_name: str, user_id: str
    ) -> dict[str, Any]:
        if raw is None:
            return {}
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning(
                "patient_profile_json_decode_failed user_id=%s field=%s",
                user_id,
                field_name,
            )
            return {}

        if isinstance(parsed, dict):
            return parsed

        logger.warning(
            "patient_profile_json_not_object user_id=%s field=%s",
            user_id,
            field_name,
        )
        return {}

    def insert(self, profile: PatientProfile) -> str:
        """Insert a new patient profile into the database."""
        row = PatientProfileRow(
            user_id=profile.user_id,
            full_name=profile.full_name,
            age=profile.age,
            sex=profile.sex,
            conditions_json=json.dumps(
                [c.model_dump(mode="json") for c in profile.conditions]
            ),
            treatments_json=json.dumps(
                [t.model_dump(mode="json") for t in profile.treatments]
            ),
            allergies_json=json.dumps(
                [
                    a.model_dump(mode="json") if isinstance(a, AllergyRecord) else a
                    for a in profile.allergies
                ]
            ),
            contraindications_json=json.dumps(profile.contraindications),
            family_history_json=json.dumps(profile.family_history),
            biomarker_targets_json=json.dumps(
                [b.model_dump(mode="json") for b in profile.biomarker_targets]
            ),
            notes=profile.notes,
            updated_at=profile.updated_at or datetime.now(timezone.utc).isoformat(),
        )

        with Session(self._engine) as session:
            session.add(row)
            session.commit()
            logger.info("patient_profile_created user_id=%s", profile.user_id)
            return profile.user_id
