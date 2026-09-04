import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function ManagerDashboard({ teams = [], users = [], onTaskUpdated }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ totalTasks: 0, todoCount: 0, inProgressCount: 0, doneCount: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [search, setSearch] = useState("");

  // Create Task Form toggle
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "To Do",
    deadline: "",
    teamId: "",
    assignedTo: "",
  });

  // Comments
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const loadManagerTasks = async () => {
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
      console.error("Failed to load manager tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagerTasks();
  }, [statusFilter, priorityFilter, deadlineFilter, search]);

  // Manager Capability: Create and assign tasks to team members
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      await api.post("/api/add-task", {
        title: newTask.title.trim(),
        description: newTask.description?.trim(),
        priority: newTask.priority,
        status: newTask.status,
        deadline: newTask.deadline || null,
        teamId: newTask.teamId ? parseInt(newTask.teamId) : null,
        assignedTo: newTask.assignedTo ? parseInt(newTask.assignedTo) : null,
      });

      setNewTask({
        title: "",
        description: "",
        priority: "Medium",
        status: "To Do",
        deadline: "",
        teamId: "",
        assignedTo: "",
      });
      setShowAddForm(false);
      loadManagerTasks();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert("Failed to create task: " + (err.response?.data?.message || err.message));
    }
  };

  // Status Change
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

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/api/delete-task/${taskId}`);
      loadManagerTasks();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      alert("Failed to delete task: " + (err.response?.data?.message || err.message));
    }
  };

  // Comments
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

  // Team members list for selected team
  const selectedTeamMembers = newTask.teamId
    ? teams.find((t) => t.id === parseInt(newTask.teamId))?.members || []
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Manager Dashboard — Team Task Workspace
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Welcome {user?.name}. Create tasks, assign them to your team members, track progress, and manage teams.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {showAddForm ? "Close Form" : "+ Create & Assign Task"}
        </button>
      </div>

      {/* Task Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Team Tasks Total</p>
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

      {/* Manager Task Creation Form */}
      {showAddForm && (
        <form onSubmit={handleCreateTask} className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-800 border-b pb-2">
            Create Task for Team Member
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Task Title *</label>
              <input
                type="text"
                required
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g. Implement User Authentication"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Task instructions and expectations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Select Team *</label>
              <select
                required
                value={newTask.teamId}
                onChange={(e) => setNewTask({ ...newTask, teamId: e.target.value, assignedTo: "" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Team --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Assign to Team Member
              </label>
              <select
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Member --</option>
                {newTask.teamId ? (
                  selectedTeamMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.userName} ({m.userRole})
                    </option>
                  ))
                ) : (
                  users.filter((u) => u.role !== "Admin").map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
            >
              Create & Assign Task
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search team tasks..."
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

      {/* Team Tasks List */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading team tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl border border-gray-200 text-gray-500 text-sm">
          No team tasks found. Click "+ Create & Assign Task" to assign one to a member.
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

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 font-medium">Status:</label>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="px-2.5 py-1 border border-gray-300 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-gray-600 whitespace-pre-line">{task.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>Assigned To: <strong>{task.assignedToName || "Unassigned"}</strong></span>
                <span>Due Date: <strong>{task.deadline || "None"}</strong></span>
                <span>Created By: <strong>{task.createdByName}</strong></span>

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
                    Task Discussion
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
