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

interface PhysiotherapyScoreChartProps {
  physiotherapyHistory: Array<{ date: string; score: number }>;
  height?: number;
}

export function PhysiotherapyScoreChart({ physiotherapyHistory, height = 200 }: PhysiotherapyScoreChartProps) {
  const labels = physiotherapyHistory.map((entry) => {
    const date = new Date(entry.date);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
  const data = physiotherapyHistory.map((entry) => entry.score);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Physiotherapy Score",
        data,
        borderColor: "#8dd6a3",
        backgroundColor: (context: { chart: { ctx: any } }) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, "rgba(141, 214, 163, 0.4)");
          gradient.addColorStop(1, "rgba(141, 214, 163, 0)");
          return gradient;
        },
        borderWidth: 2,
        pointBackgroundColor: "#8dd6a3",
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
          label: (context: any) => `Score: ${context.raw}/100`,
        },
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
        Physiotherapy Score (Last 30 Days)
      </Typography>
      <Box sx={{ height }}>
        <Line data={chartData} options={options} />
      </Box>
    </Box>
  );
}
