import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Register from "./pages/Register";
import api from "./api/axios";
import "./App.css";

function AppContent() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [currentTab, setCurrentTab] = useState("tasks"); // "tasks" | "teams" | "notifications"

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load teams and users
  const loadGlobalData = async () => {
    if (!user) return;
    try {
      const [teamsRes, usersRes, notifRes] = await Promise.all([
        api.get("/api/get-teams").catch(() => ({ data: [] })),
        api.get("/api/auth/users").catch(() => ({ data: [] })),
        api.get("/api/notifications/unread-count").catch(() => ({ data: { unreadCount: 0 } })),
      ]);
      setTeams(teamsRes.data);
      setUsers(usersRes.data);
      setUnreadCount(notifRes.data?.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load global data", err);
    }
  };

  useEffect(() => {
    if (user) {
      loadGlobalData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
        Loading...
      </div>
    );
  }

  // If not logged in, show Login or Register
  if (!user) {
    return authMode === "login" ? (
      <Login onSwitchToRegister={() => setAuthMode("register")} />
    ) : (
      <Register onSwitchToLogin={() => setAuthMode("login")} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-900">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        unreadCount={unreadCount}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {currentTab === "tasks" && (
          <Dashboard
            teams={teams}
            users={users}
            onTaskUpdated={loadGlobalData}
          />
        )}

        {currentTab === "teams" && (
          <Teams
            teams={teams}
            users={users}
            onRefreshData={loadGlobalData}
          />
        )}

        {currentTab === "notifications" && (
          <Notifications onNotificationsChanged={loadGlobalData} />
        )}
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        Task Management System — Assessment Project
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}