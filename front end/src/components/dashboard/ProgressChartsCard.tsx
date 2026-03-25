import { Card, CardContent, Typography, Box, Grid, Divider } from "@mui/material";
import { TrendingUp as TrendingUpIcon } from "@mui/icons-material";
import type { PatientDashboard } from "./dashboardTypes";
import { AdherenceDoughnut } from "./AdherenceDoughnut";
import { WeeklyTrendBar } from "./WeeklyTrendBar";
import { ActivityBreakdown } from "./ActivityBreakdown";
import { RecoveryTimeline } from "./RecoveryTimeline";

interface ProgressChartsCardProps {
  patient: PatientDashboard;
}

export function ProgressChartsCard({ patient }: ProgressChartsCardProps) {
  const { progress } = patient;

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 4,
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
          <TrendingUpIcon sx={{ color: "primary.main", fontSize: 24 }} />
          <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 800 }}>
            Recovery Progress & Adherence
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Main Visuals Area */}
          <Grid item xs={12} lg={8}>
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} sm={5} md={4}>
                <AdherenceDoughnut adherence={progress.overallAdherence} />
              </Grid>
              <Grid item xs={12} sm={7} md={8}>
                <WeeklyTrendBar weeklyAdherence={progress.weeklyAdherence} />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1, opacity: 0.1 }} />
              </Grid>

              <Grid item xs={12} sx={{ mt: -2 }}>
                <ActivityBreakdown activityBreakdown={progress.activityBreakdown} />
              </Grid>
            </Grid>
          </Grid>

          {/* Supporting Info Area */}
          <Grid item xs={12} lg={4}>
            <RecoveryTimeline patient={patient} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
