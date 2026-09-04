import React, { useState, useEffect } from "react";
import api from "../api/axios";

export default function Notifications({ onNotificationsChanged }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/get-notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.post(`/api/mark-read/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (onNotificationsChanged) onNotificationsChanged();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onNotificationsChanged) onNotificationsChanged();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Task Notifications</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Alerts triggered by task assignments and status updates.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center py-8 text-gray-400 text-sm">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                n.isRead
                  ? "bg-gray-50 border-gray-200 text-gray-600"
                  : "bg-blue-50 border-blue-200 text-gray-900 font-medium"
              }`}
            >
              <div>
                <p className="leading-relaxed">{n.message}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="px-1.5 py-0.2 bg-white rounded border border-gray-200 font-semibold">
                    {n.type === "TaskAssigned" ? "Assignment" : "Status Update"}
                  </span>
                  <span>{n.createdAt || "Recently"}</span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-medium hover:bg-blue-700 transition-colors shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
