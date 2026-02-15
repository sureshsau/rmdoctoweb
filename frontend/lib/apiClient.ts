import axios, { AxiosHeaders } from "axios";

function getBaseUrl() {
  // Prefer DEV in development, PROD in production
  if (process.env.NODE_ENV === "development") {
    const devUrl = process.env.NEXT_PUBLIC_API_URL_DEV;
    if (!devUrl) throw new Error("NEXT_PUBLIC_API_URL_DEV is not set");
    return devUrl;
  } else {
    const prodUrl = process.env.NEXT_PUBLIC_API_URL_PROD;
    if (!prodUrl) throw new Error("NEXT_PUBLIC_API_URL_PROD is not set");
    return prodUrl;
  }
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
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
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

