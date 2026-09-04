import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function UserDashboard({ onTaskUpdated }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ totalTasks: 0, todoCount: 0, inProgressCount: 0, doneCount: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [search, setSearch] = useState("");

  // Comments
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const loadUserTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (deadlineFilter) params.deadline = deadlineFilter;
      if (search) params.search = search;

      const [tasksRes, statsRes] = await Promise.all([
        api.get("/api/get-tasks", { params }),
        api.get("/api/dashboard/stats"),
      ]);

      setTasks(tasksRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load user tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserTasks();
  }, [statusFilter, priorityFilter, deadlineFilter, search]);

  // User Capability: Update status of assigned task (To Do, In Progress, Done)
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.post(`/api/update-task-status/${taskId}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      const statsRes = await api.get("/api/dashboard/stats");
      setStats(statsRes.data);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  // User Capability: Comments for task collaboration
  const toggleComments = async (taskId) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
      setComments([]);
      return;
    }
    try {
      setExpandedTaskId(taskId);
      setLoadingComments(true);
      const res = await api.get(`/api/get-comments/${taskId}`);
      setComments(res.data);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (taskId, e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await api.post("/api/add-comment", {
        taskId: taskId,
        commentText: commentText.trim(),
      });
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
    } catch (err) {
      alert("Failed to add comment: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
        <h1 className="text-xl font-bold text-gray-800">
          User Dashboard — My Assigned Tasks
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Welcome {user?.name}. Here are the tasks assigned to you. You can update their progress and collaborate via comments.
        </p>
      </div>

      {/* Task Status Overview Per User */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">My Total Tasks</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">To Do</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">{stats.todoCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-blue-600 font-medium">In Progress</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats.inProgressCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-green-600 font-medium">Done</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{stats.doneCount}</p>
        </div>
      </div>

      {/* Filters: Deadline, Status, Priority */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search my tasks..."
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={deadlineFilter}
          onChange={(e) => setDeadlineFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Deadlines</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due Today</option>
          <option value="upcoming">Upcoming</option>
        </select>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading your tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl border border-gray-200 text-gray-500 text-sm">
          No tasks assigned to you matching the filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-base text-gray-900">{task.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      task.priority === "High"
                        ? "bg-red-100 text-red-700"
                        : task.priority === "Medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {task.priority}
                  </span>
                  {task.teamName && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {task.teamName}
                    </span>
                  )}
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 font-medium">Update Status:</label>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="px-2.5 py-1 border border-gray-300 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-gray-600 whitespace-pre-line">{task.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>Due Date: <strong>{task.deadline || "None"}</strong></span>
                <span>Assigned By: <strong>{task.createdByName}</strong></span>

                <button
                  type="button"
                  onClick={() => toggleComments(task.id)}
                  className="text-blue-600 hover:underline font-semibold ml-auto"
                >
                  {expandedTaskId === task.id ? "Hide Comments" : `Comments (${task.commentCount || 0})`}
                </button>
              </div>

              {/* Comments Section */}
              {expandedTaskId === task.id && (
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-3 bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Task Collaboration & Comments
                  </h4>

                  {loadingComments ? (
                    <p className="text-xs text-gray-400">Loading comments...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No comments yet. Write one below!</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {comments.map((c) => (
                        <div key={c.id} className="p-2.5 bg-white rounded border border-gray-200 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-gray-800">
                              {c.userName} ({c.userRole})
                            </span>
                            <span className="text-gray-400 text-[10px]">{c.createdAt}</span>
                          </div>
                          <p className="text-gray-700">{c.commentText}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={(e) => handleAddComment(task.id, e)} className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium disabled:opacity-50"
                    >
                      Post
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
