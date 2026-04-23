import { useMemo, useState, type ChangeEvent, type MouseEvent } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
} from "@mui/material";

import type { PatientDashboard, ReportFormData } from "./dashboardTypes";

type ScheduleItem = PatientDashboard["dailySchedule"][number];
type LogStatus = ReportFormData["status"];

interface ScheduleLogFormProps {
  item: ScheduleItem;
  submitting?: boolean;
  error?: string | null;
  onSave: (data: ReportFormData) => void;
  onCancel: () => void;
}

function getInitialStatus(item: ScheduleItem): LogStatus {
  const reportStatus = item.latestReport?.status;
  if (reportStatus === "done" || reportStatus === "partial" || reportStatus === "skipped") {
    return reportStatus;
  }
  if (item.status === "done") return "done";
  if (item.status === "missed") return "skipped";
  return "partial";
}

export function ScheduleLogForm({ item, submitting = false, error = null, onSave, onCancel }: ScheduleLogFormProps) {
  const initialStatus = useMemo(() => getInitialStatus(item), [item]);
  const [status, setStatus] = useState<LogStatus>(initialStatus);
  const [changesMade, setChangesMade] = useState(item.latestReport?.changesMade || "");
  const [feltAfter, setFeltAfter] = useState(item.latestReport?.feltAfter || "");
  const [symptoms, setSymptoms] = useState(item.latestReport?.symptoms || "");
  const [notes, setNotes] = useState(item.latestReport?.notes || "");
  const [flagForDoctor, setFlagForDoctor] = useState(item.latestReport?.alertLevel === "watch" || item.latestReport?.alertLevel === "urgent");

  const needsChangesField = status === "partial" || status === "skipped";

  const handleSave = () => {
    onSave({
      status,
      followed_plan: status === "done",
      changes_made: needsChangesField ? changesMade.trim() : "",
      felt_after: feltAfter.trim(),
      symptoms: symptoms.trim(),
      notes: notes.trim(),
      alert_level: flagForDoctor ? "watch" : "none",
    });
  };

  return (
    <Box sx={{ pt: 1 }}>
      <Typography sx={{
        fontSize: "0.7rem", fontWeight: 700, color: "text.secondary",
        textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.5,
      }}>
        Log Progress
      </Typography>

      <Stack spacing={2}>
        {/* Status Pills */}
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={status}
          onChange={(_e: MouseEvent<HTMLElement>, next: LogStatus | null) => {
            if (next) setStatus(next);
          }}
          sx={{
            gap: 0.75,
            "& .MuiToggleButton-root": {
              borderRadius: 0,
              border: "1px solid rgba(255,255,255,0.08) !important",
              color: "text.secondary",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              py: 1.25,
              flex: 1,
              "&.Mui-selected": {
                color: "#000",
                bgcolor: "success.main",
                borderColor: "success.main !important",
                "&:hover": { bgcolor: "success.main" },
              },
            },
          }}
        >
          <ToggleButton value="done">Done</ToggleButton>
          <ToggleButton value="partial">Partial</ToggleButton>
          <ToggleButton value="skipped">Skipped</ToggleButton>
        </ToggleButtonGroup>

        {needsChangesField && (
          <TextField
            label="What was different?"
            value={changesMade}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setChangesMade(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
            placeholder="Describe any deviations..."
            sx={textFieldSx}
          />
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
          <TextField
            label="How did you feel?"
            value={feltAfter}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFeltAfter(e.target.value)}
            size="small"
            fullWidth
            placeholder="e.g. Better, Tired..."
            sx={textFieldSx}
          />
          <TextField
            label="Symptoms?"
            value={symptoms}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSymptoms(e.target.value)}
            size="small"
            fullWidth
            placeholder="e.g. Pain, Nausea..."
            sx={textFieldSx}
          />
        </Box>

        <TextField
          label="Notes"
          value={notes}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
          size="small"
          fullWidth
          multiline
          minRows={2}
          placeholder="Anything else for the care team?"
          sx={textFieldSx}
        />

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={flagForDoctor}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFlagForDoctor(e.target.checked)}
                sx={{ color: "error.main", "&.Mui-checked": { color: "error.main" } }}
              />
            }
            label={<Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 600 }}>Flag doctor</Typography>}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={onCancel}
              disabled={submitting}
              sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.85rem", px: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={submitting}
              sx={{
                bgcolor: "primary.main",
                color: "#000",
                fontWeight: 800,
                fontSize: "0.9rem",
                px: 3,
                py: 1,
                boxShadow: "0 4px 16px rgba(0,212,170,0.25)",
                "&:hover": {
                  bgcolor: "primary.light",
                  boxShadow: "0 6px 20px rgba(0,212,170,0.35)",
                },
              }}
            >
              {submitting ? "Saving..." : "Save Log"}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{
            bgcolor: "rgba(255,87,87,0.08)", color: "error.main",
            border: "1px solid rgba(255,87,87,0.15)", borderRadius: 0,
            fontSize: "0.8rem", fontWeight: 600,
          }}>
            {error}
          </Alert>
        )}
      </Stack>
    </Box>
  );
}

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "#F5F5F7",
    bgcolor: "rgba(255,255,255,0.03)",
    borderRadius: 0,
    fontSize: "0.85rem",
    "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
    "&:hover fieldset": { borderColor: "rgba(0,212,170,0.3)" },
    "&.Mui-focused fieldset": { borderColor: "primary.main" },
  },
  "& .MuiInputLabel-root": {
    color: "#8A8A8E",
    fontSize: "0.8rem",
    "&.Mui-focused": { color: "primary.main" },
  },
};
