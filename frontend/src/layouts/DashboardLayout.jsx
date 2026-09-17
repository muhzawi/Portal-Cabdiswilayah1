import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Grid2X2, Heart, Home, LogOut, Menu, Search, Settings, Star, Users, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import Logo from "../components/ui/Logo";

function DashboardLayout({ children }) {
  const { user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  if (!user) return <Navigate to="/login" replace />;
  const nav = [
    ["/dashboard", "Dashboard", Home],
    ...(user?.role === "super_user"
      ? [["/dashboard?tab=monitoring", "Monitoring Pengguna", Users]]
      : []),
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
            <button className="icon-button" aria-label="Notifikasi">
              <Bell size={19} />
              <span className="notification-dot" />
            </button>
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