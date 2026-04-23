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

interface PainIndexChartProps {
  painIndexHistory: Array<{ date: string; value: number }>;
  height?: number;
}

export function PainIndexChart({ painIndexHistory, height = 100 }: PainIndexChartProps) {
  const labels = painIndexHistory.map((entry) => {
    const date = new Date(entry.date);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
  const data = painIndexHistory.map((entry) => entry.value);

  const chartData = {
    labels,
    datasets: [
      {
        data,
        borderColor: "#FF9F43",
        backgroundColor: (context: { chart: { ctx: any } }) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, "rgba(255,159,67,0.25)");
          gradient.addColorStop(1, "rgba(255,159,67,0)");
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
          label: (context: any) => `${context.raw}/10`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
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
