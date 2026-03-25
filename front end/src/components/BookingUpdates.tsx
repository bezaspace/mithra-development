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
        p: 3,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 4,
      }}
    >
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <AlertIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Recent Activity
        </Typography>
      </Box>

      <Stack spacing={2}>
        {updates.map((update, idx) => {
          const { color, icon } = getStatusInfo(update.status);
          return (
            <Paper
              key={`${idx}-${update.status}`}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: "rgba(255, 255, 255, 0.01)",
                borderColor: `${color}.main`,
                borderLeftWidth: 4,
                position: "relative",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: `${color}.main`, 
                    color: "background.default",
                    width: 32,
                    height: 32
                  }}
                >
                  {icon}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}>
                    {update.status === "confirmed" ? "Booking Confirmed" : "Update Received"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: update.booking ? 1.5 : 0 }}>
                    {update.message}
                  </Typography>

                  {update.booking && (
                    <>
                      <Divider sx={{ mb: 1.5, opacity: 0.1 }} />
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        <Chip
                          label={update.booking.doctorName}
                          size="small"
                          sx={{ bgcolor: "background.paper", fontSize: "0.75rem", fontWeight: 600, height: 24 }}
                        />
                        <Chip
                          label={update.booking.displayLabel}
                          size="small"
                          sx={{ bgcolor: "background.paper", fontSize: "0.75rem", fontWeight: 600, height: 24 }}
                        />
                        <Chip
                          label={update.booking.timezone}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem", height: 24, borderColor: "rgba(255, 255, 255, 0.05)" }}
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
