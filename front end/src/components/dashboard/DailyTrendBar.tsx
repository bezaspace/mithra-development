import { Box } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface DailyTrendBarProps {
  dailyAdherence: number[];
  height?: number;
}

export function DailyTrendBar({ dailyAdherence, height = 80 }: DailyTrendBarProps) {
  const data = {
    labels: dailyAdherence.map((_, i) => `D${i + 1}`),
    datasets: [
      {
        data: dailyAdherence,
        backgroundColor: dailyAdherence.map((val) =>
          val >= 90 ? "#00D4AA" : val >= 70 ? "rgba(0,212,170,0.5)" : "rgba(255,159,67,0.5)"
        ),
        borderWidth: 0,
        borderRadius: 0,
        categoryPercentage: 0.85,
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
        backgroundColor: "rgba(13,13,15,0.95)",
        titleColor: "#F5F5F7",
        bodyColor: "#8A8A8E",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        padding: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.raw}%`,
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
        ticks: { display: false },
      },
    },
  };

  return (
    <Box sx={{ height }}>
      <Bar data={data} options={options} />
    </Box>
  );
}
