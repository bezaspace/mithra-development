import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Avatar,
  Divider,
} from "@mui/material";
import {
  AssignmentTurnedIn as ConfirmedIcon,
  ErrorOutline as ErrorIcon,
  PendingActions as NeedsConfirmIcon,
  NotificationImportant as AlertIcon,
} from "@mui/icons-material";
import type { BookingCard } from "../lib/liveSocket";

type BookingUpdate = {
  status: "confirmed" | "failed" | "unavailable" | "needs_confirmation";
  message: string;
  booking?: BookingCard;
};

type Props = {
  updates: BookingUpdate[];
};

export function BookingUpdates({ updates }: Props) {
  if (updates.length === 0) return null;

  const getStatusInfo = (status: BookingUpdate["status"]) => {
    switch (status) {
      case "confirmed":
        return { color: "success", icon: <ConfirmedIcon sx={{ fontSize: 18 }} /> };
      case "failed":
        return { color: "error", icon: <ErrorIcon sx={{ fontSize: 18 }} /> };
      case "unavailable":
        return { color: "warning", icon: <AlertIcon sx={{ fontSize: 18 }} /> };
      case "needs_confirmation":
        return { color: "info", icon: <NeedsConfirmIcon sx={{ fontSize: 18 }} /> };
      default:
        return { color: "default", icon: <AlertIcon sx={{ fontSize: 18 }} /> };
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 0,
      }}
    >
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <AlertIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Recent Activity
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        {updates.map((update, idx) => {
          const { color, icon } = getStatusInfo(update.status);
          return (
            <Paper
              key={`${idx}-${update.status}`}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 0,
                bgcolor: "rgba(255, 255, 255, 0.01)",
                borderColor: `${color}.main`,
                borderLeftWidth: 3,
                position: "relative",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: `${color}.main`, 
                    color: "background.default",
                    width: 24,
                    height: 24
                  }}
                >
                  {icon}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0, color: "text.primary" }}>
                      {update.status === "confirmed" ? "Booking Confirmed" : "Update Received"}
                    </Typography>
                    <Chip
                      icon={icon}
                      label={update.status}
                      size="small"
                      sx={{
                        color: `${color}.main`,
                        bgcolor: "rgba(255, 255, 255, 0.01)",
                        fontWeight: 800,
                        fontSize: "0.55rem",
                        height: 18,
                        textTransform: "capitalize",
                        "& .MuiChip-icon": { fontSize: 12 },
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: update.booking ? 1 : 0 }}>
                    {update.message}
                  </Typography>

                  {update.booking && (
                    <>
                      <Divider sx={{ mb: 1, opacity: 0.1 }} />
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        <Chip
                          label={update.booking.doctorName}
                          size="small"
                          sx={{ 
                            bgcolor: "background.paper", 
                            fontSize: "0.6rem", 
                            fontWeight: 600, 
                            height: 18 
                          }}
                        />
                        <Chip
                          label={update.booking.displayLabel}
                          size="small"
                          sx={{ 
                            bgcolor: "background.paper", 
                            fontSize: "0.6rem", 
                            fontWeight: 600, 
                            height: 18 
                          }}
                        />
                        <Chip
                          label={update.booking.timezone}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: "0.6rem", 
                            height: 18, 
                            borderColor: "rgba(255, 255, 255, 0.05)" 
                          }}
                        />
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Stack>
    </Paper>
  );
}

export type { BookingUpdate };
