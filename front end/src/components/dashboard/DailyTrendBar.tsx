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

interface DailyTrendBarProps {
  dailyAdherence: number[];
  height?: number;
}

export function DailyTrendBar({ dailyAdherence, height = 140 }: DailyTrendBarProps) {
  const data = {
    labels: dailyAdherence.map((_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: "Adherence %",
        data: dailyAdherence,
        backgroundColor: dailyAdherence.map((val) =>
          val >= 90 ? "rgba(141, 214, 163, 0.6)" : val >= 80 ? "rgba(95, 135, 135, 0.6)" : "rgba(242, 208, 138, 0.6)"
        ),
        borderWidth: 0,
        borderRadius: 0,
        categoryPercentage: 1.0,
        barPercentage: 1.0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(26, 25, 28, 0.9)",
        titleColor: "#e4dfd9",
        bodyColor: "#b8afae",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context: any) => `Adherence: ${context.raw}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { display: false },
        border: { display: false },
        ticks: { display: false },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { 
          display: false,
        },
      },
    },
  };

  return (
    <Box sx={{ height: "100%" }}>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        30-Day Adherence Trend
      </Typography>
      <Box sx={{ height }}>
        <Bar data={data} options={options} />
      </Box>
    </Box>
  );
}
