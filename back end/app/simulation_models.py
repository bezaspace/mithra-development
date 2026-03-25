from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field, model_validator


class SimulationScenario(BaseModel):
    scenario_id: str
    title: str
    patient_user_id: str
    starting_prompt: str
    conversation_plan: str
    user_persona: str
    max_turns: int = Field(default=8, ge=1, le=20)
    end_when: list[str] = Field(default_factory=list)
    expected_signals: list[str] = Field(default_factory=list)
    timezone: str | None = None


class SimulationRunRequest(BaseModel):
    scenario_id: str | None = None
    scenario: SimulationScenario | None = None
    patient_user_id: str | None = None
    assistant_model: str | None = None
    simulator_model: str | None = None
    timezone: str | None = None
    max_turns: int | None = Field(default=None, ge=1, le=20)

    @model_validator(mode="after")
    def validate_source(self) -> "SimulationRunRequest":
        if not self.scenario_id and self.scenario is None:
            raise ValueError("Provide scenario_id or scenario.")
        return self


class SimulationRunSummary(BaseModel):
    run_id: str
    scenario_id: str
    title: str
    patient_user_id: str
    patient_name: str
    status: str
    assistant_model: str
    simulator_model: str
    session_id: str
    turn_count: int
    output_dir: str
    markdown_report_path: str
    events_path: str
    started_at: str
    completed_at: str
    expected_signal_results: dict[str, bool] = Field(default_factory=dict)


class SimulationEvent(BaseModel):
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    run_id: str
    patient_user_id: str
    turn_id: int
    actor: str
    event_type: str
    payload: dict[str, Any]
    latency_ms: int | None = None


class SimulationTurnResult(BaseModel):
    assistant_reply: str
    assistant_fragments: list[str] = Field(default_factory=list)
    tool_calls: list[dict[str, Any]] = Field(default_factory=list)
    tool_outputs: list[dict[str, Any]] = Field(default_factory=list)
    emitted_events: list[dict[str, Any]] = Field(default_factory=list)


class SimulatedUserTurn(BaseModel):
    response: str
    done: bool = False
    done_reason: str | None = None
