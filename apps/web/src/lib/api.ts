import axios from "axios";
import { useAuthStore } from "../stores/auth-store";

const api = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            "http://localhost:3000/api/v1/auth/refresh",
            {
              refreshToken,
            },
          );

          const { accessToken, refreshToken: newRefreshToken } = data;
          useAuthStore.getState().setAuth({
            ...useAuthStore.getState(),
            accessToken,
            refreshToken: newRefreshToken,
          });

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
