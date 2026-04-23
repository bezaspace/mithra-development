import { Box } from "@mui/material";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

interface ActivityBreakdown {
  medication: number;
  physical: number;
  diet: number;
  therapy: number;
  sleep: number;
  cognitive: number;
}

interface AdherenceRadarProps {
  activityBreakdown: ActivityBreakdown;
  height?: number;
}

const CAT_COLORS = [
  "#8A85FF", // cognitive
  "#4EC3FF", // physical
  "#00D4AA", // diet
  "#FF9F43", // medication
  "#FF6B9D", // sleep
  "#33A1FF", // therapy
];

export function AdherenceRadar({ activityBreakdown, height = 200 }: AdherenceRadarProps) {
  const labels = ["Cognitive", "Physical", "Diet", "Meds", "Sleep", "Therapy"];
  const dataValues = [
    activityBreakdown?.cognitive ?? 0,
    activityBreakdown?.physical ?? 0,
    activityBreakdown?.diet ?? 0,
    activityBreakdown?.medication ?? 0,
    activityBreakdown?.sleep ?? 0,
    activityBreakdown?.therapy ?? 0,
  ];

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: "rgba(0, 212, 170, 0.15)",
        borderColor: "#00D4AA",
        borderWidth: 2,
        pointBackgroundColor: CAT_COLORS,
        pointBorderColor: CAT_COLORS,
        pointHoverBackgroundColor: CAT_COLORS,
        pointHoverBorderColor: "#fff",
        pointRadius: 5,
        pointHoverRadius: 6,
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
        displayColors: true,
        callbacks: {
          label: (context: any) => `${context.raw}%`,
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          display: false,
        },
        grid: {
          color: "rgba(255,255,255,0.04)",
        },
        angleLines: {
          color: "rgba(255,255,255,0.06)",
        },
        pointLabels: {
          color: "rgba(138,138,142,0.7)",
          font: {
            size: 10,
            weight: 600 as const,
          },
        },
      },
    },
  };

  return (
    <Box sx={{ height, width: "100%" }}>
      <Radar data={data} options={options} />
    </Box>
  );
}
