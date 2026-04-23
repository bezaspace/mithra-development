import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Box, List, ListItem, ListItemButton, ListItemText, CircularProgress, Alert, Avatar, Button } from "@mui/material";
import { usePatient } from "../PatientContext";
import { backendHttpUrl } from "../lib/backendUrls";
import { Person as PersonIcon, PersonAdd as PersonAddIcon } from "@mui/icons-material";

interface Patient {
  user_id: string;
  full_name: string;
}

export function PatientSelectionPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setUserId } = usePatient();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPatients() {
      try {
        const response = await fetch(`${backendHttpUrl}/api/patients`);
        if (!response.ok) throw new Error("Failed to fetch patients");
        const data = await response.json();
        setPatients(data);
      } catch (err) {
        setError("Could not connect to the healthcare server. Please check your connection.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  const handleSelect = (id: string) => {
    setUserId(id);
    navigate("/"); // Redirect to main Voice page
  };

  const handleNewUser = () => {
    // Generate a temporary guest ID with a random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const guestId = `guest-${randomSuffix}`;
    setUserId(guestId);
    navigate("/"); // Redirect to main Voice page
  };

  return (
    <Box sx={{
      display: "flex", flexDirection: "column", justifyContent: "center",
      minHeight: "100vh", py: 4, px: { xs: 2, sm: 3 },
      background: "radial-gradient(ellipse 120% 100% at 50% 0%, rgba(0,212,170,0.06) 0%, transparent 50%)",
    }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography sx={{ fontWeight: 900, color: "primary.main", fontSize: "2rem", letterSpacing: "-0.04em", mb: 0.5 }}>
          RAKSHA
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Post-Surgery Recovery Assistant
        </Typography>
      </Box>

      <Box>
        <Typography sx={{ color: "text.primary", textAlign: "center", fontWeight: 700, fontSize: "0.9rem", mb: 0.5 }}>
          Who is checking in?
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: 3, textAlign: "center", fontSize: "0.75rem", fontWeight: 500 }}>
          Select a patient profile to start.
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: "primary.main", mb: 1.5 }} />
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 600 }}>Loading profiles...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: 0, fontSize: "0.8125rem" }}>
            {error}
          </Alert>
        ) : (
          <>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<PersonAddIcon />}
              onClick={handleNewUser}
              sx={{
                py: 1.5,
                borderRadius: 0,
                bgcolor: "primary.main",
                color: "#000",
                fontWeight: 800,
                fontSize: "0.95rem",
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(0,212,170,0.25)",
                "&:hover": { bgcolor: "primary.light" },
              }}
            >
              New User
            </Button>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, my: 0.5 }}>
              <Box sx={{ flex: 1, height: 1, bgcolor: "rgba(255,255,255,0.06)" }} />
              <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Or Select Existing
              </Typography>
              <Box sx={{ flex: 1, height: 1, bgcolor: "rgba(255,255,255,0.06)" }} />
            </Box>

            {patients.map((p) => (
              <ListItemButton
                key={p.user_id}
                onClick={() => handleSelect(p.user_id)}
                sx={{
                  borderRadius: 0,
                  py: 1.5,
                  px: 2,
                  mb: 1,
                  bgcolor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  "&:hover": { bgcolor: "rgba(0,212,170,0.06)", borderColor: "rgba(0,212,170,0.15)" },
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 1.5,
                }}
              >
                <Avatar sx={{
                  bgcolor: "rgba(0,212,170,0.1)", color: "primary.main",
                  width: 36, height: 36, fontSize: "0.875rem", fontWeight: 700, borderRadius: 0,
                }}>
                  {p.full_name.charAt(0).toUpperCase()}
                </Avatar>
                <ListItemText
                  primary={p.full_name}
                  secondary={`ID: ${p.user_id}`}
                  primaryTypographyProps={{ sx: { color: "text.primary", fontWeight: 700, fontSize: "0.9rem" } }}
                  secondaryTypographyProps={{ sx: { color: "text.secondary", fontSize: "0.7rem", mt: 0.1 } }}
                />
              </ListItemButton>
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
