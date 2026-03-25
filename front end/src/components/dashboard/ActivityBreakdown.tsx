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
        backgroundColor: "rgba(95, 135, 135, 0.2)",
        borderColor: "#5f8787",
        borderWidth: 2,
        pointBackgroundColor: "#9db7b7",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#5f8787",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        angleLines: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        pointLabels: {
          color: "#999",
          font: {
            size: 11,
            weight: 600 as const,
          },
        },
        ticks: {
          display: false,
          stepSize: 20,
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
        backgroundColor: "#1a191c",
        titleColor: "#e4dfd9",
        bodyColor: "#b8afae",
        borderColor: "#3a3439",
        borderWidth: 1,
      },
    },
  };

  return (
    <Box>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Activity Adherence Profile
      </Typography>
      <Box sx={{ position: "relative", px: 2 }}>
        <Radar data={data} options={options} />
      </Box>
      <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.5 }}>
        {Object.entries(activityBreakdown).map(([activity, value]) => (
          <Box key={activity} sx={{ textAlign: "center" }}>
             <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "capitalize", display: "block", fontSize: "0.65rem" }}>
              {activity}
            </Typography>
            <Typography variant="body2" sx={{ 
                fontWeight: 800, 
                color: value >= 90 ? "success.light" : value >= 75 ? "primary.light" : "warning.light",
                fontSize: "0.8rem"
              }}>
              {value}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
