import { Box, Typography } from "@mui/material";

interface ActivityBreakdown {
  medication: number;
  physical: number;
  diet: number;
  therapy: number;
  sleep: number;
  cognitive: number;
}

interface AdherenceDoughnutProps {
  adherence: number;
  activityBreakdown: ActivityBreakdown;
  size?: number;
}

const CAT_COLORS: Record<string, string> = {
  cognitive: "#8A85FF",
  physical: "#4EC3FF",
  diet: "#00D4AA",
  medication: "#FF9F43",
  sleep: "#FF6B9D",
};

function SVGRing({ value, size, color }: { value: number; size: number; color: string }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="butt"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

export function AdherenceDoughnut({ adherence, activityBreakdown, size = 180 }: AdherenceDoughnutProps) {
  const categories = [
    { key: "cognitive", label: "Cognitive", value: activityBreakdown?.cognitive ?? 0 },
    { key: "physical", label: "Physical", value: Math.round(((activityBreakdown?.physical ?? 0) + (activityBreakdown?.therapy ?? 0)) / 2) },
    { key: "diet", label: "Diet", value: activityBreakdown?.diet ?? 0 },
    { key: "medication", label: "Meds", value: activityBreakdown?.medication ?? 0 },
    { key: "sleep", label: "Sleep", value: activityBreakdown?.sleep ?? 0 },
  ];

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
      {/* Ring + Center Text */}
      <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <SVGRing value={adherence} size={size} color="#00D4AA" />
        <Box sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", lineHeight: 1, color: "primary.main" }}>
            {adherence}%
          </Typography>
          <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: "text.secondary", letterSpacing: "0.08em", mt: 0.25 }}>
            OVERALL
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
