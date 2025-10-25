import axios from "axios";
import { useAuth } from "../store/auth";

const http = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8092"
})

http.interceptors.request.use((config) => {
    const token = useAuth.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config;
})

http.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        const cfg = err?.config || {};
        const url = (cfg.url || "").toString();

        // Did we actually send a token on this request?
        const hadAuthHeader = !!cfg.headers?.Authorization;

        // Don’t auto-logout for auth endpoints or requests without a token
        const isAuthEndpoint = url.startsWith("/api/auth/");

        if (status === 421 && hadAuthHeader && !isAuthEndpoint) {
            useAuth.getState().logout();
            message.error("Session expired. Please login again.");
        } else if (status === 429) {
            message.error("Too many requests. Slow down a bit.");
        } else if (status && status >= 400) {
            const msg = err?.response?.data?.error || err.message || "Request failed";
            message.error(msg);
        }

        return Promise.reject(err);
    }
)

export default http;