import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => readStorage("portal_user", null));
  const [favorites, setFavorites] = useState(() => readStorage("portal_favorites", []));
  const [recent, setRecent] = useState(() => readStorage("portal_recent_apps", []));
  const [theme, setTheme] = useState(() => localStorage.getItem("portal_theme") || "light");
  
  const [apps, setApps] = useState([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [appsError, setAppsError] = useState("");

  const persist = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  
  const login = async (email, password) => {
    try {
      // Panggil endpoint Express MySQL
      const res = await api.post('/auth/login', { email, password });
      const { user: userData, token } = res.data;
      
      // Petakan sesuai response backend MySQL
      const nextUser = { 
        id: userData.id,
        name: userData.full_name || email.split("@")[0],
        email: userData.email,
        role: userData.role,
        status: userData.status
      };
      
      // Simpan JWT Token dan User
      localStorage.setItem('portal_token', token);
      setUser(nextUser);
      persist("portal_user", nextUser);
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || "Gagal masuk. Periksa kembali koneksi atau akun Anda." 
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_e) {} // ignore error on logout
    setUser(null);
    localStorage.removeItem("portal_user");
    localStorage.removeItem("portal_token");
    setApps([]);
  };

  useEffect(() => {
    if (!user) return undefined;

    let idleTimer;
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    const resetIdleTimer = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        logout();
      }, IDLE_TIMEOUT_MS);
    };

    resetIdleTimer();
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });

    return () => {
      window.clearTimeout(idleTimer);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
    };
  }, [user]);

  const refreshApps = async () => {
    if (user) {
      try {
        const res = await api.get('/api/apps');
        setApps(res.data.applications || []);
      } catch (err) {
        if (err.response?.status === 401) logout();
        else setAppsError("Gagal memuat aplikasi.");
      }
    }
  };

  useEffect(() => {
    if (user) {
      setIsLoadingApps(true);
      setAppsError("");
      api.get('/api/apps')
        .then(res => setApps(res.data.applications || []))
        .catch(err => {
          if (err.response?.status === 401) logout();
          else setAppsError("Gagal memuat aplikasi.");
        })
        .finally(() => setIsLoadingApps(false));
    }
  }, [user]);

  const toggleFavorite = (id) => {
    const next = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];
    setFavorites(next);
    persist("portal_favorites", next);
  };

  const addRecent = (id) => {
    const next = [id, ...recent.filter((item) => item !== id)].slice(0, 4);
    setRecent(next);
    persist("portal_recent_apps", next);
  };

  const changeTheme = (next) => {
    setTheme(next);
    localStorage.setItem("portal_theme", next);
  };

  const updateUser = (userData) => {
    const nextUser = {
      ...user,
      name: userData.full_name || userData.name || user.name,
      email: userData.email || user.email,
      role: userData.role || user.role,
      status: userData.status || user.status,
    };
    setUser(nextUser);
    persist("portal_user", nextUser);
  };

  return (
    <AppContext.Provider
      value={{
        user, favorites, recent, theme, apps, isLoadingApps, appsError,
        login, logout, toggleFavorite, addRecent, changeTheme, refreshApps, updateUser
      }}
    >
      {children}
    </AppContext.Provider>
  );
}