import { Box } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface PhysiotherapyScoreChartProps {
  physiotherapyHistory: Array<{ date: string; score: number }>;
  height?: number;
}

export function PhysiotherapyScoreChart({ physiotherapyHistory, height = 100 }: PhysiotherapyScoreChartProps) {
  const labels = physiotherapyHistory.map((entry) => {
    const date = new Date(entry.date);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
  const data = physiotherapyHistory.map((entry) => entry.score);

  const chartData = {
    labels,
    datasets: [
      {
        data,
        borderColor: "#00D4AA",
        backgroundColor: (context: { chart: { ctx: any } }) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, "rgba(0,212,170,0.25)");
          gradient.addColorStop(1, "rgba(0,212,170,0)");
          return gradient;
        },
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHitRadius: 10,
        tension: 0,
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
        backgroundColor: "rgba(13,13,15,0.95)",
        titleColor: "#F5F5F7",
        bodyColor: "#8A8A8E",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        padding: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.raw}/100`,
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
          color: "rgba(138,138,142,0.5)",
          font: { size: 9, weight: 600 as const },
          maxTicksLimit: 4,
        },
      },
    },
  };

  return (
    <Box sx={{ height }}>
      <Line data={chartData} options={options} />
    </Box>
  );
}
