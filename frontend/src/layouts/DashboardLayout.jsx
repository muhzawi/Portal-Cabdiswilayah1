import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Activity, Bell, ChevronDown, Grid2X2, Heart, Home, LogOut, Menu, Search, Settings, Star, Users, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import Logo from "../components/ui/Logo";
import api from "../api";

function DashboardLayout({ children }) {
  const { user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const isAdmin = ["admin", "superadmin", "super_user"].includes(user?.role);
  const isSuperAdmin = ["superadmin", "super_user"].includes(user?.role);

  useEffect(() => {
    if (!isAdmin) return;
    api.get("/api/users")
      .then((res) => {
        setPendingUsers((res.data?.users || []).filter((item) => item.status === "pending"));
      })
      .catch(() => setPendingUsers([]));
  }, [isAdmin]);

  const notificationCount = pendingUsers.length;
  if (!user) return <Navigate to="/login" replace />;
  const nav = [
    ["/dashboard", "Dashboard", Home],
    ...(isAdmin
      ? [["/dashboard?tab=monitoring", "Monitoring Pengguna", Users]]
      : []),
    ...(isSuperAdmin ? [["/activity-logs", "Log Aktivitas", Activity]] : []),
    ["/apps", "Aplikasi", Grid2X2],
    ["/apps?filter=favorite", "Favorit", Heart],
    ["/apps?filter=recent", "Baru Dibuka", Star],
  ];
  return (
    <div className="dashboard-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-top">
          <Logo />
          <button
            className="icon-button mobile-close"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="side-nav">
          {nav.map(([path, label, Icon]) => (
            <Link
              key={label}
              className={
                location.pathname + location.search === path ? "active" : ""
              }
              to={path}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="side-bottom">
          <Link to="/settings">
            <Settings size={18} />
            Pengaturan
          </Link>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="mobile-overlay"
          onClick={() => setOpen(false)}
          aria-label="Tutup menu"
        />
      )}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <button
            className="icon-button menu-trigger"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={21} />
          </button>
          <div className="header-search">
            <Search size={18} />
            <input placeholder="Cari aplikasi..." />
          </div>
          <div className="header-actions">
            <button
              className={`icon-button notification-trigger ${notificationsOpen ? "active" : ""}`}
              aria-label="Notifikasi"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((current) => !current)}
            >
              <Bell size={19} />
              {notificationCount > 0 && <span className="notification-dot" />}
            </button>
            {notificationsOpen && (
              <div className="notification-panel">
                <div className="notification-panel-header">
                  <strong>Notifikasi</strong>
                  {notificationCount > 0 && <span>{notificationCount} baru</span>}
                </div>
                {notificationCount > 0 ? (
                  <>
                    <div className="notification-list">
                      {pendingUsers.slice(0, 4).map((pendingUser) => (
                        <Link
                          className="notification-item"
                          to="/dashboard?tab=monitoring"
                          key={pendingUser.id}
                          onClick={() => setNotificationsOpen(false)}
                        >
                          <span className="notification-item-icon"><Users size={15} /></span>
                          <span>
                            <strong>{pendingUser.full_name}</strong>
                            <small>Menunggu persetujuan akun</small>
                          </span>
                        </Link>
                      ))}
                    </div>
                    <Link
                      className="notification-footer"
                      to="/dashboard?tab=monitoring"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      Buka Monitoring Pengguna
                    </Link>
                  </>
                ) : (
                  <div className="notification-empty">Tidak ada notifikasi baru.</div>
                )}
              </div>
            )}
            <Link className="user-chip" to="/profile">
              <span className="avatar">{user.name[0].toUpperCase()}</span>
              <span>{user.name}</span>
              <ChevronDown size={15} />
            </Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;