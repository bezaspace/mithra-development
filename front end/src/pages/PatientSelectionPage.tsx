import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Box, Paper, List, ListItem, ListItemButton, ListItemText, CircularProgress, Alert, Avatar, Button, Divider } from "@mui/material";
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
    <Container maxWidth="sm" sx={{ 
      display: "flex", 
      flexDirection: "column", 
      justifyContent: "center", 
      minHeight: "100vh",
      py: 4 
    }}>
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Typography variant="h3" sx={{ fontWeight: 900, color: "primary.main", letterSpacing: -1, mb: 1 }}>
          RAKSHA
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500 }}>
          Your Personal Post-Surgery Recovery Assistant
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ 
        p: { xs: 3, md: 5 }, 
        bgcolor: "background.paper", 
        border: "1px solid", 
        borderColor: "rgba(255, 255, 255, 0.05)", 
        borderRadius: 6,
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
      }}>
        <Typography variant="h5" gutterBottom sx={{ color: "text.primary", textAlign: "center", fontWeight: 700, mb: 1 }}>
          Who is checking in?
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 4, textAlign: "center" }}>
          Select a patient profile to start today's session.
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4 }}>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Loading profiles...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: 3 }}>
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
                py: 2,
                mb: 3,
                borderRadius: 4,
                bgcolor: "primary.main",
                fontWeight: 700,
                fontSize: "1.1rem",
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(95, 135, 135, 0.3)",
                "&:hover": {
                  bgcolor: "primary.dark",
                  boxShadow: "0 6px 16px rgba(95, 135, 135, 0.4)",
                }
              }}
            >
              New User
            </Button>

            <Divider sx={{ mb: 3, borderColor: "rgba(255, 255, 255, 0.1)" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", px: 2 }}>
                or select existing patient
              </Typography>
            </Divider>

            <List sx={{ 
              maxHeight: 360, 
              overflow: "auto", 
              px: 0.5,
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "3px" }
            }}>
              {patients.map((p) => (
                <ListItem key={p.user_id} disablePadding sx={{ mb: 1.5 }}>
                  <ListItemButton 
                    onClick={() => handleSelect(p.user_id)}
                    sx={{ 
                      borderRadius: 4,
                      py: 2,
                      bgcolor: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid transparent",
                      "&:hover": { 
                        bgcolor: "rgba(95, 135, 135, 0.1)",
                        borderColor: "primary.dark" 
                      },
                      transition: "all 0.2s"
                    }}
                  >
                    <Avatar sx={{ 
                      mr: 2, 
                      bgcolor: "primary.dark", 
                      color: "primary.light",
                      width: 48,
                      height: 48
                    }}>
                      <PersonIcon />
                    </Avatar>
                    <ListItemText 
                      primary={p.full_name} 
                      secondary={`Patient ID: ${p.user_id}`}
                      primaryTypographyProps={{ sx: { color: "text.primary", fontWeight: 700, fontSize: "1.1rem" } }}
                      secondaryTypographyProps={{ sx: { color: "text.secondary", fontSize: "0.8rem", mt: 0.2 } }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>
      
      <Typography variant="caption" sx={{ mt: 4, color: "text.secondary", textAlign: "center", opacity: 0.5 }}>
        Raksha Healthcare Dashboard • v0.1.0
      </Typography>
    </Container>
  );
}
