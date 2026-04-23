import { Box, Typography, Chip } from "@mui/material";
import { CheckCircle as CheckIcon } from "@mui/icons-material";
import type { PatientDashboard } from "./dashboardTypes";

interface RecoveryTimelineProps {
  patient: PatientDashboard;
}

export function RecoveryTimeline({ patient }: RecoveryTimelineProps) {
  const { progress } = patient;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Compact Metrics Row */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
        <Box sx={{
          bgcolor: "rgba(255,255,255,0.03)", borderRadius: 0,
          p: 1.5, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", aspectRatio: "1/1",
        }}>
          <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Day
          </Typography>
          <Typography sx={{ color: "text.primary", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.2, mt: 0.25 }}>
            {progress.daysSinceSurgery}
            <Box component="span" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.65rem", ml: 0.25 }}>
              /{progress.totalDaysPlan}
            </Box>
          </Typography>
        </Box>
        <Box sx={{
          bgcolor: "rgba(255,255,255,0.03)", borderRadius: 0,
          p: 1.5, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", aspectRatio: "1/1",
        }}>
          <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Phase
          </Typography>
          <Typography sx={{ color: "primary.main", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.2, mt: 0.25 }}>
            {patient.treatmentPlan.currentPhase}
            <Box component="span" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.65rem", ml: 0.25 }}>
              /{patient.treatmentPlan.phases.length}
            </Box>
          </Typography>
        </Box>
        <Box sx={{
          bgcolor: "rgba(255,255,255,0.03)", borderRadius: 0,
          p: 1.5, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", aspectRatio: "1/1",
        }}>
          <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Activities
          </Typography>
          <Typography sx={{ color: "success.main", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.2, mt: 0.25 }}>
            {patient.dailySchedule.filter(item => item.status === "done").length}
            <Box component="span" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.65rem", ml: 0.25 }}>
              /{patient.dailySchedule.length}
            </Box>
          </Typography>
        </Box>
      </Box>

      {/* Horizontal Milestone Chips */}
      {progress.recentMilestones.length > 0 && (
        <Box sx={{
          display: "flex", gap: 0.75, overflowX: "auto",
          scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
          pb: 0.5,
        }}>
          {progress.recentMilestones.slice(0, 8).map((milestone, idx) => (
            <Chip
              key={idx}
              icon={<CheckIcon sx={{ fontSize: 14, color: "success.main" }} />}
              label={milestone.milestone}
              size="small"
              sx={{
                bgcolor: "rgba(0,212,170,0.08)",
                border: "1px solid rgba(0,212,170,0.15)",
                color: "text.primary",
                fontSize: "0.7rem",
                fontWeight: 600,
                height: 28,
                flexShrink: 0,
                "& .MuiChip-icon": { color: "success.main", ml: "6px" },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
