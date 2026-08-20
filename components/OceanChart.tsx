"use client";

import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export default function OceanChart({
  scores,
}: {
  scores: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
}) {
  return (
    <div className="chart-responsive oceanBarChartProfile">
      <Bar
        data={{
          labels: ["Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"],
          datasets: [
            {
              label: "Score (0–5)",
              data: [
                scores.openness,
                scores.conscientiousness,
                scores.extraversion,
                scores.agreeableness,
                scores.neuroticism,
              ],
              backgroundColor: ["#eaf7cf", "#d3ee9c", "#bce568", "#a2e436", "#7ab52a"],
              borderRadius: 4,
              barThickness: 25,
              barPercentage: 0.6,
              categoryPercentage: 0.6,
            },
          ],
        }}
        options={{
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { min: 0, max: 5, ticks: { stepSize: 1 }, title: { display: true, text: "Score" } },
            y: { title: { display: true, text: "Traits" } },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.label}: ${context.raw}/5`,
              },
            },
          },
        }}
      />
    </div>
  );
}
