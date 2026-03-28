import axios from "axios";
import { message } from "antd";
import { useAuth } from "../store/auth";

const http = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8092",
});

http.interceptors.request.use((config) => {
    const token = useAuth.getState().token;
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

http.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;

        if (status === 401) {
            useAuth.getState().logout();
            message.error("Session expired. Please log in again.");
        }

        return Promise.reject(err);
    }
);

export default http;