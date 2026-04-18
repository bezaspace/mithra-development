import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Grid,
  Paper,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  GridView as OverviewIcon,
  CalendarToday as ScheduleIcon,
  BarChart as MetricsIcon,
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";

import { fetchDashboard } from "../components/dashboard/dashboardApi";
import type { PatientDashboard } from "../components/dashboard/dashboardTypes";
import { usePatient } from "../PatientContext";
import { PatientInfoCard } from "../components/dashboard/PatientInfoCard";
import { MedicalHistoryCard } from "../components/dashboard/MedicalHistoryCard";
import { TreatmentPlanCard } from "../components/dashboard/TreatmentPlanCard";
import { DailyScheduleCard } from "../components/dashboard/DailyScheduleCard";
import { AdherenceDoughnut } from "../components/dashboard/AdherenceDoughnut";
import { WeeklyTrendBar } from "../components/dashboard/WeeklyTrendBar";
import { ActivityBreakdown } from "../components/dashboard/ActivityBreakdown";
import { RecoveryTimeline } from "../components/dashboard/RecoveryTimeline";
import { PhysiotherapyScoreChart } from "../components/dashboard/PhysiotherapyScoreChart";
import { PainIndexChart } from "../components/dashboard/PainIndexChart";

type TabId = "overview" | "schedule" | "metrics" | "history";

const isGuestUser = (userId: string | null): boolean => {
  return !!userId && userId.startsWith("guest-");
};

const TABS: { id: TabId; label: string; icon: JSX.Element }[] = [
  { id: "overview",  label: "Overview",         icon: <OverviewIcon /> },
  { id: "schedule",  label: "Today's Schedule", icon: <ScheduleIcon /> },
  { id: "metrics",   label: "Metrics",          icon: <MetricsIcon /> },
  { id: "history",   label: "Medical History",  icon: <HistoryIcon /> },
];

