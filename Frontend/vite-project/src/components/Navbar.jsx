import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ currentTab, setCurrentTab, unreadCount }) {
  const { user, logout, isAdmin, isManager } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-6">
            <span className="text-xl font-bold text-blue-600">
              Task Management
            </span>

            {/* Links */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentTab("tasks")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  currentTab === "tasks"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Tasks & Dashboard
              </button>

              {(isAdmin || isManager) && (
                <button
                  onClick={() => setCurrentTab("teams")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    currentTab === "teams"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Teams
                </button>
              )}

              <button
                onClick={() => setCurrentTab("notifications")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium relative ${
                  currentTab === "notifications"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right text-xs sm:text-sm">
              <span className="font-semibold text-gray-800">{user?.name}</span>
              <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                {user?.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
