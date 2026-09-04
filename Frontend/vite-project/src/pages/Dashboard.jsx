import React from "react";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import ManagerDashboard from "./ManagerDashboard";
import UserDashboard from "./UserDashboard";

export default function Dashboard({ teams = [], users = [], onTaskUpdated }) {
  const { user } = useAuth();

  if (user?.role === "Admin") {
    return (
      <AdminDashboard
        teams={teams}
        users={users}
        onTaskUpdated={onTaskUpdated}
      />
    );
  }

  if (user?.role === "Manager") {
    return (
      <ManagerDashboard
        teams={teams}
        users={users}
        onTaskUpdated={onTaskUpdated}
      />
    );
  }

  return <UserDashboard onTaskUpdated={onTaskUpdated} />;
}
