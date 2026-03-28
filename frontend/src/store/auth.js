import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

export const useAuth = create((set) => ({
    token: localStorage.getItem("token") || null,
    user: null,

    setToken: (token) => {
        if (token) {
            let decoded = null;
            try {
                decoded = jwtDecode(token);
            } catch (e) { }
            localStorage.setItem("token", token);
            localStorage.setItem("user",decoded.id);
            localStorage.setItem("username",decoded.name);
        } else {
            localStorage.removeItem("token");
        }

        set({
            token: token || null,
        });
    },

    setUser: (user) => {
        set({
            user: user || null,
        });
    },

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user")
        localStorage.removeItem("username")
        set({
            token: null,
            user: null,
        });
    },
}));