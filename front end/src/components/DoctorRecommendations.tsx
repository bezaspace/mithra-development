import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  MedicalServices as DoctorIcon,
  EventAvailable as SlotIcon,
  Translate as LangIcon,
  WorkHistory as ExpIcon,
} from "@mui/icons-material";
import type { DoctorCard } from "../lib/liveSocket";

type Props = {
  symptomsSummary: string;
  doctors: DoctorCard[];
};

export function DoctorRecommendations({ symptomsSummary, doctors }: Props) {
  if (doctors.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 4,
      }}
    >
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <DoctorIcon color="primary" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Recommended Doctors
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Based on: <strong>{symptomsSummary}</strong>
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {doctors.map((doctor) => (
          <Grid item xs={12} sm={6} key={doctor.doctorId}>
            <Box
              sx={{
                p: 2.5,
                height: "100%",
                borderRadius: 3,
                bgcolor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid",
                borderColor: "rgba(255, 255, 255, 0.05)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1.5 }}>
                <Avatar sx={{ bgcolor: "primary.dark", color: "primary.light", fontWeight: 700 }}>
                  {doctor.name.split(" ").pop()?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {doctor.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "primary.light", fontWeight: 600 }}>
                    {doctor.specialty}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                <Chip
                  icon={<ExpIcon sx={{ fontSize: "0.75rem !important" }} />}
                  label={`${doctor.experienceYears}y Experience`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem", height: 22 }}
                />
                <Chip
                  icon={<LangIcon sx={{ fontSize: "0.75rem !important" }} />}
                  label={doctor.languages.join(", ")}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem", height: 22 }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem", mb: 2, fontStyle: "italic", flexGrow: 1 }}>
                "{doctor.matchReason}"
              </Typography>

              <Divider sx={{ mb: 2, opacity: 0.1 }} />

              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", mb: 1, display: "block", letterSpacing: 0.5 }}>
                Available Slots
              </Typography>
              <List dense disablePadding>
                {doctor.slots.map((slot) => (
                  <ListItem
                    key={slot.slotId}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      mb: 0.5,
                      borderRadius: 1.5,
                      bgcolor: slot.isAvailable ? "rgba(95, 135, 135, 0.1)" : "rgba(255, 255, 255, 0.02)",
                      opacity: slot.isAvailable ? 1 : 0.4,
                      border: "1px solid",
                      borderColor: slot.isAvailable ? "primary.dark" : "transparent",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <SlotIcon sx={{ fontSize: 14, color: slot.isAvailable ? "primary.light" : "text.secondary" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={slot.displayLabel}
                      primaryTypographyProps={{ sx: { fontSize: "0.75rem", fontWeight: 600, color: slot.isAvailable ? "text.primary" : "text.secondary" } }}
                    />
                    <Typography variant="caption" sx={{ fontFamily: "monospace", opacity: 0.6 }}>
                      {slot.slotId}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
