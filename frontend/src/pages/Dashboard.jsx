import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Grid2X2,
  Star,
  Search,
  CheckCircle,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import AppCard from "../components/AppCard";
import AppFormModal from "../components/AppFormModal";
import ClockIcon from "../components/ui/ClockIcon";
import api from "../api";

function getRoleCapability(role) {
  if (["super_user", "superadmin"].includes(role)) return "Akses semua aplikasi";
  if (role === "admin") return "Upload aplikasi dan kelola pengguna";
  return "Kirim dokumen dari aplikasi yang diberikan";
}

function Dashboard() {
  const { user, favorites, recent, apps, isLoadingApps, appsError } = useApp();
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
  const [statusFilter, setStatusFilter] = useState("semua");
  const [selectedUser, setSelectedUser] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // State aplikasi untuk pilihan akses user
  const [allAppsList, setAllAppsList] = useState([]);

  // State Modal Tambah/Edit Aplikasi
  const [showAppModal, setShowAppModal] = useState(false);
  const [appToEdit, setAppToEdit] = useState(null);

  const handleOpenEditApp = (app) => {
    setAppToEdit(app);
    setShowAppModal(true);
  };

  const isAdmin = ["admin", "superadmin", "super_user"].includes(user?.role);
  const isSuperUser = ["superadmin", "super_user"].includes(user?.role);

  // Fetch users jika Super User berada di tab Monitoring
  const fetchUsers = async () => {
    if (!isAdmin) return;
    setIsLoadingUsers(true);
    setUsersError("");
    try {
      const res = await api.get("/api/users");
      setUsersList(res.data?.users || []);
    } catch {
      setUsersError("Gagal memuat daftar pengguna.");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      api
        .get("/api/public-apps")
        .then((res) => setAllAppsList(res.data?.applications || []))
        .catch(() => {});
    }
  }, [isAdmin]);

  const availableApps = allAppsList.length > 0 ? allAppsList : apps;

  const pendingCount = useMemo(
    () => usersList.filter((u) => u.status === "pending").length,
    [usersList],
  );

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "semua" || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [usersList, searchQuery, statusFilter]);

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

  const handleReject = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await api.patch(`/api/users/${id}/reject`);
      setToastMessage(res.data?.message || "Akun berhasil ditolak.");
      fetchUsers();
      if (selectedUser?.id === id) {
        setSelectedUser((prev) => (prev ? { ...prev, status: "rejected" } : null));
      }
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menolak pengguna.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleChange = async (targetUser, role) => {
    if (targetUser.id === user.id) return;
    setActionLoadingId(targetUser.id);
    try {
      await api.patch(`/api/users/${targetUser.id}/role`, { role });
      setToastMessage(`Role ${targetUser.full_name} berhasil diubah menjadi ${role}.`);
      fetchUsers();
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser((prev) => (prev ? { ...prev, role } : null));
      }
    } catch (err) {
      alert(err.response?.data?.error || "Gagal mengubah role pengguna.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAppAccessChange = async (targetUser, newAccessArray) => {
    if (["super_user", "superadmin"].includes(targetUser.role)) {
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
      alert(err.response?.data?.error || "Gagal memperbarui akses aplikasi pengguna.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id, userName) => {
    if (id === user.id) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }
    if (!window.confirm(`Apakah Anda yakin ingin menghapus akun ${userName || "pengguna ini"} secara permanen?`)) {
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await api.delete(`/api/users/${id}`);
      setToastMessage(res.data?.message || "Akun pengguna berhasil dihapus secara permanen.");
      fetchUsers();
      if (selectedUser?.id === id) setSelectedUser(null);
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

  const favoriteApps = apps.filter((app) => favorites.includes(app.id));
  const recentApps = recent
    .map((id) => apps.find((app) => app.id === id))
    .filter(Boolean);

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>
            Selamat datang, {user.name} <span className="wave">✦</span>
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

          {isSuperUser && availableApps.length > 0 && (
            <section className="content-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Kelola Katalog</span>
                  <h2>Seluruh Aplikasi Portal ({availableApps.length})</h2>
                </div>
              </div>
              <div className="app-grid">
                {availableApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onDelete={handleDeleteApp}
                    onEdit={handleOpenEditApp}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="content-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Favorit</span>
                <h2>Aplikasi Favorit</h2>
              </div>
              <Link className="text-link" to="/apps">
                Lihat semua <ArrowRight size={16} />
              </Link>
            </div>

            {isLoadingApps ? (
              <div className="inline-empty">
                <span className="empty-clock">◷</span>
                <span>Memuat aplikasi...</span>
              </div>
            ) : appsError ? (
              <div className="inline-empty">
                <span>{appsError}</span>
              </div>
            ) : favoriteApps.length ? (
              <div className="app-grid">
                {favoriteApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onDelete={handleDeleteApp}
                    onEdit={isSuperUser ? handleOpenEditApp : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="inline-empty">
                <Star size={20} />
                <span>Belum ada aplikasi favorit.</span>
                <Link to="/apps">Jelajahi aplikasi</Link>
              </div>
            )}
          </section>

          <section className="content-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Aktivitas</span>
                <h2>Baru dibuka</h2>
              </div>
            </div>

            {isLoadingApps ? (
              <div className="inline-empty">
                <span className="empty-clock">◷</span>
                <span>Memuat aplikasi...</span>
              </div>
            ) : appsError ? (
              <div className="inline-empty">
                <span>{appsError}</span>
              </div>
            ) : recentApps.length ? (
              <div className="app-grid">
                {recentApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onDelete={handleDeleteApp}
                    onEdit={isSuperUser ? handleOpenEditApp : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="inline-empty">
                <ClockIcon />
                <span>Aplikasi yang Anda buka akan muncul di sini.</span>
              </div>
            )}
          </section>
        </>
      )}

      {/* TAB 2: MONITORING PENGGUNA (Admin dan Super Admin) */}
      {activeTab === "monitoring" && isAdmin && (
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
                    <th>Kemampuan</th>
                    <th>Akses Aplikasi</th>
                    <th>Tanggal Registrasi</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="user-name-cell">
                            <strong>{u.full_name}</strong>
                            <span>{u.email}</span>
                          </div>
                        </td>
                        <td>
                          {isSuperUser ? (
                            <select
                              className="role-select"
                              value={u.role === "super_user" ? "superadmin" : u.role}
                              disabled={u.id === user.id || actionLoadingId === u.id}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              aria-label={`Ubah role ${u.full_name}`}
                            >
                              <option value="staff">Staff</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className="eyebrow" style={{ fontSize: "0.72rem" }}>
                              {u.role === "super_user" || u.role === "superadmin" ? "Super Admin" : u.role === "admin" ? "Admin" : "Staff"}
                            </span>
                          )}
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
                          <span className={`capability-badge ${u.status === "approved" ? "active" : "waiting"}`}>
                            {u.status === "approved" ? getRoleCapability(u.role) : "Aktif setelah Approved"}
                          </span>
                        </td>
                        <td>
                          {["super_user", "superadmin"].includes(u.role) ? (
                            <span className="pill-all-access">Semua Aplikasi</span>
                          ) : (
                            <div className="multi-app-select-container">
                              {availableApps.map((app) => {
                                const isChecked = (u.app_access || []).includes(app.id);
                                return (
                                  <label
                                    key={app.id}
                                    className={`app-checkbox-pill ${isChecked ? "active" : ""}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={actionLoadingId === u.id}
                                      onChange={(e) => {
                                        const currentAccess = u.app_access || [];
                                        let newAccess;
                                        if (e.target.checked) {
                                          newAccess = [...currentAccess, app.id];
                                        } else {
                                          newAccess = currentAccess.filter(
                                            (id) => id !== app.id,
                                          );
                                        }
                                        handleAppAccessChange(u, newAccess);
                                      }}
                                    />
                                    <span>{app.name}</span>
                                  </label>
                                );
                              })}
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

                            {u.status === "pending" && (
                              <button
                                className="btn-approve"
                                disabled={actionLoadingId === u.id}
                                onClick={() => handleApprove(u.id)}
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                            )}

                            {u.status === "pending" && u.id !== user.id && (
                              <button
                                className="btn-reject"
                                disabled={actionLoadingId === u.id}
                                onClick={() => handleReject(u.id)}
                                title="Tolak pendaftaran"
                              >
                                <X size={14} /> Tolak
                              </button>
                            )}
                            {u.id !== user.id && u.status !== "pending" && (
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
            <div className="user-detail-summary">
              <div className="user-detail-avatar">
                {(selectedUser.full_name || selectedUser.email || "U")[0].toUpperCase()}
              </div>
              <div>
                <strong>{selectedUser.full_name || "Nama belum tersedia"}</strong>
                <span>{selectedUser.email || "Email belum tersedia"}</span>
              </div>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>Role</label>
                <span>
                  {selectedUser.role === "super_user" || selectedUser.role === "superadmin"
                    ? "Super Admin"
                    : selectedUser.role === "admin" ? "Admin" : "Staff"}
                </span>
              </div>
              <div className="detail-row">
                <label>Status Akun</label>
                <span className={`status-badge-pill ${selectedUser.status}`}>
                  {selectedUser.status}
                </span>
              </div>
              <div className="detail-row">
                <label>Hak Akses Role</label>
                <span>
                  {selectedUser.status === "approved"
                    ? getRoleCapability(selectedUser.role)
                    : "Belum aktif, menunggu approval akun"}
                </span>
              </div>
              <div className="detail-row" style={{ alignItems: "start" }}>
                <label>Akses Aplikasi</label>
                {["super_user", "superadmin"].includes(selectedUser.role) ? (
                  <span className="pill-all-access">Semua Aplikasi (Akses Penuh)</span>
                ) : (
                  <div className="multi-app-select-container">
                    {availableApps.map((app) => {
                      const isChecked = (selectedUser.app_access || []).includes(app.id);
                      return (
                        <label
                          key={app.id}
                          className={`app-checkbox-pill ${isChecked ? "active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={actionLoadingId === selectedUser.id}
                            onChange={(e) => {
                              const currentAccess = selectedUser.app_access || [];
                              const newAccess = e.target.checked
                                ? [...currentAccess, app.id]
                                : currentAccess.filter((id) => id !== app.id);
                              handleAppAccessChange(selectedUser, newAccess);
                            }}
                          />
                          <span>{app.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="detail-row">
                <label>Tanggal Pendaftaran</label>
                <span>
                  {selectedUser.created_at
                    ? new Date(selectedUser.created_at).toLocaleString("id-ID")
                    : "Belum tersedia"}
                </span>
              </div>
            </div>
            <div className="action-buttons" style={{ justifyContent: "flex-end", marginTop: "10px" }}>
              {selectedUser.status === "pending" && (
                <button
                  className="btn-approve"
                  disabled={actionLoadingId === selectedUser.id}
                  onClick={() => handleApprove(selectedUser.id)}
                >
                  <CheckCircle size={14} /> Approve Akun
                </button>
              )}
              {selectedUser.status === "pending" && selectedUser.id !== user.id && (
                <button
                  className="btn-reject"
                  disabled={actionLoadingId === selectedUser.id}
                  onClick={() => handleReject(selectedUser.id)}
                >
                  <X size={14} /> Tolak Akun
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