import React, { useState } from "react";
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
  Avatar,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Mic as MicIcon,
  Dashboard as DashboardIcon,
  CalendarMonth as ScheduleIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  FiberManualRecord as StatusIcon,
  GridView as OverviewIcon,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { usePatient } from "../PatientContext";

const drawerWidth = 240;

interface Props {
  children: React.ReactNode;
  connectionState: string;
}

export function Layout({ children, connectionState }: Props) {
  const { userId, clearPatient } = usePatient();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { text: "Assistant", icon: <MicIcon />, path: "/" },
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Schedule", icon: <ScheduleIcon />, path: "/schedule" },
    { text: "Overview", icon: <OverviewIcon />, path: "/overview" },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    clearPatient();
    navigate("/select-patient");
  };

  const currentTab = navItems.findIndex((item) => item.path === location.pathname);

  const statusColor =
    connectionState === "ready"
      ? "success.main"
      : connectionState === "connecting"
      ? "warning.main"
      : connectionState === "error"
      ? "error.main"
      : "text.secondary";

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      <Toolbar sx={{ px: 2, py: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main", letterSpacing: 1 }}>
          RAKSHA
        </Typography>
      </Toolbar>
      <Divider sx={{ opacity: 0.1 }} />
      <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                "&.Mui-selected": {
                  bgcolor: "rgba(95, 135, 135, 0.15)",
                  color: "primary.light",
                  "& .MuiListItemIcon-root": { color: "primary.light" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 600 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ opacity: 0.1 }} />
      <List sx={{ px: 1, py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Switch Profile"
              primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  const isAssistantPage = location.pathname === "/";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <CssBaseline />

      {/* Top Header - Hidden on Assistant Page */}
      {!isAssistantPage && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: isMobile ? "100%" : `calc(100% - ${drawerWidth}px)`,
            ml: isMobile ? 0 : `${drawerWidth}px`,
            bgcolor: "background.default",
            borderBottom: "1px solid",
            borderColor: "rgba(255, 255, 255, 0.05)",
            zIndex: theme.zIndex.appBar,
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {isMobile && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              {!isMobile && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                    Active Patient:
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600 }}>
                    {userId}
                  </Typography>
                </Box>
              )}
              {isMobile && (
                <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
                  RAKSHA
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Tooltip title={`Session Status: ${connectionState}`}>
                <Chip
                  icon={<StatusIcon sx={{ "&&": { color: statusColor, fontSize: 14 } }} />}
                  label={connectionState.charAt(0).toUpperCase() + connectionState.slice(1)}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    textTransform: "capitalize",
                  }}
                />
              </Tooltip>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "primary.dark",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "primary.light",
                }}
              >
                {userId?.substring(0, 2).toUpperCase() || "P"}
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar - Desktop */}
      {!isMobile && (
        <Box component="nav" sx={{ width: drawerWidth, flexShrink: 0 }}>
          <Drawer
            variant="permanent"
            sx={{
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                borderRight: "1px solid",
                borderColor: "rgba(255, 255, 255, 0.05)",
                bgcolor: "background.paper",
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
      )}

      {/* Sidebar - Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              bgcolor: "background.paper",
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: isMobile ? "100%" : `calc(100% - ${drawerWidth}px)`,
          mt: isAssistantPage ? 0 : "64px",
          mb: isMobile ? "64px" : 0,
        }}
      >
        {children}
      </Box>

      {/* Bottom Navigation - Mobile */}
      {isMobile && (
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            borderTop: "1px solid",
            borderColor: "rgba(255, 255, 255, 0.05)",
          }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={currentTab}
            onChange={(_event, newValue) => {
              navigate(navItems[newValue].path);
            }}
            sx={{ bgcolor: "background.paper" }}
          >
            {navItems.map((item) => (
              <BottomNavigationAction
                key={item.text}
                label={item.text}
                icon={item.icon}
                sx={{
                  "&.Mui-selected": { color: "primary.main" },
                  "& .MuiBottomNavigationAction-label": { fontSize: "0.75rem" },
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}
