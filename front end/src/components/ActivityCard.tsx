import {
  Box,
  Typography,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Restaurant as DietIcon,
  Medication as MedicationIcon,
  Hotel as SleepIcon,
  DirectionsRun as ActivityIcon,
  Psychology as CognitiveIcon,
  HealthAndSafety as TherapyIcon,
  Schedule as TimeIcon,
  CheckCircle as DoneIcon,
  PendingOutlined as PendingIcon,
  WarningAmber as WarningIcon,
  InfoOutlined as InfoIcon,
  ArrowForward as UpcomingIcon,
} from "@mui/icons-material";

export type ActivityItem = {
  scheduleItemId: string;
  activityType: "diet" | "medication" | "sleep" | "activity" | "therapy" | "cognitive" | "physical" | "checkup";
  title: string;
  instructions: string[];
  windowStartLocal: string;
  windowEndLocal: string;
};

type ActivityStatus = "done" | "partial" | "skipped" | "delayed" | "pending";

type Props = {
  item: ActivityItem;
  status?: ActivityStatus;
  isCurrent?: boolean;
  isUpcoming?: boolean;
  message?: string;
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "diet":
      return <DietIcon sx={{ fontSize: 20 }} />;
    case "medication":
      return <MedicationIcon sx={{ fontSize: 20 }} />;
    case "sleep":
      return <SleepIcon sx={{ fontSize: 20 }} />;
    case "cognitive":
      return <CognitiveIcon sx={{ fontSize: 20 }} />;
    case "therapy":
      return <TherapyIcon sx={{ fontSize: 20 }} />;
    case "activity":
    case "physical":
    default:
      return <ActivityIcon sx={{ fontSize: 20 }} />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case "diet":
      return "#42d6a4"; // green
    case "medication":
      return "#ffb443"; // orange
    case "sleep":
      return "#ff6b9d"; // pink
    case "cognitive":
      return "#8a85ff"; // purple
    case "therapy":
      return "#4ec3ff"; // light blue
    case "activity":
    case "physical":
    default:
      return "#f2d08a"; // gold
  }
};

const getStatusInfo = (status: ActivityStatus | undefined) => {
  const s = status || "pending";
  switch (s) {
    case "done":
      return { color: "success" as const, icon: <DoneIcon fontSize="small" />, label: "Completed" };
    case "partial":
      return { color: "warning" as const, icon: <InfoIcon fontSize="small" />, label: "Partial" };
    case "skipped":
      return { color: "error" as const, icon: <WarningIcon fontSize="small" />, label: "Skipped" };
    case "delayed":
      return { color: "secondary" as const, icon: <TimeIcon fontSize="small" />, label: "Delayed" };
    default:
      return { color: "default" as const, icon: <PendingIcon fontSize="small" />, label: "Pending" };
  }
};

export function ActivityCard({ item, status = "pending", isCurrent = false, isUpcoming = false, message }: Props) {
  const activityColor = getActivityColor(item.activityType);
  const statusInfo = getStatusInfo(status);
  const icon = getActivityIcon(item.activityType);

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: isCurrent ? activityColor : "rgba(255, 255, 255, 0.05)",
        borderRadius: 4,
        overflow: "hidden",
        position: "relative",
        transition: "border-color 0.3s ease",
      }}
    >
      {/* Activity Type Indicator Bar */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: activityColor,
          opacity: 0.8,
        }}
      />

      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: `${activityColor}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: activityColor,
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.2 }}>
                {item.title}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "capitalize" }}>
                {item.activityType}
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={statusInfo.icon}
            label={statusInfo.label}
            size="small"
            color={statusInfo.color}
            sx={{ fontWeight: 600, px: 0.5 }}
          />
        </Box>

        {/* Time Window */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2,
            px: 2,
            py: 1,
            bgcolor: "rgba(255, 255, 255, 0.03)",
            borderRadius: 2,
          }}
        >
          <TimeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
            {item.windowStartLocal} - {item.windowEndLocal}
          </Typography>
          {isCurrent && (
            <Chip
              label="NOW"
              size="small"
              sx={{
                ml: "auto",
                bgcolor: activityColor,
                color: "#000",
                fontWeight: 800,
                fontSize: "0.65rem",
                height: 20,
              }}
            />
          )}
          {isUpcoming && (
            <Chip
              icon={<UpcomingIcon sx={{ fontSize: "0.8rem !important" }} />}
              label="UPCOMING"
              size="small"
              variant="outlined"
              sx={{
                ml: "auto",
                borderColor: activityColor,
                color: activityColor,
                fontWeight: 700,
                fontSize: "0.65rem",
                height: 20,
              }}
            />
          )}
        </Box>

        {/* Message if provided */}
        {message && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontStyle: "italic",
              mb: 2,
              pl: 0.5,
            }}
          >
            {message}
          </Typography>
        )}

        {/* Instructions */}
        {item.instructions.length > 0 && (
          <>
            <Divider sx={{ mb: 2, opacity: 0.1 }} />
            <Typography
              variant="caption"
              sx={{
                color: activityColor,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                mb: 1,
                display: "block",
              }}
            >
              Instructions
            </Typography>
            <List dense disablePadding>
              {item.instructions.map((instruction, idx) => (
                <ListItem
                  key={`${item.scheduleItemId}-instruction-${idx}`}
                  sx={{
                    px: 1,
                    py: 0.5,
                    alignItems: "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      bgcolor: activityColor,
                      borderRadius: "50%",
                      mt: 1,
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  />
                  <ListItemText
                    primary={instruction}
                    primaryTypographyProps={{
                      sx: { color: "text.primary", fontSize: "0.85rem", lineHeight: 1.5 },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    </Paper>
  );
}
