import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingIcon,
  PersonAdd as PersonAddIcon,
  ExpandMore as ExpandMoreIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocalHospital as HospitalIcon,
  CalendarMonth as CalendarIcon,
  Emergency as EmergencyIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  RadioButtonChecked as ActiveIcon,
  Lock as LockedIcon,
  Block as RestrictionIcon,
  Warning as WarningIcon,
  LocalPharmacy as PharmacyIcon,
  Science as ScienceIcon,
  Healing as HealingIcon,
  Label as LabelIcon,
} from "@mui/icons-material";

import { fetchDashboard } from "../components/dashboard/dashboardApi";
import type { PatientDashboard } from "../components/dashboard/dashboardTypes";
import { usePatient } from "../PatientContext";

const isGuestUser = (userId: string | null): boolean => {
  return !!userId && userId.startsWith("guest-");
};

export function OverviewPage() {
  const { userId, adherenceRefreshNonce } = usePatient();
  const [patient, setPatient] = useState<PatientDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        </Box>
      );
    }
    return (
      <Box sx={{ px: 2, py: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 0, fontSize: "0.8125rem" }}>
          {error || "Failed to load overview data."}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 2, pb: 2, px: { xs: 1.5, sm: 2 } }}>
      {/* Compact Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: "text.primary", letterSpacing: "-0.01em" }}>
          Overview
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip label="Live" size="small" sx={{
            bgcolor: "success.main", color: "#000", fontSize: "0.6rem", fontWeight: 800, height: 20,
            textTransform: "uppercase", letterSpacing: 0.08,
          }} />
          <IconButton onClick={() => loadDashboard()} size="small" sx={{
            width: 28, height: 28, bgcolor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
          }}>
            <RefreshIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Hero Banner */}
      <HeroBanner patient={patient} />

      {/* Quick Stats Grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, mb: 2 }}>
        <StatTile label="Recovery" value="84%" icon={<TrendingIcon sx={{ fontSize: 14, color: "success.main" }} />} color="success.main" />
        <StatTile label="Next Med" value="12:30" icon={<PharmacyIcon sx={{ fontSize: 14, color: "info.main" }} />} color="info.main" />
        <StatTile label="Post-Op" value={`${patient.progress.daysSinceSurgery}`} icon={<CalendarIcon sx={{ fontSize: 14, color: "warning.main" }} />} color="warning.main" />
        <StatTile label="Team" value="3" icon={<HealingIcon sx={{ fontSize: 14, color: "primary.main" }} />} color="primary.main" />
      </Box>

      {/* Patient Info - Collapsible */}
      <Accordion defaultExpanded={false} sx={{ mb: 1.5 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary", fontSize: 20 }} />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.dark", fontSize: "0.85rem", fontWeight: 800, color: "primary.contrastText" }}>
              {patient.name.split(" ").map((n) => n[0]).join("")}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "text.primary", lineHeight: 1.3 }}>
                {patient.name}
              </Typography>
              <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 600 }}>
                {patient.age}y • {patient.sex} • ID: {patient.id.substring(0, 8)}
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <CompactPatientInfo patient={patient} />
        </AccordionDetails>
      </Accordion>

      {/* Treatment Plan - Vertical Stepper */}
      <TreatmentPlanStepper patient={patient} />

      {/* Medical History */}
      <MedicalHistorySections patient={patient} />
    </Box>
  );
}

function HeroBanner({ patient }: { patient: PatientDashboard }) {
  const surgeryDate = new Date(patient.surgery.date);
  const today = new Date();
  const daysSince = Math.floor((today.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Box sx={{
      position: "relative",
      borderRadius: 0,
      p: 2.5,
      mb: 2,
      overflow: "hidden",
      background: "linear-gradient(135deg, rgba(0,212,170,0.15) 0%, rgba(0,168,133,0.05) 100%)",
      border: "1px solid rgba(0,212,170,0.12)",
    }}>
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "primary.main", textTransform: "uppercase", letterSpacing: "0.1em", mb: 0.5 }}>
          Recovery Progress
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: "text.primary", lineHeight: 1.2 }}>
          Day {daysSince}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 600, mt: 0.25 }}>
          {patient.surgery.type}
        </Typography>
      </Box>
    </Box>
  );
}

