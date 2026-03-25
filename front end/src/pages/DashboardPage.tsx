import { useState, useEffect, type SyntheticEvent } from "react";
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
  MedicalServices as TreatmentIcon,
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
} from "@mui/icons-material";

import { fetchDashboard } from "../components/dashboard/dashboardApi";
import type { PatientDashboard } from "../components/dashboard/dashboardTypes";
import { usePatient } from "../PatientContext";
import { PatientInfoCard } from "../components/dashboard/PatientInfoCard";
import { MedicalHistoryCard } from "../components/dashboard/MedicalHistoryCard";
import { TreatmentPlanCard } from "../components/dashboard/TreatmentPlanCard";
import { DailyScheduleCard } from "../components/dashboard/DailyScheduleCard";
import { ProgressChartsCard } from "../components/dashboard/ProgressChartsCard";

type TabId = "overview" | "schedule" | "treatment" | "history";

const TABS: { id: TabId; label: string; icon: JSX.Element }[] = [
  { id: "overview",  label: "Overview",         icon: <OverviewIcon /> },
  { id: "schedule",  label: "Today's Schedule", icon: <ScheduleIcon /> },
  { id: "treatment", label: "Treatment Plan",   icon: <TreatmentIcon /> },
  { id: "history",   label: "Medical History",  icon: <HistoryIcon /> },
];

export function DashboardPage() {
  const { userId } = usePatient();
  const [patient, setPatient] = useState<PatientDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const loadDashboard = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboard(userId);
      setPatient(data);
    } catch (err) {
      console.warn("Failed to fetch dashboard from backend:", err);
      setPatient(null);
      setError("Could not connect to backend. Please check the server and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [userId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "primary.main" }} />
        <Typography sx={{ color: "text.secondary", mt: 2 }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (!patient) {
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
            onClick={loadDashboard}
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
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: "background.paper", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 3 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>Recovery Score</Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.5 }}>
              <Typography variant="h4" sx={{ color: "primary.light", fontWeight: 700 }}>84%</Typography>
              <TrendingIcon sx={{ color: "success.main", fontSize: 16 }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: "background.paper", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 3 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>Next Medication</Typography>
            <Typography variant="h6" sx={{ color: "text.primary", mt: 0.5, fontWeight: 600 }}>12:30 PM</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: "background.paper", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 3 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>Post-Op Day</Typography>
            <Typography variant="h4" sx={{ color: "text.primary", mt: 0.5, fontWeight: 700 }}>12</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
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
            <Grid item xs={12} lg={4}>
              <PatientInfoCard patient={patient} />
            </Grid>
            <Grid item xs={12} lg={8}>
              <ProgressChartsCard patient={patient} />
            </Grid>
          </Grid>
        )}

        {activeTab === "schedule" && (
          <DailyScheduleCard patient={patient} />
        )}

        {activeTab === "treatment" && (
          <TreatmentPlanCard patient={patient} />
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
