import { useEffect, useRef, useState } from "react";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Paper,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";

import { fetchDashboard } from "../components/dashboard/dashboardApi";
import type { PatientDashboard } from "../components/dashboard/dashboardTypes";
import { usePatient } from "../PatientContext";
import { PatientInfoCard } from "../components/dashboard/PatientInfoCard";
import { MedicalHistoryCard } from "../components/dashboard/MedicalHistoryCard";
import { TreatmentPlanCard } from "../components/dashboard/TreatmentPlanCard";

const isGuestUser = (userId: string | null): boolean => {
  return !!userId && userId.startsWith("guest-");
};

export function OverviewPage() {
  const { userId, adherenceRefreshNonce } = usePatient();
  const [patient, setPatient] = useState<PatientDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        <Typography sx={{ color: "text.secondary", mt: 2 }}>Loading overview...</Typography>
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
              you&apos;ll see your health overview here.
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
        <Alert severity="error">{error || "Failed to load overview data."}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 0 }}>
      {/* Header Area */}
      <Box 
        sx={{ 
          mb: 4, 
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          pb: 2
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>
          Patient Overview
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Chip
            label="Live"
            size="small"
            sx={{ 
              bgcolor: "success.main", 
              color: "background.default", 
              fontSize: "0.65rem", 
              fontWeight: 800, 
              height: 20,
              textTransform: "uppercase",
              letterSpacing: 0.5
            }}
          />
          <Tooltip title="Refresh overview">
            <IconButton 
              onClick={() => loadDashboard()}
              size="small"
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
      </Box>

      {/* Overview Content Area */}
      <Box sx={{ minHeight: "50vh" }}>
        {/* Quick Summary Widgets */}
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

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 5 }}>
            <PatientInfoCard patient={patient} />
          </Grid>
          <Grid size={{ xs: 12, lg: 7 }}>
            <TreatmentPlanCard patient={patient} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <MedicalHistoryCard patient={patient} />
          </Grid>
        </Grid>
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
