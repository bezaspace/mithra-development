#!/usr/bin/env python3
"""
Seed script for 10 new patients with specific medical conditions.
These patients have medical conditions (non-surgical) with conditions,
treatments, contraindications, and allergies as specified in the requirements.

Usage:
    python scripts/seed_10_condition_patients.py
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

# ============================================================================
# 10 Patients with Specific Medical Conditions
# Each patient has conditions, treatments, contraindications, and allergies
# as specified, with mock data filling in missing demographics/context
# ============================================================================

PATIENTS = [
    {
        "user_id": "user-031",
        "full_name": "Emily Clark",
        "age": 62,
        "sex": "Female",
        "phone": "+91 9845 612789",
        "email": "emily.clark@example.com",
        "emergency_contact": {
            "name": "Robert Clark",
            "relation": "Son",
            "phone": "+91 9845 612790",
        },
        "surgery_info": None,
        "conditions": [
            {"name": "Coronary Artery Disease (CAD)", "status": "active", "severity": "severe"},
            {"name": "Post-Myocardial Infarction", "status": "recovering", "severity": "severe"},
            {"name": "Hyperlipidemia", "status": "controlled", "severity": "moderate"},
            {"name": "Hypertension", "status": "controlled", "severity": "moderate"},
        ],
        "treatments": [
            {"name": "Aspirin", "status": "ongoing", "dosage": "81 mg", "frequency": "Once daily", "purpose": "Antiplatelet - part of DAPT"},
            {"name": "Clopidogrel", "status": "ongoing", "dosage": "75 mg", "frequency": "Once daily", "purpose": "Antiplatelet - part of DAPT"},
            {"name": "Atorvastatin", "status": "ongoing", "dosage": "80 mg", "frequency": "Once daily at night", "purpose": "High-intensity statin for CAD"},
            {"name": "Metoprolol", "status": "ongoing", "dosage": "50 mg", "frequency": "Twice daily", "purpose": "Beta-blocker for heart rate control"},
            {"name": "Ramipril", "status": "ongoing", "dosage": "5 mg", "frequency": "Once daily", "purpose": "ACE inhibitor for BP and cardiac protection"},
        ],
        "allergies": [
            {"allergen": "Shellfish", "reaction": "Hives and swelling", "severity": "moderate"},
        ],
        "contraindications": [
            "NSAIDs - increased cardiovascular risk and bleeding risk with DAPT",
        ],
        "family_history": [
            "Father had myocardial infarction at age 58",
            "Mother had hypertension and stroke",
        ],
        "biomarker_targets": [
            {"biomarker": "LDL Cholesterol", "target": "< 70", "unit": "mg/dL", "rationale": "Very high cardiovascular risk post-MI"},
            {"biomarker": "Blood Pressure", "target": "< 130/80", "unit": "mmHg", "rationale": "Cardiac protection"},
            {"biomarker": "Heart Rate", "target": "60-70", "unit": "bpm", "rationale": "Beta-blocker titration target"},
            {"biomarker": "HbA1c", "target": "< 7.0", "unit": "%", "rationale": "Cardiovascular risk reduction"},
            {"biomarker": "Triglycerides", "target": "< 150", "unit": "mg/dL", "rationale": "Lipid management"},
        ],
        "notes": "Recent MI 3 months ago. Currently on dual antiplatelet therapy (DAPT) for 12 months post-MI. Monitor for bleeding signs. Cardiac rehab referral completed.",
        "schedule_items": [
            {"id": "sched-031-001", "activity_type": "medication", "title": "Morning Heart Medications", "instructions": ["Take Aspirin 81mg with food", "Take Clopidogrel 75mg", "Take Metoprolol 50mg with water"], "window_start_local": "08:00", "window_end_local": "08:30", "display_order": 1},
            {"id": "sched-031-002", "activity_type": "checkup", "title": "Blood Pressure Check", "instructions": ["Measure BP before medications", "Record in diary", "Report if >140/90 or <90/60"], "window_start_local": "07:30", "window_end_local": "08:00", "display_order": 2},
            {"id": "sched-031-003", "activity_type": "activity", "title": "Morning Cardiac Walk", "instructions": ["Walk at moderate pace - 20 minutes", "Keep heart rate below 100 bpm", "Stop if chest pain or shortness of breath"], "window_start_local": "10:00", "window_end_local": "10:30", "display_order": 3},
            {"id": "sched-031-004", "activity_type": "diet", "title": "Heart-Healthy Lunch", "instructions": ["Low sodium meal", "Include omega-3 rich fish", "Avoid processed foods", "Plenty of vegetables"], "window_start_local": "12:30", "window_end_local": "13:15", "display_order": 4},
            {"id": "sched-031-005", "activity_type": "medication", "title": "Evening Medications", "instructions": ["Take Atorvastatin 80mg at bedtime", "Take Ramipril 5mg", "Take Metoprolol 50mg"], "window_start_local": "20:00", "window_end_local": "20:30", "display_order": 5},
        ],
        "milestones": [
            {"milestone": "Completed cardiac stress test", "achieved_date": "2026-03-01", "phase": 1},
            {"milestone": "BP controlled on medications", "achieved_date": "2026-02-15", "phase": 1},
        ],
    },
    {
        "user_id": "user-032",
        "full_name": "David Kim",
        "age": 71,
        "sex": "Male",
        "phone": "+91 9765 432109",
        "email": "david.kim@example.com",
        "emergency_contact": {
            "name": "Susan Kim",
            "relation": "Spouse",
            "phone": "+91 9765 432110",
        },
        "surgery_info": None,
        "conditions": [
            {"name": "Atrial Fibrillation", "status": "active", "severity": "moderate"},
            {"name": "History of TIA", "status": "resolved", "severity": "moderate"},
            {"name": "Hypertension", "status": "controlled", "severity": "moderate"},
        ],
        "treatments": [
            {"name": "Warfarin", "status": "ongoing", "dosage": "5 mg", "frequency": "Once daily at night", "purpose": "Anticoagulation for AF"},
            {"name": "Diltiazem", "status": "ongoing", "dosage": "120 mg", "frequency": "Once daily", "purpose": "Rate control for AF"},
            {"name": "Lisinopril", "status": "ongoing", "dosage": "10 mg", "frequency": "Once daily", "purpose": "Blood pressure control"},
        ],
        "allergies": [
            {"allergen": "Aspirin", "reaction": "Gastrointestinal bleeding", "severity": "severe"},
        ],
        "contraindications": [
            "Cranberry juice - interferes with warfarin metabolism, increases bleeding risk",
        ],
        "family_history": [
            "Father had atrial fibrillation",
            "Brother had ischemic stroke at age 65",
        ],
        "biomarker_targets": [
            {"biomarker": "INR", "target": "2.0-3.0", "unit": "ratio", "rationale": "Therapeutic range for warfarin in AF"},
            {"biomarker": "Heart Rate", "target": "60-80", "unit": "bpm", "rationale": "Rate control target in AF"},
            {"biomarker": "Blood Pressure", "target": "< 140/90", "unit": "mmHg", "rationale": "Stroke prevention"},
            {"biomarker": "Creatinine", "target": "< 1.5", "unit": "mg/dL", "rationale": "Renal function monitoring on warfarin"},
        ],
        "notes": "Persistent atrial fibrillation with CHA2DS2-VASc score of 4 (age, hypertension, TIA history). High stroke risk. INR monitoring weekly. Avoid cranberry juice and other vitamin K sources variability.",
        "schedule_items": [
            {"id": "sched-032-001", "activity_type": "medication", "title": "Warfarin Dose", "instructions": ["Take Warfarin 5mg at same time daily", "Take with water, no food interactions", "Avoid cranberry juice"], "window_start_local": "20:00", "window_end_local": "20:30", "display_order": 1},
            {"id": "sched-032-002", "activity_type": "medication", "title": "Morning Medications", "instructions": ["Take Diltiazem 120mg", "Take Lisinopril 10mg"], "window_start_local": "08:00", "window_end_local": "08:30", "display_order": 2},
            {"id": "sched-032-003", "activity_type": "checkup", "title": "Pulse Check", "instructions": ["Check radial pulse for irregularity", "Count for 60 seconds", "Report if very fast or irregular"], "window_start_local": "09:00", "window_end_local": "09:15", "display_order": 3},
            {"id": "sched-032-004", "activity_type": "checkup", "title": "INR Lab Test (Weekly)", "instructions": ["Fasting not required", "Blood test at lab", "Avoid large dietary changes"], "window_start_local": "08:00", "window_end_local": "10:00", "display_order": 4, "notes": "Weekly INR monitoring"},
            {"id": "sched-032-005", "activity_type": "activity", "title": "Gentle Walking", "instructions": ["Walk 15-20 minutes", "Avoid strenuous activity", "Rest if palpitations occur"], "window_start_local": "16:00", "window_end_local": "16:30", "display_order": 5},
        ],
        "milestones": [
            {"milestone": "INR stable in therapeutic range", "achieved_date": "2026-03-05", "phase": 1},
            {"milestone": "No bleeding complications on warfarin", "achieved_date": "2026-02-20", "phase": 1},
        ],
    },
    {
        "user_id": "user-033",
        "full_name": "Sarah Patel",
        "age": 28,
        "sex": "Female",
        "phone": "+91 8123 456789",
        "email": "sarah.patel@example.com",
        "emergency_contact": {
            "name": "Priya Patel",
            "relation": "Mother",
            "phone": "+91 8123 456790",
        },
        "surgery_info": None,
        "conditions": [
            {"name": "Type 1 Diabetes Mellitus", "status": "active", "severity": "severe"},
            {"name": "Recurrent Hypoglycemia", "status": "active", "severity": "moderate"},
            {"name": "Insulin Pump Dependent", "status": "ongoing", "severity": "severe"},
        ],
        "treatments": [
            {"name": "Insulin Lispro (via pump)", "status": "ongoing", "dosage": "Variable basal/bolus", "frequency": "Continuous infusion", "purpose": "Rapid-acting insulin for glucose control"},
            {"name": "Insulin Detemir", "status": "ongoing", "dosage": "10 units", "frequency": "Once daily at bedtime", "purpose": "Basal insulin backup"},
            {"name": "Glucose Tablets", "status": "as needed", "dosage": "15g", "frequency": "As needed for hypoglycemia", "purpose": "Quick glucose for low blood sugar episodes"},
            {"name": "Glucagon Emergency Kit", "status": "as needed", "dosage": "1 mg", "frequency": "Emergency use only", "purpose": "Severe hypoglycemia treatment"},
        ],
        "allergies": [
            {"allergen": "Latex", "reaction": "Skin irritation", "severity": "mild"},
        ],
        "contraindications": [
            "Beta-blockers - mask hypoglycemia symptoms including tachycardia and tremors",
        ],
        "family_history": [
            "Maternal uncle has Type 1 diabetes",
            "No family history of cardiovascular disease",
        ],
        "biomarker_targets": [
            {"biomarker": "HbA1c", "target": "< 7.0", "unit": "%", "rationale": "Glycemic control without increasing hypoglycemia risk"},
            {"biomarker": "Fasting Glucose", "target": "80-130", "unit": "mg/dL", "rationale": "Morning glucose target"},
            {"biomarker": "Post-prandial Glucose", "target": "< 180", "unit": "mg/dL", "rationale": "2-hour post-meal target"},
            {"biomarker": "Time in Range", "target": "> 70%", "unit": "%", "rationale": "CGM/pump data metric - minimize hypo/hyper"},
            {"biomarker": "Glucose", "target": "> 70", "unit": "mg/dL", "rationale": "Critical hypoglycemia threshold"},
        ],
        "notes": "Type 1 diabetic since age 12. Insulin pump user with recurrent hypoglycemia, especially nocturnal. CGM recommended for better monitoring. Educate on beta-blocker avoidance. Emergency glucagon kit available.",
        "schedule_items": [
            {"id": "sched-033-001", "activity_type": "checkup", "title": "Morning Blood Glucose", "instructions": ["Check glucose before breakfast", "Adjust bolus insulin accordingly", "Log reading in diabetes diary"], "window_start_local": "06:30", "window_end_local": "07:00", "display_order": 1},
            {"id": "sched-033-002", "activity_type": "medication", "title": "Morning Insulin Bolus", "instructions": ["Calculate carbs and bolus insulin", "Take 15-20 mins before eating", "Adjust for correction factor if high"], "window_start_local": "07:30", "window_end_local": "08:00", "display_order": 2},
            {"id": "sched-033-003", "activity_type": "checkup", "title": "Pre-Lunch Glucose Check", "instructions": ["Check glucose before lunch", "Correct if needed before eating", "Watch for hypo symptoms"], "window_start_local": "12:00", "window_end_local": "12:15", "display_order": 3},
            {"id": "sched-033-004", "activity_type": "diet", "title": "Balanced Meals", "instructions": ["Count carbohydrates accurately", "Consistent meal timing", "Keep glucose tablets handy"], "window_start_local": "12:30", "window_end_local": "13:00", "display_order": 4},
            {"id": "sched-033-005", "activity_type": "checkup", "title": "Bedtime Glucose Check", "instructions": ["Check glucose before bed", "Set overnight pump alerts", "Snack if glucose < 120"], "window_start_local": "22:00", "window_end_local": "22:30", "display_order": 5},
            {"id": "sched-033-006", "activity_type": "activity", "title": "Light Exercise", "instructions": ["30 min walk or yoga", "Monitor glucose before, during, after", "Carry glucose tablets"], "window_start_local": "17:00", "window_end_local": "17:30", "display_order": 6},
        ],
        "milestones": [
            {"milestone": "CGM sensor fitted successfully", "achieved_date": "2026-03-10", "phase": 1},
            {"milestone": "Time in range improved to 65%", "achieved_date": "2026-03-01", "phase": 2},
        ],
    },
    {
        "user_id": "user-034",
        "full_name": "James Nguyen",
        "age": 55,
        "sex": "Male",
        "phone": "+91 9988 776655",
        "email": "james.nguyen@example.com",
        "emergency_contact": {
            "name": "Linh Nguyen",
            "relation": "Spouse",
            "phone": "+91 9988 776656",
        },
        "surgery_info": None,
        "conditions": [
            {"name": "Chronic Kidney Disease Stage 4", "status": "active", "severity": "severe"},
            {"name": "Renal Anemia", "status": "active", "severity": "moderate"},
            {"name": "Chronic Kidney Disease-Mineral Bone Disorder", "status": "active", "severity": "moderate"},
        ],
        "treatments": [
            {"name": "Epoetin Alfa (EPO)", "status": "ongoing", "dosage": "10,000 units", "frequency": "Once weekly subcutaneous", "purpose": "Treat renal anemia"},
            {"name": "Sevelamer", "status": "ongoing", "dosage": "800 mg", "frequency": "Three times daily with meals", "purpose": "Phosphate binder"},
            {"name": "Sodium Bicarbonate", "status": "ongoing", "dosage": "650 mg", "frequency": "Twice daily", "purpose": "Correct metabolic acidosis"},
            {"name": "Calcitriol", "status": "ongoing", "dosage": "0.25 mcg", "frequency": "Once daily", "purpose": "Vitamin D analog for secondary hyperparathyroidism"},
            {"name": "Folic Acid", "status": "ongoing", "dosage": "1 mg", "frequency": "Once daily", "purpose": "Support EPO therapy"},
        ],
        "allergies": [
            {"allergen": "Contrast dye", "reaction": "Acute kidney injury", "severity": "severe"},
        ],
        "contraindications": [
            "Iodinated contrast dye - risk of contrast-induced nephropathy",
        ],
        "family_history": [
            "Mother had polycystic kidney disease",
            "Father had hypertension",
        ],
        "biomarker_targets": [
            {"biomarker": "eGFR", "target": "15-29", "unit": "mL/min/1.73m²", "rationale": "CKD Stage 4 range - monitor for progression"},
            {"biomarker": "Hemoglobin", "target": "10-11.5", "unit": "g/dL", "rationale": "EPO therapy target - avoid overcorrection"},
            {"biomarker": "Phosphate", "target": "3.5-5.5", "unit": "mg/dL", "rationale": "Controlled with phosphate binders"},
            {"biomarker": "PTH", "target": "150-600", "unit": "pg/mL", "rationale": "Secondary hyperparathyroidism target for CKD 4"},
            {"biomarker": "Potassium", "target": "< 5.0", "unit": "mEq/L", "rationale": "Hyperkalemia risk in CKD"},
            {"biomarker": "Bicarbonate", "target": "> 22", "unit": "mEq/L", "rationale": "Acidosis correction"},
        ],
        "notes": "CKD Stage 4 due to diabetic nephropathy. Pre-dialysis planning phase. Avoid nephrotoxic drugs and contrast dye. EPO injections weekly. Nephrology follow-up monthly. Discuss dialysis access planning.",
        "schedule_items": [
            {"id": "sched-034-001", "activity_type": "medication", "title": "Morning Medications", "instructions": ["Take Sodium Bicarbonate 650mg", "Take Calcitriol 0.25mcg", "Take Folic Acid 1mg"], "window_start_local": "08:00", "window_end_local": "08:30", "display_order": 1},
            {"id": "sched-034-002", "activity_type": "medication", "title": "Phosphate Binders with Meals", "instructions": ["Take Sevelamer 800mg with breakfast", "Take with first bite of food", "Space from other medications"], "window_start_local": "08:15", "window_end_local": "08:30", "display_order": 2},
            {"id": "sched-034-003", "activity_type": "checkup", "title": "Daily Weight Check", "instructions": ["Weigh at same time daily", "Record weight in diary", "Report if gain > 2kg in 2 days"], "window_start_local": "07:00", "window_end_local": "07:15", "display_order": 3},
            {"id": "sched-034-004", "activity_type": "diet", "title": "Renal Diet Meals", "instructions": ["Low potassium diet", "Low phosphorus diet", "Moderate protein intake", "Limit sodium to 2g/day", "No contrast dye for any imaging"], "window_start_local": "12:30", "window_end_local": "13:15", "display_order": 4},
            {"id": "sched-034-005", "activity_type": "medication", "title": "EPO Injection Day (Weekly)", "instructions": ["Subcutaneous injection in abdomen or thigh", "Rotate injection sites", "Usually administered at clinic"], "window_start_local": "10:00", "window_end_local": "11:00", "display_order": 5, "notes": "Weekly EPO - clinic day"},
        ],
        "milestones": [
            {"milestone": "Hemoglobin stabilized at 10.5 g/dL", "achieved_date": "2026-03-08", "phase": 1},
            {"milestone": "Phosphate levels in target range", "achieved_date": "2026-02-25", "phase": 1},
        ],
    },
    {
        "user_id": "user-035",
        "full_name": "Rachel Thompson",
        "age": 35,
        "sex": "Female",
        "phone": "+91 7654 321098",
        "email": "rachel.thompson@example.com",
        "emergency_contact": {
            "name": "Michael Thompson",
            "relation": "Spouse",
            "phone": "+91 7654 321099",
        },
        "surgery_info": None,
        "conditions": [
            {"name": "Severe Persistent Asthma", "status": "active", "severity": "severe"},
            {"name": "Aspirin-Exacerbated Respiratory Disease", "status": "active", "severity": "severe"},
        ],
        "treatments": [
            {"name": "Fluticasone/Salmeterol (ICS/LABA)", "status": "ongoing", "dosage": "500/50 mcg", "frequency": "Twice daily", "purpose": "High-dose inhaled corticosteroid and long-acting beta-agonist"},
            {"name": "Montelukast", "status": "ongoing", "dosage": "10 mg", "frequency": "Once daily at night", "purpose": "Leukotriene receptor antagonist"},
            {"name": "Albuterol Rescue Inhaler", "status": "as needed", "dosage": "90 mcg/puff", "frequency": "As needed for symptoms", "purpose": "Quick-relief bronchodilator"},
            {"name": "Prednisone", "status": "intermittent", "dosage": "40 mg", "frequency": "Short course during exacerbations", "purpose": "Systemic corticosteroid for severe flares"},
        ],
        "allergies": [
            {"allergen": "Aspirin/NSAIDs", "reaction": "Severe bronchospasm, asthma exacerbation", "severity": "severe"},
            {"allergen": "Sulfites", "reaction": "Bronchospasm", "severity": "moderate"},
        ],
        "contraindications": [
            "NSAIDs including Aspirin - aspirin-sensitive asthma, risk of severe bronchospasm",
        ],
        "family_history": [
            "Mother has allergic rhinitis",
            "Father has asthma",
            "Sister has eczema",
        ],
        "biomarker_targets": [
            {"biomarker": "Peak Expiratory Flow", "target": "> 80%", "unit": "% personal best", "rationale": "Daily monitoring of lung function"},
            {"biomarker": "FEV1", "target": "> 80%", "unit": "% predicted", "rationale": "Spirometry target"},
            {"biomarker": "FeNO", "target": "< 25", "unit": "ppb", "rationale": "Airway inflammation marker"},
            {"biomarker": "Rescue Inhaler Use", "target": "< 2 days/week", "unit": "days", "rationale": "Well-controlled asthma target"},
        ],
        "notes": "Severe persistent asthma with aspirin-exacerbated respiratory disease (AERD). Requires high-dose ICS/LABA. Avoid all NSAIDs including aspirin. Aspirin desensitization may be considered in future. Carry rescue inhaler at all times. Asthma action plan in place.",
        "schedule_items": [
            {"id": "sched-035-001", "activity_type": "medication", "title": "Morning ICS/LABA Inhaler", "instructions": ["Use Fluticasone/Salmeterol 500/50mcg", "2 puffs with spacer", "Rinse mouth after use"], "window_start_local": "07:00", "window_end_local": "07:30", "display_order": 1},
            {"id": "sched-035-002", "activity_type": "checkup", "title": "Peak Flow Measurement", "instructions": ["Measure before medications", "Record in asthma diary", "Report if < 80% personal best"], "window_start_local": "06:45", "window_end_local": "07:00", "display_order": 2},
            {"id": "sched-035-003", "activity_type": "medication", "title": "Evening ICS/LABA Inhaler", "instructions": ["Use Fluticasone/Salmeterol 500/50mcg", "2 puffs with spacer", "Take Montelukast 10mg after"], "window_start_local": "20:00", "window_end_local": "20:30", "display_order": 3},
            {"id": "sched-035-004", "activity_type": "checkup", "title": "Symptom Monitoring", "instructions": ["Rate cough, wheeze, breathlessness 0-3", "Note any triggers encountered", "Log rescue inhaler uses"], "window_start_local": "21:00", "window_end_local": "21:15", "display_order": 4},
            {"id": "sched-035-005", "activity_type": "activity", "title": "Breathing Exercises", "instructions": ["Pursed lip breathing - 10 minutes", "Diaphragmatic breathing practice", "Avoid outdoor exercise if AQI > 100"], "window_start_local": "16:00", "window_end_local": "16:30", "display_order": 5},
        ],
        "milestones": [
            {"milestone": "PEF stable above 80% for 2 weeks", "achieved_date": "2026-03-12", "phase": 1},
            {"milestone": "No ER visits in past 3 months", "achieved_date": "2026-02-28", "phase": 1},
        ],
    },
    {
        "user_id": "user-036",
        "full_name": "Mark Sullivan",
        "age": 58,
        "sex": "Male",
        "phone": "+91 8765 432109",
        "email": "mark.sullivan@example.com",
        "emergency_contact": {
            "name": "Karen Sullivan",
            "relation": "Spouse",
            "phone": "+91 8765 432110",
        },
        "surgery_info": None,
        "conditions": [
            {"name": "Cirrhosis (Child-Pugh B)", "status": "active", "severity": "severe"},
            {"name": "Hepatic Encephalopathy Risk", "status": "active", "severity": "severe"},
            {"name": "Portal Hypertension", "status": "active", "severity": "severe"},
            {"name": "Ascites", "status": "controlled", "severity": "moderate"},
        ],
        "treatments": [
            {"name": "Lactulose", "status": "ongoing", "dosage": "30 mL", "frequency": "Three times daily", "purpose": "Prevent hepatic encephalopathy"},
            {"name": "Rifaximin", "status": "ongoing", "dosage": "550 mg", "frequency": "Twice daily", "purpose": "Reduce ammonia-producing bacteria"},
            {"name": "Spironolactone", "status": "ongoing", "dosage": "100 mg", "frequency": "Once daily", "purpose": "Diuretic for ascites"},
            {"name": "Furosemide", "status": "ongoing", "dosage": "40 mg", "frequency": "Once daily", "purpose": "Diuretic for ascites - used with spironolactone"},
            {"name": "Vitamin K", "status": "ongoing", "dosage": "10 mg", "frequency": "Once daily", "purpose": "Support coagulation"},
        ],
        "allergies": [
            {"allergen": "None known", "reaction": "N/A", "severity": "mild"},
        ],
        "contraindications": [
            "Opioids - precipitate hepatic encephalopathy, respiratory depression",
            "Sedatives/Benzodiazepines - precipitate hepatic encephalopathy, coma risk",
        ],
        "family_history": [
            "Father had alcohol use disorder",
            "Mother had hepatitis C",
        ],
        "biomarker_targets": [
            {"biomarker": "MELD Score", "target": "< 15", "unit": "score", "rationale": "Liver disease severity - transplant evaluation threshold"},
            {"biomarker": "Serum Albumin", "target": "> 3.5", "unit": "g/dL", "rationale": "Nutritional and synthetic function status"},
            {"biomarker": "Total Bilirubin", "target": "< 2.0", "unit": "mg/dL", "rationale": "Liver function"},
            {"biomarker": "INR", "target": "< 1.5", "unit": "ratio", "rationale": "Coagulation status - liver synthetic function"},
            {"biomarker": "Ammonia", "target": "< 50", "unit": "μmol/L", "rationale": "Hepatic encephalopathy prevention"},
            {"biomarker": "Weight", "target": "Stable", "unit": "kg", "rationale": "Monitor for fluid retention"},
        ],
        "notes": "Alcoholic cirrhosis Child-Pugh B. History of hepatic encephalopathy episode 6 months ago. Strictly avoid opioids, benzodiazepines, and all sedatives. Lactulose to maintain 2-3 soft stools daily. Liver transplant evaluation ongoing. GI bleeding risk due to portal hypertension.",
        "schedule_items": [
            {"id": "sched-036-001", "activity_type": "medication", "title": "Morning Lactulose", "instructions": ["Take Lactulose 30mL orally", "May mix with juice", "Aim for 2-3 soft stools daily"], "window_start_local": "07:00", "window_end_local": "07:30", "display_order": 1},
            {"id": "sched-036-002", "activity_type": "medication", "title": "Rifaximin and Diuretics", "instructions": ["Take Rifaximin 550mg with breakfast", "Take Spironolactone 100mg", "Take Furosemide 40mg"], "window_start_local": "08:00", "window_end_local": "08:30", "display_order": 2},
            {"id": "sched-036-003", "activity_type": "medication", "title": "Afternoon Lactulose", "instructions": ["Take Lactulose 30mL", "Adjust dose based on stool frequency"], "window_start_local": "14:00", "window_end_local": "14:30", "display_order": 3},
            {"id": "sched-036-004", "activity_type": "checkup", "title": "Daily Weight Check", "instructions": ["Weigh same time and clothes daily", "Record in diary", "Report if gain > 1kg/day or 2kg/week"], "window_start_local": "07:00", "window_end_local": "07:15", "display_order": 4},
            {"id": "sched-036-005", "activity_type": "diet", "title": "Liver-Friendly Diet", "instructions": ["Low sodium (< 2g/day)", "Adequate protein (1.2g/kg)", "Avoid alcohol completely", "Small frequent meals"], "window_start_local": "12:30", "window_end_local": "13:15", "display_order": 5},
            {"id": "sched-036-006", "activity_type": "medication", "title": "Nighttime Lactulose", "instructions": ["Take Lactulose 30mL at bedtime", "May need to adjust based on morning stools"], "window_start_local": "21:00", "window_end_local": "21:30", "display_order": 6},
        ],
        "milestones": [
            {"milestone": "No encephalopathy episodes for 6 months", "achieved_date": "2026-03-15", "phase": 1},
            {"milestone": "Ascites controlled without paracentesis", "achieved_date": "2026-02-20", "phase": 1},
        ],
    },
    {
        "user_id": "user-037",
        "full_name": "Lisa Chang",
        "age": 70,
        "sex": "Female",
        "phone": "+91 6543 210987",
        "email": "lisa.chang@example.com",
        "emergency_contact": {
            "name": "David Chang",
            "relation": "Son",
            "phone": "+91 6543 210988",
        },
        "surgery_info": None,
        "conditions": [
            {"name": "Osteoporosis", "status": "active", "severity": "severe"},
            {"name": "Vertebral Compression Fractures", "status": "active", "severity": "severe"},
            {"name": "Postmenopausal Osteoporosis", "status": "active", "severity": "severe"},
        ],
        "treatments": [
            {"name": "Alendronate", "status": "ongoing", "dosage": "70 mg", "frequency": "Once weekly", "purpose": "Bisphosphonate for bone density"},
            {"name": "Calcium Carbonate", "status": "ongoing", "dosage": "600 mg", "frequency": "Twice daily", "purpose": "Calcium supplementation"},
            {"name": "Vitamin D3", "status": "ongoing", "dosage": "1000 IU", "frequency": "Once daily", "purpose": "Vitamin D supplementation for calcium absorption"},
            {"name": "Calcitonin Nasal Spray", "status": "ongoing", "dosage": "200 IU", "frequency": "Every other day", "purpose": "Pain relief from fractures"},
        ],
        "allergies": [
            {"allergen": "None known", "reaction": "N/A", "severity": "mild"},
        ],
        "contraindications": [
            "Prolonged immobility - worsens bone loss, increases fracture risk",
        ],
        "family_history": [
            "Mother had osteoporosis and hip fracture",
            "Sister has osteopenia",
        ],
        "biomarker_targets": [
            {"biomarker": "DEXA T-score (Spine)", "target": "> -2.5", "unit": "SD", "rationale": "Improve bone density - currently -3.2"},
            {"biomarker": "DEXA T-score (Hip)", "target": "> -2.5", "unit": "SD", "rationale": "Improve bone density - currently -2.8"},
            {"biomarker": "Serum Vitamin D", "target": "30-50", "unit": "ng/mL", "rationale": "Sufficient vitamin D for calcium absorption"},
            {"biomarker": "Calcium (serum)", "target": "8.5-10.5", "unit": "mg/dL", "rationale": "Adequate calcium levels"},
            {"biomarker": "Bone Turnover Markers", "target": "Decreasing", "unit": "CTX/P1NP", "rationale": "Response to bisphosphonate therapy"},
        ],
        "notes": "Severe postmenopausal osteoporosis with T-score -3.2 spine. Two vertebral compression fractures in past year. On weekly alendronate - must sit upright 30 min after. Weight-bearing exercise encouraged. Fall prevention critical - home safety assessment completed.",
        "schedule_items": [
            {"id": "sched-037-001", "activity_type": "medication", "title": "Weekly Alendronate", "instructions": ["Take on empty stomach", "Take with full glass of water", "Sit upright for 30 minutes", "Do not eat or drink for 30 minutes after"], "window_start_local": "06:30", "window_end_local": "07:00", "display_order": 1, "notes": "Once weekly - Monday mornings"},
            {"id": "sched-037-002", "activity_type": "medication", "title": "Daily Supplements", "instructions": ["Take Calcium 600mg with breakfast", "Take Vitamin D3 1000IU with lunch", "Space from Alendronate by 2+ hours"], "window_start_local": "08:00", "window_end_local": "08:30", "display_order": 2},
            {"id": "sched-037-003", "activity_type": "activity", "title": "Weight-Bearing Exercise", "instructions": ["30 min walking - use sturdy shoes", "Chair exercises for balance", "Avoid high-impact activities", "Stop if back pain increases"], "window_start_local": "10:00", "window_end_local": "10:30", "display_order": 3},
            {"id": "sched-037-004", "activity_type": "medication", "title": "Calcitonin Nasal Spray", "instructions": ["200 IU in one nostril", "Alternate nostrils daily", "Use for fracture pain relief"], "window_start_local": "20:00", "window_end_local": "20:30", "display_order": 4},
            {"id": "sched-037-005", "activity_type": "activity", "title": "Balance and Fall Prevention", "instructions": ["Practice standing on one foot (hold support)", "Tai chi or yoga for seniors", "Ensure well-lit pathways at home", "Remove loose rugs"], "window_start_local": "16:00", "window_end_local": "16:30", "display_order": 5},
        ],
        "milestones": [
            {"milestone": "DEXA scan showing stable T-score", "achieved_date": "2026-03-10", "phase": 1},
            {"milestone": "No new fractures in 6 months", "achieved_date": "2026-02-15", "phase": 1},
        ],
    },
    {
        "user_id": "user-038",
        "full_name": "Tom Rodriguez",
        "age": 45,
        "sex": "Male",
        "phone": "+91 5432 109876",
        "email": "tom.rodriguez@example.com",
        "emergency_contact": {
            "name": "Maria Rodriguez",
            "relation": "Sister",
            "phone": "+91 5432 109877",
        },
        "surgery_info": None,
        "conditions": [
            {"name": "Schizophrenia", "status": "active", "severity": "severe"},
            {"name": "Treatment-Resistant Psychosis", "status": "active", "severity": "severe"},
        ],
        "treatments": [
            {"name": "Clozapine", "status": "ongoing", "dosage": "300 mg", "frequency": "Once daily at night", "purpose": "Atypical antipsychotic for treatment-resistant schizophrenia"},
            {"name": "Benztropine", "status": "ongoing", "dosage": "2 mg", "frequency": "Once daily", "purpose": "Anticholinergic for clozapine-induced EPS"},
            {"name": "Olanzapine", "status": "rescue", "dosage": "10 mg", "frequency": "As needed for acute agitation", "purpose": "Rescue medication for breakthrough psychosis"},
        ],
        "allergies": [
            {"allergen": "Haloperidol", "reaction": "Severe dystonia", "severity": "severe"},
        ],
        "contraindications": [
            "High caffeine intake - caffeine metabolism inhibited by clozapine, risk of toxicity and seizures",
        ],
        "family_history": [
            "Brother has schizophrenia",
            "Mother had bipolar disorder",
        ],
        "biomarker_targets": [
            {"biomarker": "Absolute Neutrophil Count (ANC)", "target": "> 1500", "unit": "/μL", "rationale": "Mandatory clozapine monitoring - agranulocytosis risk"},
            {"biomarker": "Fasting Glucose", "target": "< 126", "unit": "mg/dL", "rationale": "Metabolic syndrome screening on clozapine"},
            {"biomarker": "Lipid Panel", "target": "Normal range", "unit": "mg/dL", "rationale": "Clozapine-associated dyslipidemia monitoring"},
            {"biomarker": "PANSS Score", "target": "< 60", "unit": "score", "rationale": "Psychiatric symptom severity - target remission"},
            {"biomarker": "Clozapine Level", "target": "350-600", "unit": "ng/mL", "rationale": "Therapeutic drug monitoring"},
        ],
        "notes": "Treatment-resistant schizophrenia on clozapine 300mg. Requires weekly ANC monitoring (REMS program). Limit caffeine intake to < 200mg/day due to clozapine interaction. Monitor for metabolic syndrome. BMI currently 28 - weight management important. Long-acting injectable consideration if non-adherence risk.",
        "schedule_items": [
            {"id": "sched-038-001", "activity_type": "medication", "title": "Evening Clozapine", "instructions": ["Take Clozapine 300mg at bedtime", "Limit caffeine throughout day", "Take with or without food", "Report excessive sedation"], "window_start_local": "21:00", "window_end_local": "21:30", "display_order": 1},
            {"id": "sched-038-002", "activity_type": "medication", "title": "Morning Benztropine", "instructions": ["Take Benztropine 2mg", "May cause dry mouth - stay hydrated", "Report urinary difficulty"], "window_start_local": "08:00", "window_end_local": "08:30", "display_order": 2},
            {"id": "sched-038-003", "activity_type": "checkup", "title": "Weekly ANC Blood Test", "instructions": ["Blood draw for Absolute Neutrophil Count", "Required for clozapine REMS", "Do not skip - medication held if ANC low"], "window_start_local": "09:00", "window_end_local": "10:00", "display_order": 3, "notes": "Weekly ANC monitoring"},
            {"id": "sched-038-004", "activity_type": "checkup", "title": "Weight Check", "instructions": ["Weekly weight measurement", "Report gain > 2kg in a week", "Monitor for metabolic changes"], "window_start_local": "08:00", "window_end_local": "08:15", "display_order": 4},
            {"id": "sched-038-005", "activity_type": "activity", "title": "Daily Routine Activities", "instructions": ["Structured daily activities", "Light walking 20 minutes", "Social skills practice", "Limit caffeine - max 1 cup coffee"], "window_start_local": "14:00", "window_end_local": "15:00", "display_order": 5},
        ],
        "milestones": [
            {"milestone": "ANC stable above 2000 for 3 months", "achieved_date": "2026-03-15", "phase": 1},
            {"milestone": "PANSS score reduced to 55", "achieved_date": "2026-02-28", "phase": 2},
        ],
    },
    {
        "user_id": "user-039",
        "full_name": "Ava Wilson",
        "age": 32,
        "sex": "Female",
        "phone": "+91 4321 098765",
        "email": "ava.wilson@example.com",
        "emergency_contact": {
            "name": "James Wilson",
            "relation": "Father",
            "phone": "+91 4321 098766",
        },
        "surgery_info": None,
        "conditions": [
            {"name": "Systemic Lupus Erythematosus (SLE)", "status": "active", "severity": "severe"},
            {"name": "Lupus Nephritis", "status": "active", "severity": "severe"},
            {"name": "Lupus Arthritis", "status": "active", "severity": "moderate"},
        ],
        "treatments": [
            {"name": "Hydroxychloroquine", "status": "ongoing", "dosage": "200 mg", "frequency": "Twice daily", "purpose": "Foundation therapy for SLE"},
            {"name": "Mycophenolate Mofetil", "status": "ongoing", "dosage": "1000 mg", "frequency": "Twice daily", "purpose": "Immunosuppressive for lupus nephritis"},
            {"name": "Prednisone", "status": "ongoing", "dosage": "10 mg", "frequency": "Once daily (tapering)", "purpose": "Low-dose corticosteroid - tapering plan"},
            {"name": "Losartan", "status": "ongoing", "dosage": "50 mg", "frequency": "Once daily", "purpose": "Blood pressure control and renal protection"},
        ],
        "allergies": [
            {"allergen": "Sulfonamides", "reaction": "Severe lupus flare", "severity": "severe"},
        ],
        "contraindications": [
            "Sulfonamides - trigger severe lupus flare and worsen nephritis",
        ],
        "family_history": [
            "Mother has rheumatoid arthritis",
            "Maternal aunt has SLE",
            "Family history of autoimmune diseases",
        ],
        "biomarker_targets": [
            {"biomarker": "ANA", "target": "Negative or low titer", "unit": "titer", "rationale": "Disease activity marker"},
            {"biomarker": "Anti-dsDNA", "target": "Negative", "unit": "IU/mL", "rationale": "Specific lupus activity marker"},
            {"biomarker": "C3/C4 Complement", "target": "Normal range", "unit": "mg/dL", "rationale": "Complement consumption indicates active disease"},
            {"biomarker": "Creatinine", "target": "< 1.2", "unit": "mg/dL", "rationale": "Renal function in lupus nephritis"},
            {"biomarker": "Urine Protein/Creatinine", "target": "< 0.5", "unit": "g/g", "rationale": "Proteinuria target for lupus nephritis"},
            {"biomarker": "ESR", "target": "< 20", "unit": "mm/hr", "rationale": "Inflammation marker"},
        ],
        "notes": "Class IV lupus nephritis confirmed by biopsy. On mycophenolate and hydroxychloroquine. Steroid taper ongoing. Strictly avoid sulfonamides and other sulfa-containing medications. Sun protection essential. Reproductive counseling - mycophenolate teratogenic. Renal follow-up every 3 months.",
        "schedule_items": [
            {"id": "sched-039-001", "activity_type": "medication", "title": "Morning Medications", "instructions": ["Take Hydroxychloroquine 200mg", "Take Mycophenolate 1000mg with food", "Take Prednisone 10mg", "Take Losartan 50mg"], "window_start_local": "08:00", "window_end_local": "08:30", "display_order": 1},
            {"id": "sched-039-002", "activity_type": "medication", "title": "Evening Mycophenolate", "instructions": ["Take Mycophenolate 1000mg with food", "Avoid crushing tablets", "Report anyGI symptoms"], "window_start_local": "20:00", "window_end_local": "20:30", "display_order": 2},
            {"id": "sched-039-003", "activity_type": "checkup", "title": "Urine Protein Check (Weekly)", "instructions": ["Morning urine sample", "Dipstick test for protein", "Report if 2+ or greater"], "window_start_local": "07:00", "window_end_local": "07:30", "display_order": 3},
            {"id": "sched-039-004", "activity_type": "activity", "title": "Gentle Exercise", "instructions": ["30 min gentle walking indoors", "Yoga or stretching", "Avoid direct sun exposure", "Stay hydrated"], "window_start_local": "16:00", "window_end_local": "16:30", "display_order": 4},
            {"id": "sched-039-005", "activity_type": "diet", "title": "Renal-Friendly Diet", "instructions": ["Low sodium diet", "Moderate protein (0.8g/kg)", "Avoid raw/undercooked foods", "No sulfa-containing supplements"], "window_start_local": "12:30", "window_end_local": "13:15", "display_order": 5},
        ],
        "milestones": [
            {"milestone": "Proteinuria reduced to 0.3 g/g", "achieved_date": "2026-03-08", "phase": 1},
            {"milestone": "C3/C4 levels normalized", "achieved_date": "2026-02-22", "phase": 1},
        ],
    },
    {
        "user_id": "user-040",
        "full_name": "Ben Harris",
        "age": 66,
        "sex": "Male",
        "phone": "+91 3210 987654",
        "email": "ben.harris@example.com",
        "emergency_contact": {
            "name": "Patricia Harris",
            "relation": "Daughter",
            "phone": "+91 3210 987655",
        },
        "surgery_info": None,
        "conditions": [
            {"name": "Type 2 Diabetes Mellitus", "status": "active", "severity": "severe"},
            {"name": "Chronic Kidney Disease Stage 3", "status": "active", "severity": "moderate"},
            {"name": "Hypertension", "status": "controlled", "severity": "moderate"},
        ],
        "treatments": [
            {"name": "Empagliflozin (SGLT2 inhibitor)", "status": "ongoing", "dosage": "10 mg", "frequency": "Once daily", "purpose": "Glucose control with renal and cardiac protection"},
            {"name": "Linagliptin (DPP-4 inhibitor)", "status": "ongoing", "dosage": "5 mg", "frequency": "Once daily", "purpose": "Glucose control - safe in CKD"},
            {"name": "Losartan", "status": "ongoing", "dosage": "100 mg", "frequency": "Once daily", "purpose": "BP control and renal protection"},
            {"name": "Amlodipine", "status": "ongoing", "dosage": "5 mg", "frequency": "Once daily", "purpose": "Additional BP control"},
        ],
        "allergies": [
            {"allergen": "Sulfonylureas", "reaction": "Severe hypoglycemia", "severity": "severe"},
        ],
        "contraindications": [
            "Metformin - contraindicated in CKD Stage 3 with eGFR < 45 due to lactic acidosis risk",
        ],
        "family_history": [
            "Father had Type 2 diabetes and CKD",
            "Mother had hypertension and stroke",
        ],
        "biomarker_targets": [
            {"biomarker": "HbA1c", "target": "< 7.5", "unit": "%", "rationale": "Relaxed target due to CKD and age - avoid hypoglycemia"},
            {"biomarker": "eGFR", "target": "30-59", "unit": "mL/min/1.73m²", "rationale": "CKD Stage 3 range - monitor for progression"},
            {"biomarker": "Blood Pressure", "target": "< 130/80", "unit": "mmHg", "rationale": "Renal protection target"},
            {"biomarker": "Urine Albumin/Creatinine", "target": "< 300", "unit": "mg/g", "rationale": "Reduce proteinuria with SGLT2i and Losartan"},
            {"biomarker": "Potassium", "target": "< 5.0", "unit": "mEq/L", "rationale": "Monitor on Losartan + CKD"},
        ],
        "notes": "Type 2 diabetes with diabetic nephropathy. CKD Stage 3 (eGFR 42). Metformin discontinued due to CKD. SGLT2 inhibitor provides dual benefit for glucose and renal protection. Avoid sulfonylureas and metformin. Nephrology co-management. Annual eye exam for diabetic retinopathy screening.",
        "schedule_items": [
            {"id": "sched-040-001", "activity_type": "medication", "title": "Morning Medications", "instructions": ["Take Empagliflozin 10mg", "Take Linagliptin 5mg", "Take Amlodipine 5mg"], "window_start_local": "07:30", "window_end_local": "08:00", "display_order": 1},
            {"id": "sched-040-002", "activity_type": "medication", "title": "Losartan", "instructions": ["Take Losartan 100mg", "Take with water", "Monitor for dizziness"], "window_start_local": "20:00", "window_end_local": "20:30", "display_order": 2},
            {"id": "sched-040-003", "activity_type": "checkup", "title": "Blood Sugar Check", "instructions": ["Fasting glucose in morning", "Log readings", "Report if < 70 or > 200"], "window_start_local": "07:00", "window_end_local": "07:15", "display_order": 3},
            {"id": "sched-040-004", "activity_type": "checkup", "title": "Blood Pressure Monitoring", "instructions": ["Measure BP twice daily", "Record both readings", "Report if > 140/90 consistently"], "window_start_local": "08:00", "window_end_local": "08:15", "display_order": 4},
            {"id": "sched-040-005", "activity_type": "diet", "title": "Diabetic Renal Diet", "instructions": ["Low sodium diet", "Moderate carbohydrate", "Adequate but not excess protein", "Stay well hydrated (SGLT2i)"], "window_start_local": "12:30", "window_end_local": "13:15", "display_order": 5},
            {"id": "sched-040-006", "activity_type": "activity", "title": "Daily Walk", "instructions": ["Walk 30 minutes", "Wear comfortable shoes (SGLT2i UTI prevention)", "Stay hydrated", "Report any genital infections"], "window_start_local": "16:00", "window_end_local": "16:30", "display_order": 6},
        ],
        "milestones": [
            {"milestone": "HbA1c reduced from 8.5% to 7.2%", "achieved_date": "2026-03-05", "phase": 1},
            {"milestone": "Proteinuria reduced by 40%", "achieved_date": "2026-02-28", "phase": 1},
        ],
    },
]


def seed_database() -> None:
    """Seed the database with 10 condition-specific patients."""
    print(f"Seeding 10 condition patients to: {DB_PATH}")

    connect_args = {"check_same_thread": False}
    engine = create_engine(DB_URL, connect_args=connect_args)
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        today = datetime.now(timezone.utc)

        for patient in PATIENTS:
            user_id = patient["user_id"]

            # Check if patient already exists
            existing = (
                session.query(PatientProfileRow).filter_by(user_id=user_id).first()
            )

            if existing:
                print(f"Patient {user_id} already exists, skipping...")
                continue

            print(f"Creating patient: {user_id} - {patient['full_name']}")

            # Insert patient profile
            profile = PatientProfileRow(
                user_id=user_id,
                full_name=patient["full_name"],
                age=patient["age"],
                sex=patient["sex"],
                phone=patient["phone"],
                email=patient["email"],
                emergency_contact_json=json.dumps(patient["emergency_contact"]),
                surgery_info_json=json.dumps(patient["surgery_info"]) if patient["surgery_info"] else None,
                conditions_json=json.dumps(patient["conditions"]),
                treatments_json=json.dumps(patient["treatments"]),
                allergies_json=json.dumps(patient["allergies"]),
                contraindications_json=json.dumps(patient["contraindications"]),
                family_history_json=json.dumps(patient["family_history"]),
                biomarker_targets_json=json.dumps(patient["biomarker_targets"]),
                notes=patient["notes"],
                updated_at=today.isoformat(),
            )
            session.add(profile)

            # Insert treatment plan (medical management, not surgical)
            plan = TreatmentPlanRow(
                user_id=user_id,
                surgery_type="Medical Management",
                start_date=(today - timedelta(days=30)).strftime("%Y-%m-%d"),
                estimated_end_date=(today + timedelta(days=180)).strftime("%Y-%m-%d"),
                current_phase=1,
                phases_json=json.dumps([
                    {"phase_number": 1, "week_range": "Month 1-2", "title": "Stabilization", "focus": "Symptom control and treatment optimization", "status": "active"},
                    {"phase_number": 2, "week_range": "Month 3-4", "title": "Maintenance", "focus": "Sustained management and monitoring", "status": "upcoming"},
                    {"phase_number": 3, "week_range": "Month 5-6", "title": "Long-term Management", "focus": "Ongoing care and prevention", "status": "upcoming"},
                ]),
            )
            session.add(plan)

            # Insert milestones
            for ms in patient.get("milestones", []):
                milestone = MilestoneRow(
                    user_id=user_id,
                    milestone=ms["milestone"],
                    achieved_date=ms["achieved_date"],
                    phase=ms["phase"],
                )
                session.add(milestone)

            # Insert schedule items
            for sched in patient.get("schedule_items", []):
                session.execute(text("""
                    INSERT INTO schedule_items (id, user_id, activity_type, title, instructions_json,
                        window_start_local, window_end_local, display_order, active, notes, created_at, updated_at)
                    VALUES (:id, :user_id, :activity_type, :title, :instructions_json,
                        :window_start_local, :window_end_local, :display_order, :active, :notes, :created_at, :updated_at)
                """), {
                    "id": sched["id"],
                    "user_id": user_id,
                    "activity_type": sched["activity_type"],
                    "title": sched["title"],
                    "instructions_json": json.dumps(sched["instructions"]),
                    "window_start_local": sched["window_start_local"],
                    "window_end_local": sched["window_end_local"],
                    "display_order": sched["display_order"],
                    "active": True,
                    "notes": sched.get("notes"),
                    "created_at": today.isoformat(),
                    "updated_at": today.isoformat(),
                })

            # Generate 4 weeks of adherence reports
            for days_ago in range(1, 29):
                report_date = today - timedelta(days=days_ago)
                for sched in patient.get("schedule_items", []):
                    # Randomize adherence with realistic patterns
                    r = random.random()
                    if r > 0.25:
                        status = "done"
                    elif r > 0.10:
                        status = "partial"
                    else:
                        status = "skipped"

                    session.execute(text("""
                        INSERT INTO adherence_reports (id, user_id, schedule_item_id, report_date_local,
                            activity_type, status, followed_plan, alert_level, summary, reported_at_iso, created_at)
                        VALUES (:id, :user_id, :schedule_item_id, :report_date,
                            :activity_type, :status, :followed, :alert_level, :summary, :reported_at, :created_at)
                    """), {
                        "id": f"rep-{uuid4().hex[:8]}",
                        "user_id": user_id,
                        "schedule_item_id": sched["id"],
                        "report_date": report_date.strftime("%Y-%m-%d"),
                        "activity_type": sched["activity_type"],
                        "status": status,
                        "followed": status == "done",
                        "alert_level": "none" if status == "done" else "watch",
                        "summary": f"Patient reported {status} for {sched['title']}.",
                        "reported_at": report_date.replace(hour=8, minute=0).isoformat(),
                        "created_at": report_date.isoformat(),
                    })

        session.commit()
    print("\nSeeding complete! Added 10 condition-specific patients with full data.")


if __name__ == "__main__":
    seed_database()
