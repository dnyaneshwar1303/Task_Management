import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5005";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("taskflow_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: auto-logout on expired session
      localStorage.removeItem("taskflow_token");
      localStorage.removeItem("taskflow_user");
    }
    return Promise.reject(error);
  }
);

export default api;
