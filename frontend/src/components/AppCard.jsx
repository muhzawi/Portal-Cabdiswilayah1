import React from "react";
import { ArrowRight, ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import StatusBadge from "./ui/StatusBadge";
import { getAppIcon } from "../constants";

function AppCard({ app, showFavorite = true, onDelete, onEdit, directLink = false }) {
  const { user, favorites = [], toggleFavorite, addRecent } = useApp() || {};
  const Icon = app.icon || getAppIcon(app.category);
  const isFav = favorites.includes(app.id);

  // Jika belum login (Landing page), tombol selalu aktif mengarah ke /login
  const isDisabled = user ? app.status !== "available" : false;

  return (
    <article className="app-card">
      <div className="app-card-top">
        <div className="app-icon">
          {app.icon_url ? (
            <img src={app.icon_url} alt={`${app.name} icon`} className="app-icon-image" />
          ) : (
            React.createElement(Icon, { size: 22 })
          )}
        </div>
        <div className="app-card-actions">
          {user?.role === "super_user" && onEdit && (
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
          {user?.role === "super_user" && onDelete && (
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
      {directLink ? (
        <a
          className={`card-action ${isDisabled ? "disabled" : ""}`}
          href={isDisabled ? undefined : app.url}
          target="_blank"
          rel="noreferrer"
          aria-disabled={isDisabled}
          onClick={(event) => {
            if (isDisabled) {
              event.preventDefault();
              return;
            }
            addRecent?.(app.id);
          }}
        >
          Buka aplikasi <ExternalLink size={16} />
        </a>
      ) : (
        <a
          className={`card-action ${isDisabled ? "disabled" : ""}`}
          href={isDisabled ? undefined : app.url}
          target="_blank"
          rel="noreferrer"
          aria-disabled={isDisabled}
          onClick={(event) => {
            if (isDisabled) {
              event.preventDefault();
              return;
            }
            addRecent?.(app.id);
          }}
        >
          Buka aplikasi <ArrowRight size={16} />
        </a>
      )}
    </article>
  );
}

export default AppCard;