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
    <Box
      sx={{
        mt: 2,
        p: 2.5,
        borderRadius: 3,
        bgcolor: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
      }}
    >
      <Typography variant="subtitle2" sx={{ color: "primary.light", mb: 2, fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 1 }}>
        Log Task Progress
      </Typography>

      <Stack spacing={2.5}>
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Status Outcome
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={status}
            onChange={(_e: MouseEvent<HTMLElement>, next: LogStatus | null) => {
              if (next) setStatus(next);
            }}
            sx={{
              "& .MuiToggleButton-root": {
                color: "text.secondary",
                borderColor: "rgba(255, 255, 255, 0.1)",
                textTransform: "none",
                fontWeight: 600,
                py: 1,
                "&.Mui-selected": {
                  color: "background.default",
                  bgcolor: "success.main",
                  "&:hover": { bgcolor: "success.main" },
                },
              },
            }}
          >
            <ToggleButton value="done">Done</ToggleButton>
            <ToggleButton value="partial">Partial</ToggleButton>
            <ToggleButton value="skipped">Skipped</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {needsChangesField && (
          <TextField
            label="What was different?"
            value={changesMade}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setChangesMade(e.target.value)}
            size="small"
            fullWidth
            multiline
            minRows={2}
            placeholder="Describe any deviations from the plan..."
            sx={textFieldSx}
          />
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
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
            label="Any symptoms?"
            value={symptoms}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSymptoms(e.target.value)}
            size="small"
            fullWidth
            placeholder="e.g. Pain, Nausea..."
            sx={textFieldSx}
          />
        </Box>

        <TextField
          label="Additional notes"
          value={notes}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
          size="small"
          fullWidth
          multiline
          minRows={2}
          placeholder="Anything else for the care team?"
          sx={textFieldSx}
        />

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={flagForDoctor}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFlagForDoctor(e.target.checked)}
                sx={{ color: "error.main", "&.Mui-checked": { color: "error.main" } }}
              />
            }
            label={<Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>Flag for doctor&apos;s attention</Typography>}
          />

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button 
              onClick={onCancel} 
              disabled={submitting} 
              sx={{ 
                color: "text.secondary", 
                textTransform: "none",
                fontWeight: 600,
                px: 2
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={submitting}
              sx={{
                textTransform: "none",
                bgcolor: "primary.main",
                color: "background.default",
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                boxShadow: "0 4px 12px rgba(95, 135, 135, 0.3)",
                "&:hover": { 
                  bgcolor: "primary.light",
                  boxShadow: "0 6px 16px rgba(95, 135, 135, 0.4)",
                },
              }}
            >
              {submitting ? "Saving..." : "Save Log"}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              bgcolor: "rgba(231, 138, 83, 0.1)", 
              color: "error.main", 
              border: "1px solid rgba(231, 138, 83, 0.2)",
              borderRadius: 2
            }}
          >
            {error}
          </Alert>
        )}
      </Stack>
    </Box>
  );
}

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "#e4dfd9",
    bgcolor: "#242226",
    "& fieldset": { borderColor: "#3a3439" },
    "&:hover fieldset": { borderColor: "#5f8787" },
    "&.Mui-focused fieldset": { borderColor: "#8dd6a3" },
  },
  "& .MuiInputLabel-root": {
    color: "#999",
    "&.Mui-focused": { color: "#8dd6a3" },
  },
};
