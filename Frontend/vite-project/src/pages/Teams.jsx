import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Teams({ teams = [], users = [], onRefreshData }) {
  const { isAdmin } = useAuth();
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedUserByTeam, setSelectedUserByTeam] = useState({});

  // Create new team
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      await api.post("/api/add-team", { name: newTeamName.trim() });
      setNewTeamName("");
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to create team: " + (err.response?.data?.message || err.message));
    }
  };

  // Add member to team
  const handleAddMember = async (teamId) => {
    const userId = selectedUserByTeam[teamId];
    if (!userId) {
      alert("Please select a user to add.");
      return;
    }

    try {
      await api.post("/api/add-team-member", {
        teamId: teamId,
        userId: parseInt(userId),
      });
      setSelectedUserByTeam((prev) => ({ ...prev, [teamId]: "" }));
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to add member: " + (err.response?.data?.message || err.message));
    }
  };

  // Remove member from team
  const handleRemoveMember = async (teamId, userId) => {
    if (!confirm("Remove this member from the team?")) return;
    try {
      await api.delete(`/api/team-members/${teamId}/${userId}`);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to remove member: " + (err.response?.data?.message || err.message));
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await api.delete(`/api/delete-team/${teamId}`);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert("Failed to delete team: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Team Form */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Team Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Organize users into teams and assign tasks.
          </p>
        </div>

        {/* Inline Create Team Form */}
        <form onSubmit={handleCreateTeam} className="flex gap-2">
          <input
            type="text"
            required
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="New Team Name..."
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            + Add Team
          </button>
        </form>
      </div>

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl border border-gray-200 text-gray-500 text-sm">
          No teams found. Use the form above to add a team.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4"
            >
              {/* Team Title */}
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="font-bold text-base text-gray-900">{team.name}</h3>
                  <p className="text-xs text-gray-400">
                    {team.members?.length || 0} members • {team.taskCount || 0} tasks
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Delete Team
                  </button>
                )}
              </div>

              {/* Members List */}
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-2">Members:</h4>
                {!team.members || team.members.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No members in this team yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {team.members.map((m) => (
                      <div
                        key={m.id || m.userId}
                        className="flex items-center justify-between p-2 rounded bg-gray-50 text-xs border border-gray-100"
                      >
                        <div>
                          <span className="font-semibold text-gray-800">{m.userName}</span>
                          <span className="ml-1.5 text-gray-400">({m.userRole})</span>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(team.id, m.userId)}
                          className="text-red-500 hover:text-red-700 text-xs ml-2 font-medium"
                          title="Remove user from team"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Member Dropdown */}
              <div className="pt-2 border-t border-gray-100 flex gap-2">
                <select
                  value={selectedUserByTeam[team.id] || ""}
                  onChange={(e) =>
                    setSelectedUserByTeam({
                      ...selectedUserByTeam,
                      [team.id]: e.target.value,
                    })
                  }
                  className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Add User to Team --</option>
                  {users
                    .filter((u) => !team.members?.some((m) => m.userId === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddMember(team.id)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded text-xs font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
