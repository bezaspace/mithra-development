import { Box, Typography } from "@mui/material";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface AdherenceDoughnutProps {
  adherence: number;
  size?: number;
}

export function AdherenceDoughnut({ adherence, size = 120 }: AdherenceDoughnutProps) {
  const data = {
    labels: ["Completed", "Remaining"],
    datasets: [
      {
        data: [adherence, 100 - adherence],
        backgroundColor: ["#5f8787", "rgba(255, 255, 255, 0.03)"],
        borderWidth: 0,
        hoverOffset: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: "82%",
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
      },
    },
  };

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Overall Adherence
      </Typography>
      <Box sx={{ position: "relative", width: size, height: size, mx: "auto" }}>
        <Doughnut data={data} options={options} />
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <Typography variant="h5" sx={{ color: "primary.light", fontWeight: 700 }}>
            {adherence}%
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
