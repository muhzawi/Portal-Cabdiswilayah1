import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import "./App.css";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SchoolVerify from "./pages/SchoolVerify";
import SchoolPasswordChange from "./pages/SchoolPasswordChange";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import ApplicationDetail from "./pages/ApplicationDetail";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import SettingsPage from "./pages/SettingsPage";
import ActivityLogs from "./pages/ActivityLogs";
import SchoolTasks from "./pages/SchoolTasks";
import DashboardLayout from "./layouts/DashboardLayout";

function ProtectedApp() {
  const { user } = useApp();
  const location = useLocation();
  const isSchoolPasswordChangePath = location.pathname === "/school/change-password";
  if (user?.type === "school" && user.passwordChangeRequired) {
    return isSchoolPasswordChangePath
      ? <div className="app"><SchoolPasswordChange /></div>
      : <Navigate to="/school/change-password" replace />;
  }
  if (user?.type === "school" && !user.passwordChangeRequired && isSchoolPasswordChangePath) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app">
      <DashboardLayout>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/apps" element={<Applications />} />
          <Route path="/apps/:id" element={<ApplicationDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/activity-logs" element={<ActivityLogs />} />
          <Route path="/tasks" element={<SchoolTasks />} />
          <Route path="/tasks/:id" element={<SchoolTasks />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/school/verify" element={<SchoolVerify />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
