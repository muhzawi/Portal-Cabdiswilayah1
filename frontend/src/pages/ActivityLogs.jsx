import React, { useEffect, useState } from "react";
import { Activity, AlertCircle } from "lucide-react";
import api from "../api";

const labels = {
  login: "Masuk ke portal",
  staff_registered: "Staff mendaftar",
  user_registered: "Akun dibuat",
  user_approved: "Menyetujui akun",
  user_rejected: "Menolak akun",
  user_deleted: "Menghapus akun",
  role_changed: "Mengubah role",
  app_access_changed: "Mengubah akses aplikasi",
  password_changed: "Mengganti password",
};

function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/activity-logs")
      .then((res) => setLogs(res.data?.logs || []))
      .catch((err) => setError(err.response?.data?.error || "Gagal memuat log aktivitas."));
  }, []);

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Audit trail</span>
          <h1>Log aktivitas</h1>
          <p>Riwayat aktivitas admin dan staff di portal.</p>
        </div>
      </div>
      {error ? <div className="inline-empty"><AlertCircle size={20} /> {error}</div> : logs.length === 0 ? (
        <div className="inline-empty"><Activity size={20} /> Belum ada aktivitas tercatat.</div>
      ) : (
        <div className="activity-list">
          {logs.map((log) => (
            <div className="activity-row" key={log.id}>
              <div className="activity-icon"><Activity size={16} /></div>
              <div className="activity-copy">
                <strong>{labels[log.action] || log.action}</strong>
                <span>{log.actor_name || log.actor_email || "Sistem"}{log.target_name ? ` ke ${log.target_name}` : ""}</span>
              </div>
              <time>{new Date(log.created_at).toLocaleString("id-ID")}</time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityLogs;