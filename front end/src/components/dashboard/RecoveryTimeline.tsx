import { Box, Typography, Paper } from "@mui/material";
import { CheckCircle as CheckIcon } from "@mui/icons-material";
import type { PatientDashboard } from "./dashboardTypes";

interface RecoveryTimelineProps {
  patient: PatientDashboard;
}

export function RecoveryTimeline({ patient }: RecoveryTimelineProps) {
  const { progress } = patient;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Metrics Row */}
      <Box>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Recovery Progress
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.65rem" }}>
              Day
            </Typography>
            <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 800 }}>
              {progress.daysSinceSurgery}
              <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 0.5, fontWeight: 500, fontSize: "0.6rem" }}>
                /{progress.totalDaysPlan}
              </Typography>
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.65rem" }}>
              Phase
            </Typography>
            <Typography variant="h6" sx={{ color: "primary.light", fontWeight: 800 }}>
              {patient.treatmentPlan.currentPhase}
              <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 0.5, fontWeight: 500, fontSize: "0.6rem" }}>
                /{patient.treatmentPlan.phases.length}
              </Typography>
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.65rem" }}>
              Milestones
            </Typography>
            <Typography variant="h6" sx={{ color: "success.main", fontWeight: 800 }}>
              {progress.recentMilestones.length}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Recent Milestones */}
      <Box>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Achievements
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {progress.recentMilestones.slice(0, 4).map((milestone, idx) => (
            <Box
              key={idx}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                py: 1,
                borderBottom: idx === progress.recentMilestones.slice(0, 4).length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.03)",
              }}
            >
              <CheckIcon sx={{ color: "success.main", fontSize: 16 }} />
              <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500, fontSize: "0.8rem", flex: 1 }}>
                {milestone.milestone}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.65rem" }}>
                {new Date(milestone.achievedDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
