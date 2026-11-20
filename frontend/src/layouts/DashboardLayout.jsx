import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  GraduationCap,
  Grid2X2,
  Heart,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  Star,
  Users,
  X,
  ClipboardList,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Logo from "../components/ui/Logo";
import api from "../api";

function DashboardLayout({ children }) {
  const { user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [pendingTaskCount, setPendingTaskCount] = useState(0);
  const isSchool = user?.type === "school";
  const isSuperUser = ["super_user", "superadmin"].includes(user?.role);
  const nav = [
    ["/dashboard", "Dashboard", Home],
    ...(isSuperUser
      ? [
          ["/dashboard?tab=monitoring", "Monitoring Pengguna", Users],
          ["/dashboard?tab=schools", "Akun Sekolah", GraduationCap],
          ["/tasks", "Kelola Tugas", ClipboardList],
        ]
      : []),
    ...(isSchool ? [["/tasks", "Notifikasi Tugas", Bell]] : []),
    ["/apps", "Aplikasi", Grid2X2],
    ["/apps?filter=favorite", "Favorit", Heart],
    ["/apps?filter=recent", "Baru Dibuka", Star],
  ];

  useEffect(() => {
    if (!isSchool) {
      return undefined;
    }

    let active = true;
    api.get("/api/school-tasks")
      .then((response) => {
        if (active) setPendingTaskCount(response.data.pendingCount || 0);
      })
      .catch((error) => {
        console.error("Gagal memuat jumlah notifikasi tugas:", error);
      });
    return () => {
      active = false;
    };
  }, [isSchool, location.pathname]);

  if (!user) return <Navigate to="/login" replace />;

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
                path === "/tasks"
                  ? location.pathname.startsWith("/tasks") ? "active" : ""
                  : location.pathname + location.search === path ? "active" : ""
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
            {isSchool && (
              <Link
                className="icon-button notification-button"
                to="/tasks"
                aria-label={`Notifikasi tugas, ${pendingTaskCount} belum selesai`}
                title="Notifikasi tugas"
              >
                <Bell size={19} />
                {pendingTaskCount > 0 && (
                  <span className="notification-badge">
                    {pendingTaskCount > 99 ? "99+" : pendingTaskCount}
                  </span>
                )}
              </Link>
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
