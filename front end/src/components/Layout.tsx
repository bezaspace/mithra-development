import React from "react";
import {
  Box,
  CssBaseline,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Avatar,
  Chip,
  Fade,
} from "@mui/material";
import {
  Mic as MicIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as ScheduleIcon,
  FiberManualRecord as StatusIcon,
  GridView as OverviewIcon,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { usePatient } from "../PatientContext";

interface Props {
  children: React.ReactNode;
  connectionState: string;
}

export function Layout({ children, connectionState }: Props) {
  const { userId } = usePatient();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { text: "Assistant", icon: <MicIcon />, path: "/" },
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Schedule", icon: <ScheduleIcon />, path: "/schedule" },
    { text: "Overview", icon: <OverviewIcon />, path: "/overview" },
  ];

  const currentTab = navItems.findIndex((item) => item.path === location.pathname);
  if (currentTab === -1) {
    // Default to assistant if on an unknown route
    //navItems.findIndex will be -1 for unknown paths
  }

  const statusColor =
    connectionState === "ready"
      ? "success.main"
      : connectionState === "connecting"
      ? "warning.main"
      : connectionState === "error"
      ? "error.main"
      : "text.secondary";

  const statusLabel =
    connectionState === "idle"
      ? ""
      : connectionState.charAt(0).toUpperCase() + connectionState.slice(1);

  const isAssistantPage = location.pathname === "/";

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default", position: "relative" }}>
      <CssBaseline />

      {/* Floating Connection Status Pill - Top Right */}
      <Fade in={connectionState !== "idle"}>
        <Box
          sx={{
            position: "fixed",
            top: 12,
            right: 12,
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Chip
            icon={<StatusIcon sx={{ "&&": { color: statusColor, fontSize: 10 } }} />}
            label={statusLabel}
            size="small"
            sx={{
              height: 24,
              bgcolor: "rgba(13,13,15,0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "text.secondary",
              fontSize: "0.65rem",
              fontWeight: 700,
              textTransform: "capitalize",
              letterSpacing: "0.03em",
              px: 0.5,
              "& .MuiChip-icon": { ml: "6px" },
            }}
          />
          <Avatar
            sx={{
              width: 26,
              height: 26,
              bgcolor: "primary.dark",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "primary.contrastText",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 0,
            }}
          >
            {userId?.substring(0, 2).toUpperCase() || "P"}
          </Avatar>
        </Box>
      </Fade>

      {/* Main Content Area - Full bleed, minimal padding */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          pb: isAssistantPage ? 0 : "88px",
          pt: isAssistantPage ? 0 : "8px",
          px: isAssistantPage ? 0 : { xs: 0, sm: 2, md: 3 },
          minHeight: "100dvh",
          overflowX: "hidden",
        }}
      >
        {children}
      </Box>

      {/* Floating Bottom Navigation - All Screen Sizes */}
      <Box
          sx={{
            position: "fixed",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1300,
            width: { xs: "calc(100% - 24px)", sm: "auto", md: "auto" },
            maxWidth: { xs: "100%", sm: 480 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 0,
              bgcolor: "rgba(13,13,15,0.82)",
              backdropFilter: "blur(20px) saturate(140%)",
              WebkitBackdropFilter: "blur(20px) saturate(140%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              px: { xs: 1, sm: 2 },
              py: 0.5,
            }}
          >
            <BottomNavigation
              showLabels
              value={currentTab >= 0 ? currentTab : 0}
              onChange={(_event, newValue) => {
                navigate(navItems[newValue].path);
              }}
              sx={{
                bgcolor: "transparent",
                height: 56,
                minWidth: { xs: 280, sm: 360 },
              }}
            >
              {navItems.map((item, idx) => (
                <BottomNavigationAction
                  key={item.text}
                  label={item.text}
                  icon={
                    <Box
                      sx={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.icon}
                      {currentTab === idx && (
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: -6,
                            width: 4,
                            height: 4,
                            borderRadius: 0,
                            bgcolor: "primary.main",
                          }}
                        />
                      )}
                    </Box>
                  }
                  sx={{
                    color: currentTab === idx ? "primary.main" : "text.secondary",
                    minWidth: 0,
                    px: { xs: 1.5, sm: 2 },
                    "& .MuiBottomNavigationAction-label": {
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                      opacity: currentTab === idx ? 1 : 0.6,
                      transition: "all 0.2s ease",
                    },
                    "& .MuiSvgIcon-root": {
                      fontSize: currentTab === idx ? "1.35rem" : "1.2rem",
                      transition: "all 0.2s ease",
                      color: currentTab === idx ? "primary.main" : "text.secondary",
                    },
                  }}
                />
              ))}
            </BottomNavigation>
          </Paper>
        </Box>
    </Box>
  );
}
