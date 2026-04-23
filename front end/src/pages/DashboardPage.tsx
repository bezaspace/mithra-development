import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";

import { fetchDashboard } from "../components/dashboard/dashboardApi";
import type { PatientDashboard } from "../components/dashboard/dashboardTypes";
import { usePatient } from "../PatientContext";
import { AdherenceDoughnut } from "../components/dashboard/AdherenceDoughnut";
import { AdherenceRadar } from "../components/dashboard/AdherenceRadar";
import { DailyTrendBar } from "../components/dashboard/DailyTrendBar";
import { RecoveryTimeline } from "../components/dashboard/RecoveryTimeline";
import { PhysiotherapyScoreChart } from "../components/dashboard/PhysiotherapyScoreChart";
import { PainIndexChart } from "../components/dashboard/PainIndexChart";

const isGuestUser = (userId: string | null): boolean => {
  return !!userId && userId.startsWith("guest-");
};

export function DashboardPage() {
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
        <CircularProgress sx={{ color: "primary.main", size: 28 }} />
        <Typography sx={{ color: "text.secondary", mt: 1.5, fontSize: "0.8rem", fontWeight: 600 }}>Loading...</Typography>
      </Box>
    );
  }

  if (!patient) {
    if (isGuestUser(userId)) {
      return (
        <Box sx={{ px: 2, py: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <PersonAddIcon sx={{ fontSize: 48, color: "primary.main" }} />
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: "text.primary", mb: 0.5 }}>
              Welcome to RAKSHA
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.8125rem", maxWidth: 320, mx: "auto" }}>
              Start a voice conversation to create your personalized health profile.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%", maxWidth: 360 }}>
            {["Start a conversation", "Share your health info", "Get personalized care"].map((step, i) => (
              <Box key={i} sx={{
                display: "flex", alignItems: "center", gap: 2,
                bgcolor: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.12)",
                borderRadius: 0, px: 2.5, py: 1.5,
              }}>
                <Typography sx={{
                  width: 24, height: 24, borderRadius: 0,
                  bgcolor: "primary.main", color: "#000",
                  fontSize: "0.7rem", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {i + 1}
                </Typography>
                <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "text.primary" }}>
                  {step}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      );
    }
    return (
      <Box sx={{ px: 2, py: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 0, fontSize: "0.8125rem" }}>
          {error || "Failed to load dashboard data."}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 2, pb: 2, px: { xs: 1.5, sm: 2 } }}>
      {/* Compact Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: "text.primary", letterSpacing: "-0.01em" }}>
          Dashboard
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label="Live"
            size="small"
            sx={{
              bgcolor: "success.main",
              color: "#000",
              fontSize: "0.6rem",
              fontWeight: 800,
              height: 20,
              textTransform: "uppercase",
              letterSpacing: 0.08,
            }}
          />
          <IconButton
            onClick={() => loadDashboard()}
            size="small"
            sx={{
              width: 28, height: 28,
              bgcolor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
            }}
          >
            <RefreshIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Charts Grid */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Adherence Row - Desktop side-by-side */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          {/* Overall Adherence */}
          <Box sx={{
            bgcolor: "background.paper",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 0,
            p: 2,
          }}>
            <Typography sx={{
              fontSize: "0.7rem", fontWeight: 700, color: "text.secondary",
              textTransform: "uppercase", letterSpacing: "0.08em", mb: 2,
            }}>
              Overall Adherence
            </Typography>
            <AdherenceDoughnut
              adherence={patient.progress.overallAdherence}
              activityBreakdown={patient.progress.activityBreakdown}
              size={140}
            />
          </Box>

          {/* Activity Radar */}
          <Box sx={{
            bgcolor: "background.paper",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 0,
            p: 2,
          }}>
            <Typography sx={{
              fontSize: "0.7rem", fontWeight: 700, color: "text.secondary",
              textTransform: "uppercase", letterSpacing: "0.08em", mb: 2,
            }}>
              Activity Radar
            </Typography>
            <AdherenceRadar
              activityBreakdown={patient.progress.activityBreakdown}
              height={200}
            />
          </Box>
        </Box>

        {/* Daily Trend */}
        <Box sx={{
          bgcolor: "background.paper",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 0,
          p: 2,
        }}>
          <Typography sx={{
            fontSize: "0.7rem", fontWeight: 700, color: "text.secondary",
            textTransform: "uppercase", letterSpacing: "0.08em", mb: 2,
          }}>
            30-Day Trend
          </Typography>
          <Box sx={{ height: 60 }}>
            <DailyTrendBar dailyAdherence={patient.progress.dailyAdherence || []} height={60} />
          </Box>
        </Box>

        {/* Recovery Timeline */}
        <Box sx={{
          bgcolor: "background.paper",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 0,
          p: 2,
        }}>
          <RecoveryTimeline patient={patient} />
        </Box>

        {/* Charts Row - Desktop side-by-side */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          <Box sx={{
            bgcolor: "background.paper",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 0,
            p: 2,
          }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", color: "success.main" }}>
                {patient.progress.physiotherapyHistory?.length
                  ? patient.progress.physiotherapyHistory[patient.progress.physiotherapyHistory.length - 1].score
                  : "—"}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.75rem", fontWeight: 600 }}>/100</Typography>
            </Box>
            <PhysiotherapyScoreChart physiotherapyHistory={patient.progress.physiotherapyHistory} height={80} />
          </Box>
          <Box sx={{
            bgcolor: "background.paper",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 0,
            p: 2,
          }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.25rem", color: "warning.main" }}>
                {patient.progress.painIndexHistory?.length
                  ? patient.progress.painIndexHistory[patient.progress.painIndexHistory.length - 1].value
                  : "—"}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.75rem", fontWeight: 600 }}>/10</Typography>
            </Box>
            <PainIndexChart painIndexHistory={patient.progress.painIndexHistory} height={80} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
