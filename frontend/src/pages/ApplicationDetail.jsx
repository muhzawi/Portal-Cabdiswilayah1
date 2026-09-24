import React from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalLink, Heart } from "lucide-react";
import { useApp } from "../context/AppContext";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import { getAppIcon } from "../constants";
import api from "../api";

function ApplicationDetail() {
  const { id } = useParams();
  const { user, apps, favorites, toggleFavorite, addRecent } = useApp();
  const app = apps.find((item) => item.id === id);
  if (!app)
    return (
      <div className="page-content">
        <div className="empty-state">
          <h2>Aplikasi tidak ditemukan</h2>
          <Link className="text-link" to="/apps">
            Kembali ke aplikasi
          </Link>
        </div>
      </div>
    );
  const icon = app.icon || getAppIcon(app.category);
  return (
    <div className="page-content detail-page">
      <Link className="back-link" to="/apps">
        ← Kembali ke aplikasi
      </Link>
      <div className="detail-card">
        <div className="detail-icon">
          {React.createElement(icon, { size: 34 })}
        </div>
        <span className="eyebrow">{app.category}</span>
        <h1>{app.name}</h1>
        <p className="detail-description">{app.description}</p>
        <StatusBadge status={app.status} />
        <div className="detail-meta">
          <span>
            <strong>Versi</strong>
            {app.version}
          </span>
          <span>
            <strong>Status layanan</strong>
            {app.status === "available"
              ? "Beroperasi normal"
              : "Dalam pemeliharaan"}
          </span>
        </div>
        <div className="detail-actions">
          <Button
            disabled={app.status !== "available"}
            onClick={async () => {
              addRecent(app.id);
              try {
                const res = await api.get(`/api/apps/${app.id}/redirect`);
                window.open(res.data.url, "_blank", "noopener,noreferrer");
              } catch (err) {
                alert("Gagal membuka aplikasi.");
              }
            }}
          >
            {user?.role === "staff" || user?.role === "medium_user"
              ? "Kirim dokumen"
              : "Buka aplikasi"} <ExternalLink size={17} />
          </Button>
          <button
            className={`button button-secondary ${favorites.includes(app.id) ? "selected" : ""}`}
            onClick={() => toggleFavorite(app.id)}
          >
            <Heart
              size={17}
              fill={favorites.includes(app.id) ? "currentColor" : "none"}
            />
            {favorites.includes(app.id) ? "Favorit" : "Tambah favorit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApplicationDetail;