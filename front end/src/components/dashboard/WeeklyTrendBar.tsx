import { Box, Typography } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface WeeklyTrendBarProps {
  weeklyAdherence: number[];
  height?: number;
}

export function WeeklyTrendBar({ weeklyAdherence, height = 140 }: WeeklyTrendBarProps) {
  const data = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Adherence %",
        data: weeklyAdherence,
        backgroundColor: weeklyAdherence.map((val) =>
          val >= 90 ? "rgba(141, 214, 163, 0.4)" : val >= 80 ? "rgba(95, 135, 135, 0.4)" : "rgba(242, 208, 138, 0.4)"
        ),
        borderColor: weeklyAdherence.map((val) =>
          val >= 90 ? "#8dd6a3" : val >= 80 ? "#5f8787" : "#f2d08a"
        ),
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a191c",
        titleColor: "#e4dfd9",
        bodyColor: "#b8afae",
        borderColor: "#3a3439",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#666", font: { size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#666", font: { size: 10 } },
      },
    },
  };

  return (
    <Box sx={{ height: "100%" }}>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Weekly Adherence Trend
      </Typography>
      <Box sx={{ height }}>
        <Bar data={data} options={options} />
      </Box>
    </Box>
  );
}
