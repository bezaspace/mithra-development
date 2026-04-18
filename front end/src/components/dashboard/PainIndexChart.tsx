import { Box, Typography } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface PainIndexChartProps {
  painIndexHistory: Array<{ date: string; value: number }>;
  height?: number;
}

export function PainIndexChart({ painIndexHistory, height = 200 }: PainIndexChartProps) {
  const labels = painIndexHistory.map((entry) => {
    const date = new Date(entry.date);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
  const data = painIndexHistory.map((entry) => entry.value);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Pain Index",
        data,
        borderColor: "#f2d08a",
        backgroundColor: (context: { chart: { ctx: any } }) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, "rgba(242, 208, 138, 0.4)");
          gradient.addColorStop(1, "rgba(242, 208, 138, 0)");
          return gradient;
        },
        borderWidth: 2,
        pointBackgroundColor: "#f2d08a",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: true,
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
        callbacks: {
          label: (context: any) => `Pain Index: ${context.raw}/10`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#666", font: { size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { 
          color: "#666", 
          font: { size: 10 },
          maxTicksLimit: 7,
        },
      },
    },
  };

  return (
    <Box sx={{ height: "100%" }}>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Pain Index (Last 30 Days)
      </Typography>
      <Box sx={{ height }}>
        <Line data={chartData} options={options} />
      </Box>
    </Box>
  );
}
