from __future__ import annotations

from typing import Any, Callable

from google.adk.tools import ToolContext

from app.dashboard_repository import DashboardRepository
from app.schedule_service import SCHEDULE_TIMEZONE_STATE_KEY
from app.schedule_service import SCHEDULE_USER_ID_STATE_KEY
from app.schedule_service import ScheduleService


def build_schedule_tools(
    schedule_service: ScheduleService | None,
    dashboard_repository: DashboardRepository | None = None,
) -> list[Callable[..., dict[str, Any]]]:
    if schedule_service is None:
        return []

    def _resolve_user_id(tool_context: ToolContext | None) -> str:
        if tool_context is None:
            return "raksha-user"
        value = str(tool_context.state.get(SCHEDULE_USER_ID_STATE_KEY, "")).strip()
        return value or "raksha-user"

    def _resolve_timezone(tool_context: ToolContext | None, explicit_timezone: str | None) -> str | None:
        if explicit_timezone and explicit_timezone.strip():
            return explicit_timezone.strip()
        if tool_context is None:
            return None
        value = str(tool_context.state.get(SCHEDULE_TIMEZONE_STATE_KEY, "")).strip()
        return value or None

    def get_today_schedule(
        timezone: str | None = None,
        date: str | None = None,
        tool_context: ToolContext | None = None,
    ) -> dict[str, Any]:
        """
        Returns today's schedule and adherence timeline.
        Call this when the user asks what they should do now or asks for their daily plan.
        """
        user_id = _resolve_user_id(tool_context)
        resolved_timezone = _resolve_timezone(tool_context, timezone)
        schedule = schedule_service.get_today_schedule(
            user_id=user_id,
            timezone_name=resolved_timezone,
            date_str=date,
        )
        return {"type": "schedule_snapshot", **schedule}

    def get_current_schedule_item(
        timezone: str | None = None,
        now_iso: str | None = None,
        tool_context: ToolContext | None = None,
    ) -> dict[str, Any]:
        """
        Resolves the current schedule item for the local time window.
        Use this before answering questions like "what should I do now?" or "what's my next activity?"
        """
        user_id = _resolve_user_id(tool_context)
        resolved_timezone = _resolve_timezone(tool_context, timezone)
        result = schedule_service.get_current_schedule_item(
            user_id=user_id,
            timezone_name=resolved_timezone,
            now_iso=now_iso,
        )
        return {
            "type": "current_activity",
            "timezone": result.timezone,
            "localNowIso": result.local_now_iso,
            "inWindow": result.in_window,
            "currentItem": _serialize_item(result.current_item),
            "upcomingItem": _serialize_item(result.upcoming_item),
            "message": result.message,
        }

    def get_adherence_score(
        tool_context: ToolContext | None = None,
    ) -> dict[str, Any]:
        """
        Returns ONLY the adherence compliance score: overall percentage, weekly trend,
        per-activity breakdown, and today's completed/total counts.
        Call this when the user asks about adherence, compliance, how well they are following
        the plan, or their weekly completion. Do NOT call this for physiotherapy score or pain.
        """
        user_id = _resolve_user_id(tool_context)

        if dashboard_repository is None:
            return {
                "type": "adherence_stats",
                "overallAdherence": 0,
                "weeklyAdherence": [0, 0, 0, 0],
                "activityBreakdown": {},
                "todayCompleted": 0,
                "todayTotal": 0,
                "message": "Adherence statistics are not available.",
            }

        stats = dashboard_repository.get_adherence_stats(user_id)

        schedule = schedule_service.get_today_schedule(
            user_id=user_id,
            timezone_name=None,
            date_str=None,
        )
        items = schedule.get("items", [])
        today_total = len(items)
        today_completed = sum(
            1 for item in items
            if item.get("latestReport") and item["latestReport"].get("status") in ("done", "partial")
        )

        raw_breakdown = stats.get("by_activity", {})
        activity_breakdown = {
            "medication": raw_breakdown.get("medication", 0),
            "physical": raw_breakdown.get("activity", 0),
            "diet": raw_breakdown.get("diet", 0),
            "therapy": raw_breakdown.get("therapy", 0),
            "sleep": raw_breakdown.get("sleep", 0),
            "cognitive": raw_breakdown.get("cognitive", 0),
        }

        return {
            "type": "adherence_stats",
            "overallAdherence": stats.get("overall", 0),
            "weeklyAdherence": stats.get("weekly", [0, 0, 0, 0]),
            "activityBreakdown": activity_breakdown,
            "todayCompleted": today_completed,
            "todayTotal": today_total,
            "message": (
                f"Your overall adherence is {stats.get('overall', 0)}%. "
                f"Today you've completed {today_completed} out of {today_total} scheduled activities."
            ),
        }

    def get_physiotherapy_score(
        tool_context: ToolContext | None = None,
    ) -> dict[str, Any]:
        """
        Returns ONLY the physiotherapy recovery score trend (last 30 days) and latest score.
        Call this when the user asks about physiotherapy score, physio progress, recovery score,
        or how their physiotherapy is trending. Do NOT call this for adherence or pain.
        """
        user_id = _resolve_user_id(tool_context)
        if dashboard_repository is None:
            return {
                "type": "physiotherapy_score",
                "history": [],
                "latestScore": None,
                "message": "Physiotherapy score is not available.",
            }
        physio_history = dashboard_repository.get_physiotherapy_history(user_id)
        history = [{"date": p.date, "score": p.score} for p in physio_history]
        latest_score = history[-1]["score"] if history else None
        if latest_score is None:
            message = "No physiotherapy score is recorded yet."
        else:
            message = f"Your latest physiotherapy score is {latest_score} out of 100."
        return {
            "type": "physiotherapy_score",
            "history": history,
            "latestScore": latest_score,
            "message": message,
        }

    def get_pain_index(
        tool_context: ToolContext | None = None,
    ) -> dict[str, Any]:
        """
        Returns ONLY the pain index trend (last 30 days) and latest pain level (0-10).
        Call this when the user asks about pain, pain index, pain level, or whether their pain
        is improving. Do NOT call this for adherence or physiotherapy score.
        """
        user_id = _resolve_user_id(tool_context)
        if dashboard_repository is None:
            return {
                "type": "pain_index",
                "history": [],
                "latestValue": None,
                "message": "Pain index is not available.",
            }
        pain_history = dashboard_repository.get_pain_index_history(user_id)
        history = [{"date": p.date, "value": p.value} for p in pain_history]
        latest_value = history[-1]["value"] if history else None
        if latest_value is None:
            message = "No pain index is recorded yet."
        else:
            message = f"Your latest pain index is {latest_value} out of 10."
        return {
            "type": "pain_index",
            "history": history,
            "latestValue": latest_value,
            "message": message,
        }

    def save_adherence_report(
        schedule_item_id: str,
        status: str,
        followed_plan: bool,
        changes_made: str | None = None,
        felt_after: str | None = None,
        symptoms: str | None = None,
        notes: str | None = None,
        alert_level: str = "none",
        summary: str | None = None,
        timezone: str | None = None,
        reported_at_iso: str | None = None,
        conversation_turn_id: str | None = None,
        tool_context: ToolContext | None = None,
    ) -> dict[str, Any]:
        """
        Saves a structured adherence report linked to a schedule item.
        Call this after collecting check-in responses from the user.
        """
        user_id = _resolve_user_id(tool_context)
        resolved_timezone = _resolve_timezone(tool_context, timezone)
        session_id = None
        if tool_context is not None:
            session_id = str(getattr(tool_context, "invocation_id", "")).strip() or None
        return schedule_service.save_adherence_report(
            user_id=user_id,
            schedule_item_id=schedule_item_id,
            status=status,
            followed_plan=followed_plan,
            changes_made=changes_made,
            felt_after=felt_after,
            symptoms=symptoms,
            notes=notes,
            alert_level=alert_level,
            reported_at_iso=reported_at_iso,
            timezone_name=resolved_timezone,
            summary=summary,
            conversation_turn_id=conversation_turn_id,
            session_id=session_id,
        )

    return [
        get_today_schedule,
        get_current_schedule_item,
        get_adherence_score,
        get_physiotherapy_score,
        get_pain_index,
        save_adherence_report,
    ]


def _serialize_item(item: Any) -> dict[str, Any] | None:
    if item is None:
        return None
    return {
        "scheduleItemId": item.id,
        "activityType": item.activity_type.value,
        "title": item.title,
        "instructions": item.instructions,
        "windowStartLocal": item.window_start_local,
        "windowEndLocal": item.window_end_local,
        "displayOrder": item.display_order,
    }
