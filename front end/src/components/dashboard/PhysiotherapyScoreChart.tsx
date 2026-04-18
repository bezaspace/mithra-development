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
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHitRadius: 10,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
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
          label: (context: any) => `Score: ${context.raw}/100`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { 
          display: false,
        },
        border: { display: false },
        ticks: { 
          display: false,
        },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { 
          color: "rgba(184, 175, 174, 0.5)", 
          font: { size: 10, weight: 600 as const },
          maxTicksLimit: 5,
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
