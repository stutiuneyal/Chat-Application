import { create } from "zustand";

export const useInviteStore = create((set) => ({
    invites: [],
    unreadCount: 0,

    setInvites: (invites) =>
        set({
            invites,
            unreadCount: invites.filter((i) => i.status === "PENDING").length,
        }),

    addInvite: (invite) =>
        set((state) => ({
            invites: [invite, ...state.invites],
            unreadCount: state.unreadCount + 1,
        })),

    removeInvite: (inviteId) =>
        set((state) => ({
            invites: state.invites.filter((i) => i.id !== inviteId && i.inviteId !== inviteId),
            unreadCount: Math.max(0, state.unreadCount - 1),
        })),
}));