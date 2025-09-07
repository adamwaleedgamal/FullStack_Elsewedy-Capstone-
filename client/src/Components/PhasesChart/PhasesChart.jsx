import React from "react";
import "./PhasesChart.css";

const PhasesChart = () => {
  const phases = [
    { name: "Phase 1", value: 90 },
    { name: "Phase 2", value: 70 },
    { name: "Phase 3", value: 85 },
    { name: "Phase 4", value: 60 },
  ];

  return (
    <div className="phases-chart">
      <div className="chart-header">
      </div>
      <div className="chart-bars">
        {phases.map((phase, index) => (
          <div key={index} className="chart-bar-container">
            <div className="chart-bar">
              <div
                className="chart-bar-fill"
                style={{ height: `${phase.value}%` }}
              >
                <span className="chart-bar-percentage">{phase.value}%</span>
              </div>
            </div>
            <span className="chart-bar-label">{phase.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhasesChart;
