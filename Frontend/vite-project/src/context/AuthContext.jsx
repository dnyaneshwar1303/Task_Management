import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("taskflow_token");
      const storedUser = localStorage.getItem("taskflow_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse stored session", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem("taskflow_token", newToken);
    localStorage.setItem("taskflow_user", JSON.stringify(userData));
    return userData;
  };

  const register = async (name, email, password, role = "User") => {
    const res = await api.post("/api/auth/register", {
      name,
      email,
      password,
      role,
    });
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("taskflow_token");
    localStorage.removeItem("taskflow_user");
  };

  const isAdmin = user?.role === "Admin";
  const isManager = user?.role === "Manager";
  const isUser = user?.role === "User";
  const canManageTasks = isAdmin || isManager;
  const canManageTeams = isAdmin || isManager;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isManager,
        isUser,
        canManageTasks,
        canManageTeams,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
