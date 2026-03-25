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
      <Box
        sx={{
          p: 2.5,
          bgcolor: "rgba(255, 255, 255, 0.02)",
          borderRadius: 4,
          border: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <Typography variant="subtitle2" sx={{ color: "primary.light", mb: 2, fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 1 }}>
          Recovery Metrics
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
              Days Since Surgery
            </Typography>
            <Typography variant="h5" sx={{ color: "text.primary", fontWeight: 800 }}>
              {progress.daysSinceSurgery}
              <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 0.5, fontWeight: 500 }}>
                / {progress.totalDaysPlan}
              </Typography>
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
              Current Phase
            </Typography>
            <Typography variant="h5" sx={{ color: "primary.main", fontWeight: 800 }}>
              {patient.treatmentPlan.currentPhase}
              <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 0.5, fontWeight: 500 }}>
                / {patient.treatmentPlan.phases.length}
              </Typography>
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
              Milestones
            </Typography>
            <Typography variant="h5" sx={{ color: "success.main", fontWeight: 800 }}>
              {progress.recentMilestones.length}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Recent Milestones */}
      <Box>
        <Typography variant="subtitle2" sx={{ color: "primary.light", mb: 2, fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 1 }}>
          Recent Achievements
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {progress.recentMilestones.slice(0, 4).map((milestone, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 1.5,
                bgcolor: "background.default",
                borderRadius: 3,
                border: "1px solid rgba(255, 255, 255, 0.03)",
              }}
            >
              <CheckIcon sx={{ color: "success.main", fontSize: 20 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600, fontSize: "0.85rem" }}>
                  {milestone.milestone}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                {new Date(milestone.achievedDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
