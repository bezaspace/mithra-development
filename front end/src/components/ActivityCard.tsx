import { Box, Typography, Paper, Chip } from "@mui/material";
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
    case "diet": return <DietIcon sx={{ fontSize: 14 }} />;
    case "medication": return <MedicationIcon sx={{ fontSize: 14 }} />;
    case "sleep": return <SleepIcon sx={{ fontSize: 14 }} />;
    case "cognitive": return <CognitiveIcon sx={{ fontSize: 14 }} />;
    case "therapy": return <TherapyIcon sx={{ fontSize: 14 }} />;
    case "activity":
    case "physical":
    default: return <ActivityIcon sx={{ fontSize: 14 }} />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case "diet": return "#00D4AA";
    case "medication": return "#FF9F43";
    case "sleep": return "#FF6B9D";
    case "cognitive": return "#8A85FF";
    case "therapy": return "#33A1FF";
    case "activity":
    case "physical":
    default: return "#FF9F43";
  }
};

const getStatusInfo = (status: ActivityStatus | undefined) => {
  const s = status || "pending";
  switch (s) {
    case "done": return { color: "success" as const, icon: <DoneIcon fontSize="small" />, label: "Done" };
    case "partial": return { color: "warning" as const, icon: <InfoIcon fontSize="small" />, label: "Partial" };
    case "skipped": return { color: "error" as const, icon: <WarningIcon fontSize="small" />, label: "Skipped" };
    case "delayed": return { color: "secondary" as const, icon: <TimeIcon fontSize="small" />, label: "Delayed" };
    default: return { color: "default" as const, icon: <PendingIcon fontSize="small" />, label: "Pending" };
  }
};

export function ActivityCard({ item, status = "pending", isCurrent = false, isUpcoming = false, message }: Props) {
  const activityColor = getActivityColor(item.activityType);
  const statusInfo = getStatusInfo(status);
  const icon = getActivityIcon(item.activityType);

  return (
    <Paper elevation={0} sx={{
      p: 2,
      bgcolor: "background.paper",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 0,
      borderLeft: `3px solid ${isCurrent ? "#00D4AA" : activityColor}`,
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: message || item.instructions.length > 0 ? 1 : 0 }}>
        <Box sx={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: 0,
          bgcolor: `${activityColor}20`, color: activityColor, flexShrink: 0,
        }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "text.primary", lineHeight: 1.3 }}>
            {item.title}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
            <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", fontWeight: 600, textTransform: "uppercase" }}>
              {item.activityType}
            </Typography>
            <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", fontWeight: 600 }}>
              {item.windowStartLocal} — {item.windowEndLocal}
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={statusInfo.icon}
          label={statusInfo.label}
          size="small"
          sx={{
            height: 20, fontSize: "0.55rem", fontWeight: 800,
            bgcolor: `${activityColor}15`, color: activityColor,
            border: `1px solid ${activityColor}30`, flexShrink: 0,
            "& .MuiChip-icon": { color: activityColor, fontSize: 12 },
          }}
        />
      </Box>

      {message && (
        <Box sx={{
          display: "flex", alignItems: "flex-start", gap: 1,
          bgcolor: "rgba(0,212,170,0.03)", p: 1, borderRadius: 0, mb: item.instructions.length > 0 ? 1 : 0,
        }}>
          <InfoIcon sx={{ fontSize: 14, color: isUpcoming ? "info.main" : "primary.main", flexShrink: 0, mt: 0.1 }} />
          <Typography sx={{ fontSize: "0.75rem", color: "text.primary", fontWeight: 500, lineHeight: 1.4 }}>
            {message}
          </Typography>
        </Box>
      )}

      {item.instructions.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {item.instructions.map((instruction, idx) => (
            <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <Box sx={{ width: 4, height: 4, borderRadius: 0, bgcolor: activityColor, mt: 0.6, flexShrink: 0 }} />
              <Typography sx={{ fontSize: "0.75rem", color: "text.primary", fontWeight: 500, lineHeight: 1.4 }}>
                {instruction}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
