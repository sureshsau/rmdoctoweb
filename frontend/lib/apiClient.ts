import axios from "axios";

function getBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    // Client-only app: fail fast so env issues are obvious.
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return baseUrl;
}

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    // @ts-expect-error axios header typing varies
    config.headers.Authorization = `Bearer ${token}`;
  }


  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      // Prevent infinite loop if already on login
      if (!window.location.pathname.startsWith("/auth/login")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