export function DashboardPage() {
  const { userId, adherenceRefreshNonce } = usePatient();
  const [patient, setPatient] = useState<PatientDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  // Mount-time nonce to distinguish the initial load from live-save updates.
  const mountNonceRef = useRef<number | null>(null);

  const loadDashboard = async (options: { silent?: boolean } = {}) => {
    if (!userId) return;
    if (!options.silent) setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboard(userId);
      setPatient(data);
    } catch (err) {
      console.warn("Failed to fetch dashboard from backend:", err);
      if (!options.silent) setPatient(null);
      setError("Could not connect to backend. Please check the server and try again.");
    } finally {
      if (!options.silent) setLoading(false);
    }
  };

  useEffect(() => {
    mountNonceRef.current = adherenceRefreshNonce;
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Auto-refresh (silent) whenever the assistant successfully logs an
  // adherence report while the user is viewing the dashboard.
  useEffect(() => {
    if (mountNonceRef.current === null) return;
    if (adherenceRefreshNonce === mountNonceRef.current) return;
    mountNonceRef.current = adherenceRefreshNonce;
    loadDashboard({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adherenceRefreshNonce]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "primary.main" }} />
        <Typography sx={{ color: "text.secondary", mt: 2 }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (!patient) {
    // Check if this is a guest user - show welcome screen instead of error
    if (isGuestUser(userId)) {
      return (
        <Container maxWidth="xl" sx={{ py: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: "center",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 4,
            }}
          >
            <PersonAddIcon sx={{ fontSize: 64, color: "primary.main", mb: 3 }} />
            <Typography variant="h4" sx={{ color: "text.primary", fontWeight: 700, mb: 2 }}>
              Welcome to RAKSHA!
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", mb: 4, maxWidth: 600, mx: "auto" }}>
              You&apos;re currently in guest mode. Start a voice conversation with the AI assistant 
              and it can help create your personalized health profile. Once your profile is created, 
              you&apos;ll see your health dashboard here.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Paper sx={{ p: 3, bgcolor: "rgba(95, 135, 135, 0.1)", borderRadius: 3, minWidth: 200 }}>
                <Typography variant="h6" sx={{ color: "primary.light", fontWeight: 600, mb: 1 }}>
                  Step 1
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Start a conversation
                </Typography>
              </Paper>
              <Paper sx={{ p: 3, bgcolor: "rgba(95, 135, 135, 0.1)", borderRadius: 3, minWidth: 200 }}>
                <Typography variant="h6" sx={{ color: "primary.light", fontWeight: 600, mb: 1 }}>
                  Step 2
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Share your health info
                </Typography>
              </Paper>
              <Paper sx={{ p: 3, bgcolor: "rgba(95, 135, 135, 0.1)", borderRadius: 3, minWidth: 200 }}>
                <Typography variant="h6" sx={{ color: "primary.light", fontWeight: 600, mb: 1 }}>
                  Step 3
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Get personalized care
                </Typography>
              </Paper>
            </Box>
          </Paper>
        </Container>
      );
    }
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error || "Failed to load dashboard data."}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 0 }}>
      {/* Header Area */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          mb: 3,
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ color: "text.primary", fontWeight: 700, mb: 0.5 }}>
            Patient Dashboard
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Monitoring recovery for <strong>{patient.name}</strong>
            </Typography>
            <Chip
              label="Live Updates"
              size="small"
              sx={{ bgcolor: "success.main", color: "background.default", fontSize: "0.65rem", fontWeight: 700, height: 20 }}
            />
          </Box>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton 
            onClick={() => loadDashboard()}
            sx={{ 
              bgcolor: "background.paper", 
              border: "1px solid", 
              borderColor: "rgba(255, 255, 255, 0.05)",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.05)" }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Quick Summary Widgets (Desktop Only or Row on Tablet) */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, bgcolor: "background.paper", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 3 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>Recovery Score</Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.5 }}>
              <Typography variant="h4" sx={{ color: "primary.light", fontWeight: 700 }}>84%</Typography>
              <TrendingIcon sx={{ color: "success.main", fontSize: 16 }} />
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, bgcolor: "background.paper", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 3 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>Next Medication</Typography>
            <Typography variant="h6" sx={{ color: "text.primary", mt: 0.5, fontWeight: 600 }}>12:30 PM</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, bgcolor: "background.paper", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 3 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>Post-Op Day</Typography>
            <Typography variant="h4" sx={{ color: "text.primary", mt: 0.5, fontWeight: 700 }}>12</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2, bgcolor: "background.paper", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 3 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>Care Team</Typography>
            <Typography variant="h6" sx={{ color: "text.primary", mt: 0.5, fontWeight: 600 }}>3 Active</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Box sx={{ mb: 4, borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <Tabs
          value={activeTab}
          onChange={(_e: SyntheticEvent, val: TabId) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              color: "text.secondary",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              minHeight: 48,
              pb: 2,
              "&.Mui-selected": { color: "primary.light" },
            },
            "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
          }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content Area */}
      <Box sx={{ minHeight: "50vh" }}>
        {activeTab === "overview" && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 5 }}>
              <PatientInfoCard patient={patient} />
            </Grid>
            <Grid size={{ xs: 12, lg: 7 }}>
              <TreatmentPlanCard patient={patient} />
            </Grid>
          </Grid>
        )}

        {activeTab === "schedule" && (
          <DailyScheduleCard patient={patient} />
        )}

        {activeTab === "metrics" && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 4,
                  height: "100%",
                }}
              >
                <AdherenceDoughnut adherence={patient.progress.overallAdherence} size={150} />
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 4,
                  height: "100%",
                }}
              >
                <WeeklyTrendBar weeklyAdherence={patient.progress.weeklyAdherence} height={180} />
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 4,
                  height: "100%",
                }}
              >
                <ActivityBreakdown activityBreakdown={patient.progress.activityBreakdown} />
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 4,
                  height: "100%",
                }}
              >
                <RecoveryTimeline patient={patient} />
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 4,
                  height: "100%",
                }}
              >
                <PhysiotherapyScoreChart physiotherapyHistory={patient.progress.physiotherapyHistory} />
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 4,
                  height: "100%",
                }}
              >
                <PainIndexChart painIndexHistory={patient.progress.painIndexHistory} />
              </Paper>
            </Grid>
          </Grid>
        )}

        {activeTab === "history" && (
          <MedicalHistoryCard patient={patient} />
        )}
      </Box>

      {/* Compact Footer */}
      <Box sx={{ mt: 6, pt: 3, borderTop: "1px solid rgba(255, 255, 255, 0.05)", textAlign: "center", pb: 4 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", opacity: 0.6 }}>
          Last synchronized: {new Date().toLocaleTimeString()} • Secured medical data
        </Typography>
      </Box>
    </Container>
  );
}
