import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Chip,
  Divider,
  Paper,
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocalHospital as HospitalIcon,
  CalendarMonth as CalendarIcon,
  Emergency as EmergencyIcon,
} from "@mui/icons-material";
import type { PatientDashboard } from "./dashboardTypes";

interface PatientInfoCardProps {
  patient: PatientDashboard;
}

export function PatientInfoCard({ patient }: PatientInfoCardProps) {
  const surgeryDate = new Date(patient.surgery.date);
  const today = new Date();
  const daysSinceSurgery = Math.floor(
    (today.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24)
  );

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
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4, gap: 2.5 }}>
          <Avatar
            sx={{
              width: 72,
              height: 72,
              bgcolor: "primary.dark",
              color: "primary.light",
              fontSize: "1.75rem",
              fontWeight: 800,
              boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
            }}
          >
            {patient.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ color: "text.primary", fontWeight: 800, mb: 0.5 }}>
              {patient.name}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
              {patient.age}y • {patient.sex} • Patient ID: {patient.id.substring(0, 8)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 4 }}>
          <Chip
            icon={<CalendarIcon sx={{ fontSize: 16 }} />}
            label={`Day ${daysSinceSurgery} Post-Op`}
            sx={{ bgcolor: "primary.main", color: "background.default", fontWeight: 700 }}
          />
          <Chip
            icon={<HospitalIcon sx={{ fontSize: 16 }} />}
            label={patient.surgery.type}
            variant="outlined"
            sx={{ borderColor: "rgba(255, 255, 255, 0.1)", color: "text.primary", fontWeight: 600 }}
          />
        </Box>

        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2.5, 
            bgcolor: "rgba(255, 255, 255, 0.01)", 
            borderColor: "rgba(255, 255, 255, 0.05)",
            borderRadius: 3,
            mb: 4
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ color: "primary.light", mb: 1, fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 1 }}
          >
            Surgical Overview
          </Typography>
          <Typography variant="body1" sx={{ color: "text.primary", mb: 1, fontWeight: 700 }}>
            {patient.surgery.type}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontSize: "0.875rem", lineHeight: 1.6 }}>
            {patient.surgery.reason}
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>Surgeon</Typography>
              <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600 }}>{patient.surgery.surgeon}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>Facility</Typography>
              <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600 }}>{patient.surgery.hospital}</Typography>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: "primary.light", mb: 0, fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 1 }}
          >
            Communication & Emergency
          </Typography>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "rgba(255, 255, 255, 0.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PhoneIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", lineHeight: 1 }}>Phone</Typography>
              <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600 }}>{patient.phone}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "rgba(255, 255, 255, 0.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EmailIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", lineHeight: 1 }}>Email</Typography>
              <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600 }}>{patient.email}</Typography>
            </Box>
          </Box>

          <Divider sx={{ opacity: 0.1 }} />

          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "rgba(231, 138, 83, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EmergencyIcon sx={{ fontSize: 18, color: "error.main" }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "error.main", display: "block", lineHeight: 1, fontWeight: 700 }}>Emergency Contact</Typography>
              <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 700 }}>
                {patient.emergencyContact.name} ({patient.emergencyContact.relation})
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
                {patient.emergencyContact.phone}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