function StatTile({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Box sx={{
      bgcolor: "background.paper",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 0,
      p: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      gap: 0.5,
      aspectRatio: "1/1",
    }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
        {icon}
        <Typography sx={{ fontSize: "0.55rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          {label}
        </Typography>
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color, lineHeight: 1.1 }}>
        {value}
      </Typography>
    </Box>
  );
}

function CompactPatientInfo({ patient }: { patient: PatientDashboard }) {
  const items = [
    { icon: <CalendarIcon sx={{ fontSize: 16, color: "text.secondary" }} />, label: "Surgery", value: patient.surgery.type },
    { icon: <HospitalIcon sx={{ fontSize: 16, color: "text.secondary" }} />, label: "Surgeon", value: patient.surgery.surgeon },
    { icon: <PhoneIcon sx={{ fontSize: 16, color: "text.secondary" }} />, label: "Phone", value: patient.phone },
    { icon: <EmailIcon sx={{ fontSize: 16, color: "text.secondary" }} />, label: "Email", value: patient.email },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map((item) => (
        <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {item.icon}
          <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 600, minWidth: 48 }}>
            {item.label}
          </Typography>
          <Typography sx={{ fontSize: "0.8125rem", color: "text.primary", fontWeight: 600 }}>
            {item.value}
          </Typography>
        </Box>
      ))}
      <Box sx={{
        display: "flex", alignItems: "center", gap: 1.5,
        bgcolor: "rgba(255,87,87,0.06)", border: "1px solid rgba(255,87,87,0.12)",
        borderRadius: 0, px: 1.5, py: 1, mt: 0.5,
      }}>
        <EmergencyIcon sx={{ fontSize: 16, color: "error.main" }} />
        <Box>
          <Typography sx={{ fontSize: "0.65rem", color: "error.main", fontWeight: 700 }}>Emergency</Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "text.primary", fontWeight: 700 }}>
            {patient.emergencyContact.name} ({patient.emergencyContact.relation})
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

const phaseStatusIcon = {
  completed: <CheckCircleIcon sx={{ color: "#00D4AA", fontSize: 18 }} />,
  active: <ActiveIcon sx={{ color: "#00D4AA", fontSize: 18 }} />,
  upcoming: <LockedIcon sx={{ color: "#555", fontSize: 18 }} />,
};

const phaseStatusColor = {
  completed: "#00D4AA",
  active: "#00D4AA",
  upcoming: "#555",
};

