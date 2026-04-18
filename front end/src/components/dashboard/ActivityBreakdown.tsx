import { Box, Typography, useTheme } from "@mui/material";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ActivityBreakdownProps {
  activityBreakdown: Record<string, number>;
}

export function ActivityBreakdown({ activityBreakdown }: ActivityBreakdownProps) {
  const theme = useTheme();
  
  const labels = Object.keys(activityBreakdown).map(
    (key) => key.charAt(0).toUpperCase() + key.slice(1)
  );
  const dataValues = Object.values(activityBreakdown);

  const data = {
    labels,
    datasets: [
      {
        label: "Activity Adherence",
        data: dataValues,
        backgroundColor: "rgba(157, 183, 183, 0.15)",
        borderColor: "#9db7b7",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        angleLines: {
          color: "rgba(255, 255, 255, 0.03)",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.03)",
        },
        pointLabels: {
          color: "rgba(184, 175, 174, 0.6)",
          font: {
            size: 10,
            weight: 600 as const,
          },
        },
        ticks: {
          display: false,
          stepSize: 25,
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(26, 25, 28, 0.9)",
        titleColor: "#e4dfd9",
        bodyColor: "#b8afae",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        displayColors: false,
      },
    },
  };

  return (
    <Box>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Activity Profile
      </Typography>
      <Box sx={{ position: "relative", px: 0 }}>
        <Radar data={data} options={options} />
      </Box>
      <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1 }}>
        {Object.entries(activityBreakdown).map(([activity, value]) => (
          <Box key={activity} sx={{ textAlign: "center" }}>
             <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "capitalize", display: "block", fontSize: "0.6rem", opacity: 0.7 }}>
              {activity}
            </Typography>
            <Typography variant="body2" sx={{ 
                fontWeight: 800, 
                color: value >= 90 ? "success.light" : value >= 75 ? "primary.light" : "warning.light",
                fontSize: "0.75rem"
              }}>
              {value}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
