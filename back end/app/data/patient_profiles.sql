CREATE TABLE IF NOT EXISTS patient_profiles (
  user_id TEXT PRIMARY KEY,
  full_name TEXT,
  age INTEGER,
  sex TEXT,
  conditions_json TEXT NOT NULL,
  treatments_json TEXT NOT NULL,
  allergies_json TEXT NOT NULL,
  contraindications_json TEXT NOT NULL,
  family_history_json TEXT NOT NULL,
  biomarker_targets_json TEXT NOT NULL,
  notes TEXT,
  updated_at TEXT NOT NULL
);
