#!/usr/bin/env python3
"""
Comprehensive seed script for 30 diverse mock patients with full history.
"""

from __future__ import annotations

import json
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

# Add the backend directory to the path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

from app.dashboard_models import MilestoneRow, TreatmentPlanRow
from app.patient_profile_models import PatientProfileRow
from app.schedule_models import AdherenceReportRow, ScheduleItemRow

# Database path
DB_PATH = backend_dir / "app" / "data" / "patient_profiles.db"
DB_URL = f"sqlite:///{DB_PATH}"

NAMES = [
    "Rajesh Kumar", "Ananya Sharma", "Vikram Singh", "Priya Patel", "Amitabh Bachchan",
    "Deepika Padukone", "Ranbir Kapoor", "Alia Bhatt", "Shah Rukh Khan", "Priyanka Chopra",
    "Suresh Raina", "Mithali Raj", "Virat Kohli", "Smriti Mandhana", "Rohit Sharma",
    "Kavita Devi", "Sanjay Dutt", "Juhi Chawla", "Sunil Gavaskar", "Mary Kom",
    "Abhinav Bindra", "Saina Nehwal", "P.V. Sindhu", "Neeraj Chopra", "Hima Das",
    "Milind Soman", "Rahul Dravid", "Saurav Ganguly", "V.V.S. Laxman", "Sachin Tendulkar"
]

SURGERY_TYPES = [
    {
        "type": "Total Knee Replacement",
        "reason": "Severe osteoarthritis",
        "activities": [
            {"title": "Morning Meds", "type": "medication", "time": "08:00", "instr": ["Pain reliever", "Anti-inflammatory"]},
            {"title": "Knee Slides", "type": "activity", "time": "10:00", "instr": ["3 sets of 15 reps", "Keep back straight"]},
            {"title": "Healthy Lunch", "type": "diet", "time": "13:00", "instr": ["High protein", "Low sodium"]},
            {"title": "Physiotherapy", "type": "therapy", "time": "16:00", "instr": ["Range of motion", "Walking practice"]},
            {"title": "Evening Meds", "type": "medication", "time": "20:00", "instr": ["Before sleep meds"]}
        ],
        "milestones": ["First steps without walker", "Stitches removed", "90-degree flexion achieved"]
    },
    {
        "type": "Hip Replacement",
        "reason": "Hip joint degeneration",
        "activities": [
            {"title": "Morning Meds", "type": "medication", "time": "08:00", "instr": ["Blood thinner", "Pain management"]},
            {"title": "Glute Squeezes", "type": "activity", "time": "11:00", "instr": ["Hold for 5 secs", "10 reps"]},
            {"title": "Nutritious Lunch", "type": "diet", "time": "13:00", "instr": ["Vitamin C rich", "Fiber focus"]},
            {"title": "Short Walk", "type": "activity", "time": "15:00", "instr": ["10 mins in hallway"]},
            {"title": "Stretching", "type": "therapy", "time": "18:00", "instr": ["Gentle hip abduction"]}
        ],
        "milestones": ["Stairs climbed with one crutch", "Independent dressing", "Pain-free sleeping"]
    },
    {
        "type": "Heart Bypass",
        "reason": "Coronary artery disease",
        "activities": [
            {"title": "BP Meds", "type": "medication", "time": "08:30", "instr": ["Check BP first", "Take with water"]},
            {"title": "Cardiac Walk", "type": "activity", "time": "10:30", "instr": ["Slow pace", "5 mins", "Monitor heart rate"]},
            {"title": "Heart-Healthy Diet", "type": "diet", "time": "13:30", "instr": ["No added salt", "Leafy greens"]},
            {"title": "Breathing Exercises", "type": "therapy", "time": "16:30", "instr": ["Spirometer use", "10 deep breaths"]},
            {"title": "Statins", "type": "medication", "time": "21:30", "instr": ["Cholesterol management"]}
        ],
        "milestones": ["5-min walk without fatigue", "Normal ECG reading", "Cardiac rehab phase 1 complete"]
    }
]

