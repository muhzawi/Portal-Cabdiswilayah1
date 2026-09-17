import React from "react";

function StatusBadge({ status }) {
  const labels = {
    available: "Tersedia",
    maintenance: "Pemeliharaan",
    offline: "Offline",
  };
  return (
    <span className={`status status-${status}`}>
      <span />
      {labels[status]}
    </span>
  );
}

export default StatusBadge;