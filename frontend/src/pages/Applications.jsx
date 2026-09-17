import React, { useMemo, useState } from "react";
import { Search, Plus, X, CheckCircle2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import AppCard from "../components/AppCard";
import api from "../api";

function Applications() {
  const { user, favorites, recent, apps, isLoadingApps, appsError } = useApp();
  const filter = new URLSearchParams(useLocation().search).get("filter");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua kategori");
  const [sort, setSort] = useState("Nama A-Z");

  // State Tambah Aplikasi Baru (Super User)
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [appName, setAppName] = useState("");
  const [appCategory, setAppCategory] = useState("Administrasi");
  const [appUrl, setAppUrl] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [appStatus, setAppStatus] = useState("available");
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [addAppError, setAddAppError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const isSuperUser = user?.role === "super_user";

  const handleAddAppSubmit = async (e) => {
    e.preventDefault();
    setAddAppError("");

    if (!appName.trim()) return setAddAppError("Nama aplikasi wajib diisi.");
    if (!appCategory.trim()) return setAddAppError("Kategori aplikasi wajib diisi.");
    if (!appUrl.trim() || !/^https?:\/\//.test(appUrl.trim())) {
      return setAddAppError("URL aplikasi wajib diawali http:// atau https://");
    }

    setIsSubmittingApp(true);
    try {
      const res = await api.post("/api/apps", {
        name: appName.trim(),
        category: appCategory.trim(),
        url: appUrl.trim(),
        description: appDescription.trim(),
        status: appStatus,
        version: appVersion.trim() || "1.0.0",
      });

      setToastMessage(res.data?.message || `Aplikasi ${appName} berhasil ditambahkan!`);
      setShowAddAppModal(false);

      // Reset form
      setAppName("");
      setAppCategory("Administrasi");
      setAppUrl("");
      setAppDescription("");
      setAppStatus("available");
      setAppVersion("1.0.0");

      // Reload page to reflect newly created app in context
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      setAddAppError(err.response?.data?.error || "Gagal menambahkan aplikasi.");
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const categories = [
    "Semua kategori",
    ...new Set(apps.map((app) => app.category)),
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

      setTimeout(() => {
        window.location.reload();
      }, 800);
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
            onClick={() => setShowAddAppModal(true)}
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
            <AppCard key={app.id} app={app} onDelete={handleDeleteApp} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={28} />
          <h3>Aplikasi tidak ditemukan</h3>
          <p>Coba ubah kata kunci atau filter pencarian Anda.</p>
        </div>
      )}

      {/* MODAL TAMBAH APLIKASI BARU (Khusus Super User) */}
      {showAddAppModal && (
        <div className="modal-overlay" onClick={() => setShowAddAppModal(false)}>
          <div
            className="modal-card modal-form-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Tambah Aplikasi Baru</h3>
              <button
                className="modal-close"
                onClick={() => setShowAddAppModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddAppSubmit} className="modal-form-body">
              <label>
                Nama Aplikasi *
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Contoh: E-Perpustakaan, Si-Akademik"
                  required
                />
              </label>

              <div className="form-grid-2">
                <label>
                  Kategori *
                  <select
                    value={appCategory}
                    onChange={(e) => setAppCategory(e.target.value)}
                    required
                  >
                    <option value="Administrasi">Administrasi</option>
                    <option value="Pendidikan">Pendidikan</option>
                    <option value="Kepegawaian">Kepegawaian</option>
                    <option value="Layanan">Layanan</option>
                  </select>
                </label>

                <label>
                  Status Aplikasi
                  <select
                    value={appStatus}
                    onChange={(e) => setAppStatus(e.target.value)}
                  >
                    <option value="available">Available (Tersedia)</option>
                    <option value="maintenance">Maintenance (Pemeliharaan)</option>
                    <option value="offline">Offline</option>
                  </select>
                </label>
              </div>

              <label>
                URL Aplikasi / Link Web *
                <input
                  type="url"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  placeholder="https://perpustakaan.disdikwil1.go.id"
                  required
                />
              </label>

              <label>
                Deskripsi Singkat
                <textarea
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="Jelaskan secara singkat fungsi utama aplikasi..."
                  rows={3}
                />
              </label>

              <label>
                Versi Aplikasi
                <input
                  type="text"
                  value={appVersion}
                  onChange={(e) => setAppVersion(e.target.value)}
                  placeholder="1.0.0"
                />
              </label>

              {addAppError && <div className="form-error">{addAppError}</div>}

              <div
                className="action-buttons"
                style={{ justifyContent: "flex-end", marginTop: "15px" }}
              >
                <button
                  type="button"
                  className="btn-detail"
                  onClick={() => setShowAddAppModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-approve"
                  disabled={isSubmittingApp}
                >
                  {isSubmittingApp ? "Menyimpan..." : "Simpan Aplikasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Applications;