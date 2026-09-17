import React, { useMemo, useState } from "react";
import { Search, Plus, X, CheckCircle2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import AppCard from "../components/AppCard";
import AppFormModal from "../components/AppFormModal";
import api from "../api";

function Applications() {
  const { user, favorites, recent, apps, isLoadingApps, appsError, refreshApps } = useApp();
  const filter = new URLSearchParams(useLocation().search).get("filter");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua kategori");
  const [sort, setSort] = useState("Nama A-Z");

  // State Modal Tambah / Edit Aplikasi (Super User)
  const [showAppModal, setShowAppModal] = useState(false);
  const [appToEdit, setAppToEdit] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const isSuperUser = user?.role === "super_user";

  const handleOpenAddApp = () => {
    setAppToEdit(null);
    setShowAppModal(true);
  };

  const handleOpenEditApp = (app) => {
    setAppToEdit(app);
    setShowAppModal(true);
  };

  const categories = [
    "Semua kategori",
    ...Array.from(new Set(apps.map((app) => app.category).filter(Boolean))),
  ];

  const filtered = useMemo(
    () =>
      apps
        .filter((app) => {
          const matchesQuery = `${app.name} ${app.description}`
            .toLowerCase()
            .includes(query.toLowerCase());
          const matchesCategory =
            category === "Semua kategori" || app.category === category;
          const matchesFilter =
            filter === "favorite"
              ? favorites.includes(app.id)
              : filter === "recent"
                ? recent.includes(app.id)
                : true;
          return matchesQuery && matchesCategory && matchesFilter;
        })
        .sort((a, b) =>
          sort === "Nama Z-A"
            ? b.name.localeCompare(a.name)
            : a.name.localeCompare(b.name),
        ),
    [query, category, sort, favorites, recent, filter, apps],
  );

  const handleDeleteApp = async (appToDelete) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus aplikasi "${appToDelete.name}" dari portal secara permanen?`,
      )
    ) {
      return;
    }

    try {
      const res = await api.delete(`/api/apps/${appToDelete.id}`);
      setToastMessage(res.data?.message || `Aplikasi ${appToDelete.name} berhasil dihapus.`);
      if (refreshApps) {
        await refreshApps();
      }
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menghapus aplikasi.");
    }
  };

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Application hub</span>
          <h1>Semua aplikasi</h1>
          <p>Temukan layanan yang membantu pekerjaan Anda.</p>
        </div>
        {isSuperUser && (
          <button
            className="btn-add-app"
            onClick={handleOpenAddApp}
          >
            <Plus size={16} /> Tambah Aplikasi Baru
          </button>
        )}
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="form-success" style={{ marginBottom: "20px" }}>
          <CheckCircle2 size={16} /> {toastMessage}
          <button
            onClick={() => setToastMessage("")}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="filter-bar">
        <label className="search-input">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari aplikasi..."
          />
        </label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option>Nama A-Z</option>
          <option>Nama Z-A</option>
        </select>
      </div>

      {isLoadingApps ? (
        <div className="empty-state">
          <h3>Memuat aplikasi...</h3>
        </div>
      ) : appsError ? (
        <div className="empty-state">
          <h3>{appsError}</h3>
        </div>
      ) : filtered.length ? (
        <div className="app-grid">
          {filtered.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              onDelete={handleDeleteApp}
              onEdit={isSuperUser ? handleOpenEditApp : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={28} />
          <h3>Aplikasi tidak ditemukan</h3>
          <p>Coba ubah kata kunci atau filter pencarian Anda.</p>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT APLIKASI (Super User) */}
      <AppFormModal
        isOpen={showAppModal}
        onClose={() => setShowAppModal(false)}
        appToEdit={appToEdit}
        onSuccess={(msg) => setToastMessage(msg)}
      />
    </div>
  );
}

export default Applications;