function TreatmentPlanStepper({ patient }: { patient: PatientDashboard }) {
  const { treatmentPlan, progress } = patient;

  return (
    <Box sx={{
      bgcolor: "background.paper",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 0,
      p: 2,
      mb: 2,
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <FlagIcon sx={{ color: "primary.main", fontSize: 18 }} />
        <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "text.primary" }}>Treatment Plan</Typography>
        <Chip label={`${progress.phaseProgress}%`} size="small" sx={{
          ml: "auto", bgcolor: "rgba(0,212,170,0.1)", color: "primary.main",
          fontSize: "0.65rem", fontWeight: 800, height: 20,
        }} />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, position: "relative" }}>
        {/* Connecting line */}
        <Box sx={{
          position: "absolute", left: 8.5, top: 18, bottom: 18,
          width: 2, bgcolor: "rgba(255,255,255,0.04)", borderRadius: 0,
        }} />

        {treatmentPlan.phases.map((phase, index) => (
          <Box key={index} sx={{
            display: "flex", alignItems: "flex-start", gap: 1.5,
            position: "relative", zIndex: 1,
          }}>
            <Box sx={{
              width: 18, height: 18, borderRadius: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, mt: 0.25,
            }}>
              {phaseStatusIcon[phase.status]}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{
                fontSize: "0.75rem", fontWeight: 700,
                color: phaseStatusColor[phase.status],
                textTransform: "uppercase", letterSpacing: "0.04em",
              }}>
                {phase.week}
              </Typography>
              <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
                {phase.title}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", mt: 0.25 }}>
                {phase.focus}
              </Typography>
              {phase.status === "active" && phase.goals.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
                  {phase.goals.slice(0, 3).map((g, i) => (
                    <Chip key={i} label={g} size="small" sx={{
                      height: 20, fontSize: "0.6rem", fontWeight: 600,
                      bgcolor: "rgba(255,255,255,0.04)", color: "text.secondary",
                    }} />
                  ))}
                </Box>
              )}
              {phase.restrictions.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                  {phase.restrictions.slice(0, 2).map((r, i) => (
                    <Chip key={i} icon={<RestrictionIcon sx={{ fontSize: 12 }} />} label={r} size="small" sx={{
                      height: 20, fontSize: "0.6rem", fontWeight: 600,
                      bgcolor: "rgba(255,159,67,0.08)", color: "secondary.main", border: "1px solid rgba(255,159,67,0.15)",
                    }} />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

const severityColor: Record<string, string> = {
  mild: "#8A8A8E",
  moderate: "#FF9F43",
  severe: "#FF5757",
};

const biomarkerStatusColor: Record<string, string> = {
  normal: "#00D4AA",
  borderline: "#FF9F43",
  high: "#FF5757",
  low: "#8A85FF",
};

function MedicalHistorySections({ patient }: { patient: PatientDashboard }) {
  const { medicalHistory } = patient;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Conditions */}
      {medicalHistory.conditions.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary", fontSize: 20 }} />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 0, bgcolor: "rgba(0,212,170,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <HealingIcon sx={{ fontSize: 16, color: "primary.main" }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "text.primary" }}>
                Conditions ({medicalHistory.conditions.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {medicalHistory.conditions.map((c) => (
                <Chip key={c.name} label={`${c.name} • ${c.severity}`} size="small" sx={{
                  height: 26, fontSize: "0.7rem", fontWeight: 700,
                  bgcolor: `${severityColor[c.severity]}15`,
                  color: severityColor[c.severity],
                  border: `1px solid ${severityColor[c.severity]}30`,
                }} />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Allergies */}
      {medicalHistory.allergies.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary", fontSize: 20 }} />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 0, bgcolor: "rgba(255,87,87,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <WarningIcon sx={{ fontSize: 16, color: "error.main" }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "text.primary" }}>
                Allergies ({medicalHistory.allergies.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {medicalHistory.allergies.map((a) => (
                <Box key={a.allergen} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "text.primary" }}>{a.allergen}</Typography>
                  <Chip label={a.severity} size="small" sx={{
                    height: 20, fontSize: "0.6rem", fontWeight: 800,
                    bgcolor: a.severity === "severe" ? "error.main" : "warning.main",
                    color: "#000",
                  }} />
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Medications */}
      {medicalHistory.medications.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary", fontSize: 20 }} />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 0, bgcolor: "rgba(0,212,170,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PharmacyIcon sx={{ fontSize: 16, color: "primary.main" }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "text.primary" }}>
                Medications ({medicalHistory.medications.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {medicalHistory.medications.map((med) => (
                <Box key={med.name}>
                  <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "text.primary" }}>{med.name}</Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 600 }}>
                    {med.dosage} • {med.frequency}
                  </Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Biomarkers */}
      {medicalHistory.biomarkers.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary", fontSize: 20 }} />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 0, bgcolor: "rgba(51,161,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ScienceIcon sx={{ fontSize: 16, color: "info.main" }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "text.primary" }}>
                Biomarkers ({medicalHistory.biomarkers.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              {medicalHistory.biomarkers.map((m) => (
                <Box key={m.name} sx={{
                  bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 0, p: 1.25,
                }}>
                  <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {m.name}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mt: 0.25 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: biomarkerStatusColor[m.status] || "text.primary" }}>
                      {m.value}
                    </Typography>
                    <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 600 }}>{m.unit}</Typography>
                  </Box>
                  <Chip label={m.status} size="small" sx={{
                    height: 18, fontSize: "0.55rem", fontWeight: 800, mt: 0.75,
                    bgcolor: `${biomarkerStatusColor[m.status]}15`,
                    color: biomarkerStatusColor[m.status],
                  }} />
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}
