import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Divider,
} from "@mui/material";
import {
  Warning as WarningIcon,
  LocalPharmacy as PharmacyIcon,
  Science as ScienceIcon,
  Healing as HealingIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Label as LabelIcon,
} from "@mui/icons-material";
import type { PatientDashboard } from "./dashboardTypes";

interface MedicalHistoryCardProps {
  patient: PatientDashboard;
}

const severityColor = {
  mild: "#9db7b7",
  moderate: "#f2d08a",
  severe: "#e78a53",
};

const biomarkerStatusColor = {
  normal: "#8dd6a3",
  borderline: "#f2d08a",
  high: "#e78a53",
  low: "#d3c2f8",
};

export function MedicalHistoryCard({ patient }: MedicalHistoryCardProps) {
  const { medicalHistory } = patient;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Conditions Section */}
      <Card
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: 0,
          background: "linear-gradient(135deg, #1a191c 0%, #222024 100%)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 0,
                bgcolor: "rgba(95, 135, 135, 0.1)",
                color: "primary.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HealingIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700, lineHeight: 1.2 }}>
                Chronic Conditions
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                {medicalHistory.conditions.length} Active conditions being monitored
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {medicalHistory.conditions.map((condition) => (
              <Box
                key={condition.name}
                sx={{
                  p: 2,
                  borderRadius: 0,
                  bgcolor: "rgba(255, 255, 255, 0.02)",
                  border: `1px solid ${severityColor[condition.severity]}30`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  minWidth: 160,
                }}
              >
                <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 700 }}>
                  {condition.name}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    label={condition.status}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.03)",
                      color: "text.secondary",
                      fontSize: "0.65rem",
                      height: 18,
                      fontWeight: 700,
                      borderRadius: 0,
                    }}
                  />
                  <Chip
                    label={condition.severity}
                    size="small"
                    sx={{
                      bgcolor: `${severityColor[condition.severity]}15`,
                      color: severityColor[condition.severity],
                      fontSize: "0.65rem",
                      height: 18,
                      fontWeight: 800,
                      borderRadius: 0,
                      textTransform: "uppercase",
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Allergies Section */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card
            elevation={0}
            sx={{
              bgcolor: "background.paper",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: 0,
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 0,
                    bgcolor: "rgba(231, 138, 83, 0.1)",
                    color: "error.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <WarningIcon />
                </Box>
                <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700 }}>
                  Allergies
                </Typography>
              </Box>

              <List disablePadding>
                {medicalHistory.allergies.map((allergy, idx) => (
                  <Box key={allergy.allergen}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <LabelIcon
                          sx={{
                            fontSize: 20,
                            color: allergy.severity === "severe" ? "error.main" : "warning.main",
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={allergy.allergen}
                        secondary={`Reaction: ${allergy.reaction}`}
                        primaryTypographyProps={{ sx: { color: "text.primary", fontWeight: 600 } }}
                        secondaryTypographyProps={{ sx: { color: "text.secondary", mt: 0.5 } }}
                      />
                      <Chip
                        label={allergy.severity}
                        size="small"
                        sx={{
                          bgcolor: allergy.severity === "severe" ? "error.main" : "warning.main",
                          color: "background.default",
                          fontWeight: 800,
                          fontSize: "0.65rem",
                          borderRadius: 0,
                          textTransform: "uppercase",
                        }}
                      />
                    </ListItem>
                    {idx < medicalHistory.allergies.length - 1 && <Divider sx={{ opacity: 0.05 }} />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Medications Section */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card
            elevation={0}
            sx={{
              bgcolor: "background.paper",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: 0,
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 0,
                    bgcolor: "rgba(95, 135, 135, 0.1)",
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PharmacyIcon />
                </Box>
                <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700 }}>
                  Active Medications
                </Typography>
              </Box>

              <List disablePadding>
                {medicalHistory.medications.map((med, idx) => (
                  <Box key={med.name}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ color: "text.primary", fontWeight: 700 }}>
                          {med.name}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" sx={{ color: "primary.light", fontWeight: 700 }}>
                            {med.dosage}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            • {med.frequency}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5, fontStyle: "italic" }}>
                          Purpose: {med.purpose}
                        </Typography>
                      </Box>
                    </ListItem>
                    {idx < medicalHistory.medications.length - 1 && <Divider sx={{ opacity: 0.05 }} />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Biomarkers Section */}
      <Card
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: 0,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 0,
                bgcolor: "rgba(157, 183, 183, 0.1)",
                color: "primary.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ScienceIcon />
            </Box>
            <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700 }}>
              Health Biomarkers
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {medicalHistory.biomarkers.map((marker) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={marker.name}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 0,
                    bgcolor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    height: "100%",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {marker.name}
                    </Typography>
                    {marker.status === "normal" ? (
                      <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
                    ) : (
                      <ErrorIcon sx={{ fontSize: 16, color: biomarkerStatusColor[marker.status] }} />
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                    <Typography variant="h5" sx={{ color: biomarkerStatusColor[marker.status], fontWeight: 800 }}>
                      {marker.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      {marker.unit}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                    Target: {marker.target}
                  </Typography>
                  <Chip
                    label={marker.status}
                    size="small"
                    sx={{
                      mt: 1.5,
                      bgcolor: `${biomarkerStatusColor[marker.status]}15`,
                      color: biomarkerStatusColor[marker.status],
                      fontSize: "0.6rem",
                      height: 18,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      borderRadius: 0,
                    }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
