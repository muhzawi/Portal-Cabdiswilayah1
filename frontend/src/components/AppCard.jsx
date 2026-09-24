import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Pencil, Star, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import StatusBadge from "./ui/StatusBadge";
import { getAppIcon } from "../constants";

function AppCard({ app, showFavorite = true, onDelete, onEdit }) {
  const { user, favorites = [], toggleFavorite, addRecent } = useApp() || {};
  const Icon = app.icon || getAppIcon(app.category);
  const isFav = favorites.includes(app.id);

  // Jika belum login (Landing page), tombol selalu aktif mengarah ke /login
  const isDisabled = user ? app.status !== "available" : false;

  return (
    <article className="app-card">
      <div className="app-card-top">
        <div className="app-icon">
          {React.createElement(Icon, { size: 22 })}
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {["superadmin", "super_user"].includes(user?.role) && onEdit && (
            <button
              className="icon-button btn-edit-app"
              title="Edit Aplikasi"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(app);
              }}
            >
              <Pencil size={16} />
            </button>
          )}
          {["superadmin", "super_user"].includes(user?.role) && onDelete && (
            <button
              className="icon-button btn-delete-app"
              title="Hapus Aplikasi"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(app);
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
          {showFavorite && (
            <button
              className={`icon-button ${isFav ? "is-favorite" : ""}`}
              aria-label={`${isFav ? "Hapus" : "Tambah"} ${app.name} dari favorit`}
              onClick={() => toggleFavorite?.(app.id)}
            >
              <Star
                size={18}
                fill={isFav ? "currentColor" : "none"}
              />
            </button>
          )}
        </div>
      </div>
      <div className="app-card-content">
        <span className="eyebrow">{app.category}</span>
        <h3>{app.name}</h3>
        <p>{app.description}</p>
        <StatusBadge status={app.status} />
      </div>
      <Link
        className={`card-action ${isDisabled ? "disabled" : ""}`}
        to={user ? `/apps/${app.id}` : "/login"}
        onClick={() => user && app.status === "available" && addRecent?.(app.id)}
      >
        Buka aplikasi <ArrowRight size={16} />
      </Link>
    </article>
  );
}

export default AppCard;