def seed_database():
    print(f"Seeding 30 patients with FULL history to: {DB_PATH}")
    engine = create_engine(DB_URL)
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # 1. Clear ALL tables first to ensure clean state
        session.execute(text("DELETE FROM adherence_reports"))
        session.execute(text("DELETE FROM milestones"))
        session.execute(text("DELETE FROM schedule_items"))
        session.execute(text("DELETE FROM treatment_plans"))
        session.execute(text("DELETE FROM patient_profiles"))
        session.commit()

        today = datetime.now(timezone.utc)

        for i, name in enumerate(NAMES):
            user_id = f"user-{i+1:03d}"
            surg = random.choice(SURGERY_TYPES)
            
            # --- Patient Profile ---
            profile = PatientProfileRow(
                user_id=user_id,
                full_name=name,
                age=random.randint(30, 80),
                sex=random.choice(["Male", "Female"]),
                phone=f"+91 {random.randint(7000, 9999)} {random.randint(1000, 9999)}",
                email=f"{name.lower().replace(' ', '.')}@example.com",
                emergency_contact_json=json.dumps({"name": "Emergency Contact", "relation": "Spouse", "phone": "12345"}),
                surgery_info_json=json.dumps({
                    "type": surg["type"],
                    "date": (today - timedelta(days=20)).strftime("%Y-%m-%d"),
                    "reason": surg["reason"],
                    "surgeon": "Dr. Specialist",
                    "hospital": "City Hospital"
                }),
                conditions_json=json.dumps([{"name": "Hypertension", "status": "Controlled", "severity": "moderate"}]),
                treatments_json=json.dumps([{"name": "Standard Meds", "status": "ongoing", "dosage": "Daily"}]),
                allergies_json=json.dumps(["Penicillin"]),
                contraindications_json=json.dumps(["Avoid strenuous work"]),
                family_history_json=json.dumps(["Heart history"]),
                biomarker_targets_json=json.dumps([{"biomarker": "BP", "target": "<130/80", "unit": "mmHg", "status": "normal"}]),
            )
            session.add(profile)

            # --- Treatment Plan ---
            plan = TreatmentPlanRow(
                user_id=user_id,
                surgery_type=surg["type"],
                start_date=(today - timedelta(days=20)).strftime("%Y-%m-%d"),
                estimated_end_date=(today + timedelta(days=70)).strftime("%Y-%m-%d"),
                current_phase=2,
                phases_json=json.dumps([
                    {"phase_number": 1, "week": "1-2", "title": "Initial", "status": "completed"},
                    {"phase_number": 2, "week": "3-8", "title": "Active", "status": "active"},
                    {"phase_number": 3, "week": "9-12", "title": "Recovery", "status": "upcoming"}
                ])
            )
            session.add(plan)

            # --- Milestones ---
            for ms_name in surg["milestones"][:2]:
                ms = MilestoneRow(
                    user_id=user_id,
                    milestone=ms_name,
                    achieved_date=(today - timedelta(days=random.randint(1, 15))).strftime("%Y-%m-%d"),
                    phase=1
                )
                session.add(ms)

            # --- Schedule Items ---
            sched_ids = []
            for j, act in enumerate(surg["activities"]):
                item_id = f"sched-{user_id}-{j}"
                sched_ids.append((item_id, act["type"]))
                session.execute(text("""
                    INSERT INTO schedule_items (id, user_id, activity_type, title, instructions_json,
                        window_start_local, window_end_local, display_order, active, created_at, updated_at)
                    VALUES (:id, :user_id, :activity_type, :title, :instructions_json,
                        :window_start_local, :window_end_local, :display_order, :active, :created_at, :updated_at)
                """), {
                    "id": item_id,
                    "user_id": user_id,
                    "activity_type": act["type"],
                    "title": act["title"],
                    "instructions_json": json.dumps(act["instr"]),
                    "window_start_local": act["time"],
                    "window_end_local": act["time"], # Simplified
                    "display_order": j,
                    "active": True,
                    "created_at": today.isoformat(),
                    "updated_at": today.isoformat()
                })

            # --- Adherence Reports (4 weeks of history) ---
            # This is what makes the progress charts work
            for days_ago in range(1, 29):
                report_date = today - timedelta(days=days_ago)
                # For each day, generate reports for each schedule item
                for item_id, act_type in sched_ids:
                    # Randomize status to look realistic
                    r = random.random()
                    if r > 0.3: status = "done"
                    elif r > 0.1: status = "partial"
                    else: status = "skipped"

                    session.execute(text("""
                        INSERT INTO adherence_reports (id, user_id, schedule_item_id, report_date_local,
                            activity_type, status, followed_plan, alert_level, summary, reported_at_iso, created_at)
                        VALUES (:id, :user_id, :schedule_item_id, :report_date,
                            :activity_type, :status, :followed, :alert_level, :summary, :reported_at, :created_at)
                    """), {
                        "id": f"rep-{uuid4().hex[:8]}",
                        "user_id": user_id,
                        "schedule_item_id": item_id,
                        "report_date": report_date.strftime("%Y-%m-%d"),
                        "activity_type": act_type,
                        "status": status,
                        "followed": status == "done",
                        "alert_level": "none" if status == "done" else "watch",
                        "summary": f"Patient reported {status} for {act_type}.",
                        "reported_at": report_date.replace(hour=10).isoformat(),
                        "created_at": report_date.isoformat()
                    })

        session.commit()
    print("Comprehensive seeding complete!")

if __name__ == "__main__":
    seed_database()
