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
      const res = await api.post('/auth/login', { email, password });
      const { user: userData, session } = res.data;
      
      const nextUser = { 
        id: userData.id,
        name: userData.profile?.full_name || email.split("@")[0],
        email: userData.email,
        role: userData.profile?.role
      };
      
      localStorage.setItem('portal_token', session.access_token);
      setUser(nextUser);
      persist("portal_user", nextUser);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || "Gagal masuk." };
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
        .then(res => setApps(res.data.applications))
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

  return (
    <AppContext.Provider
      value={{
        user, favorites, recent, theme, apps, isLoadingApps, appsError,
        login, logout, toggleFavorite, addRecent, changeTheme, refreshApps
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
