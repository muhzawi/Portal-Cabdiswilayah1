import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Grid2X2,
  Users,
  Search,
  CheckCircle,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  PlusCircle,
  Pencil,
  Save,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import AppCard from "../components/AppCard";
import AppFormModal from "../components/AppFormModal";
import api from "../api";
import { getAppIcon } from "../constants";

function Dashboard() {
  const { user, apps } = useApp();
  const location = useLocation();

  // Tab aktif disinkronkan dengan query parameter ?tab=monitoring pada sidebar kiri
  const activeTab =
    new URLSearchParams(location.search).get("tab") === "monitoring"
      ? "monitoring"
      : "overview";

  // State Monitoring Pengguna (Super User)
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [selectedUser, setSelectedUser] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // State aplikasi untuk pilihan akses user
  const [allAppsList, setAllAppsList] = useState([]);

  // State Modal Tambah/Edit Aplikasi
  const [showAppModal, setShowAppModal] = useState(false);
  const [appToEdit, setAppToEdit] = useState(null);

  const handleOpenAddApp = () => {
    setAppToEdit(null);
    setShowAppModal(true);
  };

  const handleOpenEditApp = (app) => {
    setAppToEdit(app);
    setShowAppModal(true);
  };

  const isSuperUser = user?.role === "super_user";

  // Fetch users jika Super User berada di tab Monitoring
  const fetchUsers = async () => {
    if (!isSuperUser) return;
    setIsLoadingUsers(true);
    setUsersError("");
    try {
      const res = await api.get("/api/users");
      setUsersList(res.data?.users || []);
    } catch (err) {
      setUsersError("Gagal memuat daftar pengguna.");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isSuperUser) {
      fetchUsers();
      api
        .get("/api/public-apps")
        .then((res) => setAllAppsList(res.data?.applications || []))
        .catch(() => {});
    }
  }, [isSuperUser]);

  const availableApps = allAppsList.length > 0 ? allAppsList : apps;
  const [selectedCategory, setSelectedCategory] = useState("");

  const groupedAvailableApps = useMemo(() => {
    const groups = {};
    availableApps.forEach((app) => {
      const cat = app.category || "Lainnya";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(app);
    });
    return groups;
  }, [availableApps]);

  const categorySummaries = useMemo(
    () =>
      Object.entries(groupedAvailableApps).map(([name, categoryApps]) => ({
        name,
        apps: categoryApps,
        Icon: getAppIcon(name),
      })),
    [groupedAvailableApps],
  );

  useEffect(() => {
    if (
      selectedCategory &&
      !categorySummaries.some((category) => category.name === selectedCategory)
    ) {
      setSelectedCategory("");
    }
  }, [categorySummaries, selectedCategory]);

  const selectedCategoryApps =
    categorySummaries.find((category) => category.name === selectedCategory)?.apps || [];

  // State Edit Pengguna dengan fitur Save Changes
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    role: "medium_user",
    status: "approved",
    appAccess: [],
  });
  const [isSavingUser, setIsSavingUser] = useState(false);

  const handleOpenEditUser = (targetUser) => {
    setEditingUser(targetUser);
    setEditForm({
      role: targetUser.role || "medium_user",
      status: targetUser.status || "approved",
      appAccess: Array.isArray(targetUser.app_access)
        ? [...targetUser.app_access]
        : [],
    });
  };

  const handleToggleAppInEdit = (appId) => {
    setEditForm((prev) => {
      const exists = prev.appAccess.includes(appId);
      const nextAccess = exists
        ? prev.appAccess.filter((id) => id !== appId)
        : [...prev.appAccess, appId];
      return { ...prev, appAccess: nextAccess };
    });
  };

  const handleSelectAllApps = () => {
    setEditForm((prev) => ({
      ...prev,
      appAccess: availableApps.map((a) => a.id),
    }));
  };

  const handleClearAllApps = () => {
    setEditForm((prev) => ({
      ...prev,
      appAccess: [],
    }));
  };

  const handleSaveUserChanges = async () => {
    if (!editingUser) return;
    setIsSavingUser(true);
    try {
      const { role, status, appAccess } = editForm;

      // 1. Simpan perubahan Role jika ada perubahan
      if (role !== editingUser.role) {
        await api.patch(`/api/users/${editingUser.id}/role`, { role });
      }

      // 2. Simpan perubahan Hak Akses Aplikasi
      const newAccess = role === "super_user" ? [] : appAccess;
      await api.put(`/api/users/${editingUser.id}/app-access`, {
        applicationIds: newAccess,
      });

      // 3. Simpan perubahan Status jika ada perubahan
      if (status !== editingUser.status) {
        if (status === "approved" && editingUser.status !== "approved") {
          await api.patch(`/api/users/${editingUser.id}/approve`);
        } else if (status === "rejected" && editingUser.status !== "rejected") {
          await api.patch(`/api/users/${editingUser.id}/reject`);
        }
      }

      setToastMessage(
        `Perubahan hak akses dan data untuk "${editingUser.full_name}" berhasil disimpan!`
      );
      await fetchUsers();
      setEditingUser(null);
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Gagal menyimpan perubahan pengguna. Silakan coba lagi."
      );
    } finally {
      setIsSavingUser(false);
    }
  };

  const pendingCount = useMemo(
    () => usersList.filter((u) => u.status === "pending").length,
    [usersList],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.full_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "semua" || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [usersList, debouncedSearchQuery, statusFilter]);

  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await api.patch(`/api/users/${id}/approve`);
      setToastMessage(res.data?.message || "Akun berhasil disetujui!");
      fetchUsers();
      if (selectedUser?.id === id) {
        setSelectedUser((prev) => (prev ? { ...prev, status: "approved" } : null));
      }
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menyetujui pengguna.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAppAccessChange = async (targetUser, newAccessArray) => {
    if (targetUser.role === "super_user") {
      alert("Super User secara otomatis memiliki akses penuh ke seluruh aplikasi.");
      return;
    }

    setActionLoadingId(targetUser.id);
    try {
      await api.put(`/api/users/${targetUser.id}/app-access`, {
        applicationIds: newAccessArray,
      });

      const appNames = newAccessArray
        .map((id) => availableApps.find((a) => a.id === id)?.name || id)
        .join(", ");

      setToastMessage(
        `Akses aplikasi untuk ${targetUser.full_name} berhasil diperbarui: ${appNames || "Tanpa Akses"}`
      );

      fetchUsers();

      if (selectedUser?.id === targetUser.id) {
        setSelectedUser((prev) =>
          prev ? { ...prev, app_access: newAccessArray } : null
        );
      }
    } catch (err) {
      alert(
        err.response?.data?.error || "Gagal memperbarui akses aplikasi pengguna."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id, userName) => {
    if (id === user.id) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus akun ${userName || "pengguna ini"} secara permanen?`,
      )
    ) {
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await api.delete(`/api/users/${id}`);
      setToastMessage(res.data?.message || "Akun pengguna berhasil dihapus secara permanen.");
      fetchUsers();
      if (selectedUser?.id === id) {
        setSelectedUser(null);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menghapus pengguna.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const fetchPublicApps = () => {
    api
      .get("/api/public-apps")
      .then((res) => setAllAppsList(res.data?.applications || []))
      .catch(() => {});
  };

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

      fetchPublicApps();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menghapus aplikasi.");
    }
  };

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>
            Selamat Datang, {user.name} <span className="wave">✦</span>
          </h1>
          <p>
            {isSuperUser
              ? "Kelola layanan portal dan monitoring pengguna."
              : "Apa yang ingin Anda akses hari ini?"}
          </p>
        </div>
        <span className="date-label">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="form-success" style={{ marginBottom: "20px" }}>
          <CheckCircle2 size={16} /> {toastMessage}
          <button
            onClick={() => setToastMessage("")}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW & APLIKASI (Desain Asli) */}
      {activeTab === "overview" && (
        <>
          <section className="dashboard-hero">
            <div>
              <span className="pill pill-light">Portal terpusat</span>
              <h2>
                Semua aplikasi
                <br />
                <em>untuk pekerjaan Anda.</em>
              </h2>
              <p>Temukan layanan yang Anda butuhkan dengan lebih cepat.</p>
            </div>
            <div className="dashboard-hero-shape">
              <Grid2X2 size={72} strokeWidth={1.2} />
            </div>
          </section>

          {availableApps.length > 0 && (
            <section className="content-section category-browser">
              {!selectedCategory ? (
                <>
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">Kategori</span>
                      <h2>Pilih area kerja Anda</h2>
                    </div>
                    <p className="section-heading-description">
                      Pilih kategori untuk melihat layanan aplikasi yang tersedia.
                    </p>
                  </div>
                  <div className="category-selector-grid">
                    {categorySummaries.map(({ name, apps: categoryApps, Icon }) => (
                      <button
                        type="button"
                        key={name}
                        className="category-card category-card--interactive"
                        onClick={() => setSelectedCategory(name)}
                      >
                        <span className="category-card-icon">
                          <Icon size={24} />
                        </span>
                        <span className="category-card-copy">
                          <strong>{name}</strong>
                          <span>{categoryApps.length} aplikasi tersedia</span>
                          <small>
                            Layanan untuk kebutuhan {name.toLowerCase()} Anda.
                          </small>
                          <span className="category-card-link">
                            Selengkapnya <ArrowRight size={15} />
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <section className="applications-panel" aria-live="polite">
                  <div className="applications-panel-heading">
                    <div>
                      <span className="eyebrow">Aplikasi dalam kategori</span>
                      <h2>{selectedCategory}</h2>
                      <p className="category-page-summary">
                        {selectedCategoryApps.length} aplikasi tersedia untuk kebutuhan{" "}
                        {selectedCategory.toLowerCase()}.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="panel-close-button"
                      onClick={() => setSelectedCategory("")}
                    >
                      <ArrowLeft size={15} />
                      Kembali ke kategori
                    </button>
                  </div>
                  <p className="applications-panel-description">
                    Pilih aplikasi untuk langsung membuka layanan terkait.
                  </p>
                  <div className="app-grid app-grid--subcards">
                    {selectedCategoryApps.map((app) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        directLink
                        onDelete={isSuperUser ? handleDeleteApp : undefined}
                        onEdit={isSuperUser ? handleOpenEditApp : undefined}
                      />
                    ))}
                  </div>
                </section>
              )}
            </section>
          )}
        </>
      )}

      {/* TAB 2: MONITORING PENGGUNA (Khusus Super User) */}
      {activeTab === "monitoring" && isSuperUser && (
        <div className="monitoring-container">
          <div className="monitoring-filter-bar">
            <label className="search-input monitoring-search">
              <Search size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau email pengguna..."
              />
            </label>

            <div className="filter-pills">
              {[
                { label: "Semua", value: "semua" },
                { label: `Pending (${pendingCount})`, value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
              ].map((item) => (
                <button
                  key={item.value}
                  className={`pill-filter ${statusFilter === item.value ? "active" : ""}`}
                  onClick={() => setStatusFilter(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {isLoadingUsers ? (
            <div className="inline-empty">
              <span className="empty-clock">◷</span>
              <span>Memuat daftar pengguna...</span>
            </div>
          ) : usersError ? (
            <div className="inline-empty">
              <span>{usersError}</span>
            </div>
          ) : filteredUsers.length ? (
            <div className="user-table-wrapper">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Pengguna</th>
                    <th>Role</th>
                    <th>Status Akun</th>
                    <th>Akses Aplikasi</th>
                    <th>Tanggal Registrasi</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const currentAppId = u.app_access?.[0] || "";
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="user-name-cell">
                            <strong>{u.full_name}</strong>
                            <span>{u.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className="eyebrow" style={{ fontSize: "0.72rem" }}>
                            {u.role === "super_user" ? "Super User" : "Medium User"}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge-pill ${u.status || "approved"}`}>
                            {u.status === "pending"
                              ? "Pending"
                              : u.status === "rejected"
                                ? "Rejected"
                                : "Approved"}
                          </span>
                        </td>
                        <td>
                          {u.role === "super_user" ? (
                            <span className="pill-all-access">Semua Aplikasi</span>
                          ) : (
                            <div className="app-pill-summary-list">
                              {(u.app_access || []).length > 0 ? (
                                <>
                                  {u.app_access.slice(0, 3).map((appId) => {
                                    const app = availableApps.find((a) => a.id === appId);
                                    return (
                                      <span key={appId} className="app-pill-tag">
                                        {app?.name || appId}
                                      </span>
                                    );
                                  })}
                                  {u.app_access.length > 3 && (
                                    <span className="app-pill-more">
                                      +{u.app_access.length - 3} lainnya
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span style={{ color: "var(--muted)", fontSize: "0.78rem", fontStyle: "italic" }}>
                                  Belum ada akses
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-detail"
                              onClick={() => setSelectedUser(u)}
                              title="Lihat Detail"
                            >
                              <Eye size={14} /> Detail
                            </button>

                            <button
                              className="btn-edit-user"
                              onClick={() => handleOpenEditUser(u)}
                              title="Edit Role & Akses"
                            >
                              <Pencil size={14} /> Edit
                            </button>

                            {u.status === "pending" && (
                              <button
                                className="btn-approve"
                                disabled={actionLoadingId === u.id}
                                onClick={() => handleApprove(u.id)}
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                            )}

                            {u.id !== user.id && (
                              <button
                                className="btn-reject"
                                disabled={actionLoadingId === u.id}
                                onClick={() => handleDelete(u.id, u.full_name)}
                                title="Hapus Akun Pengguna"
                              >
                                <Trash2 size={14} /> Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="inline-empty">
              <AlertCircle size={22} />
              <span>Tidak ada pengguna yang cocok dengan pencarian / filter.</span>
            </div>
          )}
        </div>
      )}

      {/* MODAL DETAIL PENGGUNA */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Pengguna</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedUser(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>Nama Lengkap</label>
                <span>{selectedUser.full_name}</span>
              </div>
              <div className="detail-row">
                <label>Email</label>
                <span>{selectedUser.email}</span>
              </div>
              <div className="detail-row">
                <label>ID Pengguna</label>
                <span style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
                  {selectedUser.id}
                </span>
              </div>
              <div className="detail-row">
                <label>Role</label>
                <span>
                  {selectedUser.role === "super_user"
                    ? "Super User"
                    : "Medium User"}
                </span>
              </div>
              <div className="detail-row">
                <label>Status Akun</label>
                <span className={`status-badge-pill ${selectedUser.status}`}>
                  {selectedUser.status}
                </span>
              </div>
              <div className="detail-row" style={{ alignItems: "start" }}>
                <label>Akses Aplikasi</label>
                {selectedUser.role === "super_user" ? (
                  <span className="pill-all-access">Semua Aplikasi (Akses Penuh)</span>
                ) : (
                  <div className="app-pill-summary-list">
                    {(selectedUser.app_access || []).length > 0 ? (
                      selectedUser.app_access.map((appId) => {
                        const app = availableApps.find((a) => a.id === appId);
                        return (
                          <span key={appId} className="app-pill-tag">
                            {app?.name || appId}
                          </span>
                        );
                      })
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                        Belum ada akses aplikasi yang diberikan
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="detail-row">
                <label>Tanggal Dibuat</label>
                <span>
                  {selectedUser.created_at
                    ? new Date(selectedUser.created_at).toLocaleString("id-ID")
                    : "-"}
                </span>
              </div>
            </div>
            <div className="action-buttons" style={{ justifyContent: "flex-end", marginTop: "16px", gap: "10px" }}>
              <button
                className="btn-edit-user"
                style={{ padding: "8px 14px", fontSize: "0.82rem" }}
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  handleOpenEditUser(target);
                }}
              >
                <Pencil size={15} /> Edit Pengguna
              </button>
              {selectedUser.status !== "approved" && (
                <button
                  className="btn-approve"
                  disabled={actionLoadingId === selectedUser.id}
                  onClick={() => handleApprove(selectedUser.id)}
                >
                  <CheckCircle size={14} /> Approve Akun
                </button>
              )}
              {selectedUser.id !== user.id && (
                <button
                  className="btn-reject"
                  disabled={actionLoadingId === selectedUser.id}
                  onClick={() => handleDelete(selectedUser.id, selectedUser.full_name)}
                >
                  <Trash2 size={14} /> Hapus Akun
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT PENGGUNA (DENGAN FITUR SAVE CHANGES) */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => !isSavingUser && setEditingUser(null)}>
          <div className="modal-card edit-user-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Edit Pengguna & Hak Akses</h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
                  {editingUser.full_name} &bull; {editingUser.email}
                </p>
              </div>
              <button
                className="modal-close"
                disabled={isSavingUser}
                onClick={() => setEditingUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="edit-user-modal-body">
              {/* Role Selection */}
              <div className="form-group-block">
                <label>Role Pengguna</label>
                <div className="role-radio-group">
                  <div
                    className={`role-radio-option ${editForm.role === "medium_user" ? "selected" : ""}`}
                    onClick={() => setEditForm((prev) => ({ ...prev, role: "medium_user" }))}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      checked={editForm.role === "medium_user"}
                      onChange={() => {}}
                    />
                    <div>
                      <strong>Medium User</strong>
                      <div style={{ fontSize: "0.74rem", color: "var(--muted)" }}>
                        Akses dibatasi sesuai aplikasi yang dicentang
                      </div>
                    </div>
                  </div>

                  <div
                    className={`role-radio-option ${editForm.role === "super_user" ? "selected" : ""}`}
                    onClick={() => setEditForm((prev) => ({ ...prev, role: "super_user" }))}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      checked={editForm.role === "super_user"}
                      onChange={() => {}}
                    />
                    <div>
                      <strong>Super User</strong>
                      <div style={{ fontSize: "0.74rem", color: "var(--muted)" }}>
                        Akses penuh ke semua aplikasi & hak kelola
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Akun */}
              <div className="form-group-block">
                <label>Status Akun</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--surface)",
                    color: "var(--ink)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                >
                  <option value="approved">Approved (Disetujui & Aktif)</option>
                  <option value="pending">Pending (Menunggu Persetujuan)</option>
                  <option value="rejected">Rejected (Ditolak)</option>
                </select>
              </div>

              {/* Hak Akses Aplikasi */}
              <div className="form-group-block">
                {editForm.role === "super_user" ? (
                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "8px",
                      background: "rgba(34, 197, 94, 0.08)",
                      border: "1px solid rgba(34, 197, 94, 0.2)",
                      fontSize: "0.82rem",
                      color: "var(--ink)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <CheckCircle2 size={16} color="var(--green-700)" />
                    <span>
                      <strong>Super User</strong> secara otomatis memiliki izin akses ke seluruh aplikasi portal.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="app-selection-header">
                      <label style={{ margin: 0 }}>
                        Aplikasi yang Diizinkan ({editForm.appAccess.length} dipilih)
                      </label>
                      <div className="app-selection-actions">
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={handleSelectAllApps}
                        >
                          Pilih Semua
                        </button>
                        <span style={{ color: "var(--line)" }}>|</span>
                        <button
                          type="button"
                          className="btn-text-action"
                          onClick={handleClearAllApps}
                        >
                          Hapus Semua
                        </button>
                      </div>
                    </div>

                    <div className="apps-checklist-grid">
                      {availableApps.map((app) => {
                        const isChecked = editForm.appAccess.includes(app.id);
                        return (
                          <label
                            key={app.id}
                            className={`app-check-item ${isChecked ? "checked" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleAppInEdit(app.id)}
                            />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <strong>{app.name}</strong>
                              <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                                {app.category || "Umum"}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                padding: "16px 20px",
                borderTop: "1px solid var(--line)",
                background: "var(--surface)",
                borderRadius: "0 0 12px 12px",
              }}
            >
              <button
                type="button"
                className="btn-cancel"
                disabled={isSavingUser}
                onClick={() => setEditingUser(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-save-changes"
                disabled={isSavingUser}
                onClick={handleSaveUserChanges}
              >
                <Save size={16} />
                {isSavingUser ? "Menyimpan Perubahan..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT APLIKASI (Super User) */}
      <AppFormModal
        isOpen={showAppModal}
        onClose={() => setShowAppModal(false)}
        appToEdit={appToEdit}
        onSuccess={(msg) => {
          setToastMessage(msg);
          fetchPublicApps();
          fetchUsers();
        }}
      />
    </div>
  );
}

export default Dashboard;