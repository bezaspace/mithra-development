import { Box, Typography, Grid } from "@mui/material";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ActivityBreakdown {
  medication: number;
  physical: number;
  diet: number;
  therapy: number;
  sleep: number;
  cognitive: number;
}

interface AdherenceDoughnutProps {
  adherence: number; // Overall
  activityBreakdown: ActivityBreakdown;
  size?: number;
}

export function AdherenceDoughnut({ adherence, activityBreakdown, size = 260 }: AdherenceDoughnutProps) {
  // Define categories to show in rings (matching image as closely as possible)
  // We'll show 5 rings: Cognitive, Physical (Physical + Therapy avg), Diet, Medication, Sleep
  const categories = [
    { label: "Cognitive", value: activityBreakdown?.cognitive ?? 0, color: "#8a85ff" },
    { label: "Physical", value: Math.round(((activityBreakdown?.physical ?? 0) + (activityBreakdown?.therapy ?? 0)) / 2), color: "#4ec3ff" },
    { label: "Diet", value: activityBreakdown?.diet ?? 0, color: "#42d6a4" },
    { label: "Medication", value: activityBreakdown?.medication ?? 0, color: "#ffb443" },
    { label: "Sleep", value: activityBreakdown?.sleep ?? 0, color: "#ff6b9d" },
  ];

  const data = {
    datasets: categories.map((cat, index) => {
      // Calculate radius for each concentric ring
      // Outer ring index 0, Inner ring index 4
      const radius = 100 - (index * 13); // Decrease radius for each inner ring
      
      return {
        data: [cat.value, 100 - cat.value],
        backgroundColor: [cat.color, "rgba(255, 255, 255, 0.05)"],
        borderWidth: 0,
        circumference: 360,
        rotation: 0,
        borderRadius: 10,
        radius: `${radius}%`,
        cutout: "75%", // Thicker rings for better visibility
      };
    }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context: any) => {
            const index = context.datasetIndex;
            const cat = categories[index];
            if (context.dataIndex === 0) {
              return `${cat.label}: ${cat.value}%`;
            }
            return "";
          },
        },
      },
    },
  };

  return (
    <Box sx={{ textAlign: "center", py: 1 }}>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Recovery Adherence
      </Typography>
      
      <Box sx={{ position: "relative", width: size, height: size, mx: "auto", mb: 2 }}>
        <Doughnut data={data} options={options} />
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <Typography variant="h3" sx={{ color: "primary.light", fontWeight: 800, lineHeight: 1 }}>
            {adherence}%
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, display: "block", mt: 0.5, letterSpacing: 1 }}>
            OVERALL
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 3, px: 1 }}>
        <Grid container spacing={2} justifyContent="center">
          {categories.map((cat) => (
            <Grid key={cat.label} size="auto" sx={{ display: "flex", alignItems: "center", mx: 1, mb: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: cat.color, mr: 1 }} />
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", lineHeight: 1, fontSize: "0.7rem" }}>
                  {cat.label}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 800, fontSize: "0.9rem" }}>
                  {cat.value}%
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
