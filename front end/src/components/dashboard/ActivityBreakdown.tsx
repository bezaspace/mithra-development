import { Box, Typography } from "@mui/material";

interface ActivityBreakdownProps {
  activityBreakdown: Record<string, number>;
}

const CAT_COLORS: Record<string, string> = {
  cognitive: "#8A85FF",
  physical: "#4EC3FF",
  diet: "#00D4AA",
  medication: "#FF9F43",
  sleep: "#FF6B9D",
  therapy: "#33A1FF",
};

export function ActivityBreakdown({ activityBreakdown }: ActivityBreakdownProps) {
  const entries = Object.entries(activityBreakdown);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {entries.map(([activity, value]) => {
        const color = CAT_COLORS[activity] || "#8A8A8E";
        return (
          <Box key={activity} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{
              width: 6, height: 6, borderRadius: 0, bgcolor: color, flexShrink: 0,
            }} />
            <Typography sx={{
              fontSize: "0.7rem", fontWeight: 600, color: "text.secondary",
              textTransform: "capitalize", flexShrink: 0, minWidth: 56,
            }}>
              {activity}
            </Typography>
            <Box sx={{
              flex: 1, height: 5, borderRadius: 0,
              bgcolor: "rgba(255,255,255,0.04)", overflow: "hidden",
            }}>
              <Box sx={{
                width: `${value}%`, height: "100%", borderRadius: 0,
                bgcolor: color,
                transition: "width 0.5s ease",
              }} />
            </Box>
            <Typography sx={{
              fontSize: "0.7rem", fontWeight: 700, color: "text.primary",
              flexShrink: 0, minWidth: 28, textAlign: "right",
            }}>
              {value}%
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
