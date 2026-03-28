import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../store/auth";
import { Input, Button, Tag, Empty, Tooltip, Spin, Switch, message } from "antd";
import {
    LockOutlined,
    UnlockOutlined,
    SearchOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import http from "../api/http";

function normalizeRoom(room) {
    return {
        ...room,
        id: room?.id ?? room?._id,
        name: room?.name ?? "Untitled Room",
        isPrivate: room?.isPrivate ?? room?.is_private ?? room?.private ?? false,
        isMember: room?.isMember ?? room?.member ?? room?.is_member ?? false,
        isAdmin: room?.isAdmin ?? room?.admin ?? false,
        invitePending: room?.invitePending ?? room?.invite_pending ?? false,
        inviteId: room?.inviteId ?? room?.invite_id ?? null,
        adminIds: room?.adminIds ?? room?.admin_ids ?? [],
        createdAt: room?.createdAt ?? room?.created_at ?? null,
    };
}

function getRoomInitial(name = "") {
    return name.trim().charAt(0).toUpperCase() || "?";
}

export default function RoomList({
    onOpen,
    onRequestJoin,
    onCreateRoom,
    onShowInvites,
    reloadKey = 0,
    selectedId,
    privateOnly = false,
}) {
    const [rooms, setRooms] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [privateFilter, setPrivateFilter] = useState(privateOnly);

    const user = useAuth((s) => s.user);
    const token = useAuth((s) => s.token);
    const currentUserId = user?.id || user?._id || null;

    const fetchRooms = async (query = "") => {
        try {
            setLoading(true);
            const { data } = await http.get("/api/rooms/search", {
                params: { query: query?.trim() || "" },
            });

            const normalized = (data || []).map(normalizeRoom);
            const sorted = normalized.sort((a, b) => {
                const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return db - da;
            });

            setRooms(sorted);
        } catch (err) {
            console.error("Failed to fetch rooms", err);
        } finally {
            setLoading(false);
        }
    };

    const acceptInvite = async (room) => {
        if (!room?.inviteId) return;

        try {
            await http.post(`/api/invites/${room.inviteId}/accept`);
            message.success(`Joined ${room.name}`);
            fetchRooms(q);
        } catch (err) {
            message.error(err?.response?.data?.message || "Failed to accept invite");
        }
    };

    useEffect(() => {
        fetchRooms("");
    }, []);

    useEffect(() => {
        fetchRooms(q);
    }, [reloadKey]);

    useEffect(() => {
        const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8092";

        const c = new Client({
            webSocketFactory: () => new SockJS(`${base}/ws`),
            reconnectDelay: 2000,
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
            onConnect: () => {
                c.subscribe("/user/queue/invites", (msg) => {
                    const payload = JSON.parse(msg.body);

                    if (payload?.type === "ROOM_INVITE_RECEIVED") {
                        message.info(`Invited to ${payload.roomName}`);
                        fetchRooms(q);
                    }
                });
            },
        });

        c.activate();

        return () => {
            c.deactivate();
        };
    }, [token, q]);

    const filteredRooms = useMemo(() => {
        let list = rooms;

        if (q.trim()) {
            const query = q.toLowerCase();
            list = list.filter((r) => r.name.toLowerCase().includes(query));
        }

        if (privateFilter) {
            list = list.filter((r) => r.isPrivate);
        }

        return list;
    }, [rooms, q, privateFilter]);

    if (collapsed) {
        return (
            <aside className="room-sidebar collapsed">
                <div className="room-sidebar-header collapsed-header">
                    <Button
                        className="room-collapse-btn"
                        shape="circle"
                        icon={<MenuUnfoldOutlined />}
                        onClick={() => setCollapsed(false)}
                    />
                </div>

                <div className="room-collapsed-list">
                    {filteredRooms.length ? (
                        filteredRooms.map((r) => {
                            const isSelected = r.id === selectedId;
                            const derivedAdmin = !!(currentUserId && r.adminIds?.includes(currentUserId));
                            const canOpen = !!r.isMember || !!r.isAdmin || derivedAdmin;
                            const showAccept = !!r.invitePending && !canOpen;
                            const canRequestJoin = !r.isPrivate && !canOpen && !showAccept;

                            return (
                                <Tooltip
                                    key={r.id}
                                    title={
                                        showAccept
                                            ? `${r.name} (Invited)`
                                            : canOpen
                                                ? `${r.name} (Open)`
                                                : canRequestJoin
                                                    ? `${r.name} (Join)`
                                                    : `${r.name} (Private)`
                                    }
                                    placement="right"
                                >
                                    <button
                                        type="button"
                                        className={`room-collapsed-item ${isSelected ? "selected" : ""}`}
                                        onClick={() => {
                                            if (canOpen) {
                                                onOpen?.(r);
                                            } else if (showAccept) {
                                                acceptInvite(r);
                                            } else if (canRequestJoin) {
                                                onRequestJoin?.(r);
                                            }
                                        }}
                                    >
                                        {getRoomInitial(r.name)}
                                    </button>
                                </Tooltip>
                            );
                        })
                    ) : (
                        <div className="room-collapsed-empty">
                            <span>Ø</span>
                        </div>
                    )}
                </div>
            </aside>
        );
    }

    return (
        <aside className="room-sidebar">
            <div className="room-sidebar-header">
                <div className="room-sidebar-heading">
                    <h3>Rooms</h3>
                    <p>Browse and open conversations</p>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <Button
                        id="aurora-tour-create-room"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={onCreateRoom}
                    >
                        Create
                    </Button>

                    <Button
                        className="room-collapse-btn"
                        shape="circle"
                        icon={<MenuFoldOutlined />}
                        onClick={() => setCollapsed(true)}
                    />
                </div>
            </div>

            <div className="room-sidebar-toolbar">
                <div className="room-sidebar-filter">
                    <span className="room-sidebar-filter-label">Private</span>
                    <Switch checked={privateFilter} onChange={setPrivateFilter} />
                </div>
            </div>

            <div className="room-search-wrap">
                <Input
                    allowClear
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    prefix={<SearchOutlined />}
                    placeholder="Search rooms"
                    className="room-search"
                />
            </div>

            <div className="room-list-scroll">
                {loading ? (
                    <div className="room-loading">
                        <Spin />
                    </div>
                ) : filteredRooms.length ? (
                    filteredRooms.map((r) => {
                        const isSelected = r.id === selectedId;
                        const derivedAdmin = !!(currentUserId && r.adminIds?.includes(currentUserId));
                        const canOpen = !!r.isMember || !!r.isAdmin || derivedAdmin;
                        const showAccept = !!r.invitePending && !canOpen;
                        const canRequestJoin = !r.isPrivate && !canOpen && !showAccept;

                        return (
                            <div
                                key={r.id}
                                className={`room-nav-item ${isSelected ? "selected" : ""}`}
                                onClick={() => {
                                    if (canOpen) {
                                        onOpen?.(r);
                                    } else if (showAccept) {
                                        acceptInvite(r);
                                    } else if (canRequestJoin) {
                                        onRequestJoin?.(r);
                                    }
                                }}
                            >
                                <div className="room-nav-main">
                                    <div className="room-name" title={r.name}>
                                        {r.name}
                                    </div>

                                    <div className="room-tags">
                                        {r.isPrivate ? (
                                            <Tag className="room-tag private" icon={<LockOutlined />}>
                                                Private
                                            </Tag>
                                        ) : (
                                            <Tag className="room-tag public" icon={<UnlockOutlined />}>
                                                Public
                                            </Tag>
                                        )}

                                        {showAccept ? <Tag color="gold">Invited</Tag> : null}
                                    </div>
                                </div>

                                <div className="room-nav-action">
                                    {showAccept ? (
                                        <Button
                                            type="primary"
                                            size="small"
                                            className="room-action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                acceptInvite(r);
                                            }}
                                        >
                                            Accept
                                        </Button>
                                    ) : canOpen ? (
                                        <Button
                                            type={isSelected ? "primary" : "default"}
                                            size="small"
                                            className="room-action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpen?.(r);
                                            }}
                                        >
                                            Open
                                        </Button>
                                    ) : canRequestJoin ? (
                                        <Button
                                            size="small"
                                            className="room-action-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRequestJoin?.(r);
                                            }}
                                        >
                                            Join
                                        </Button>
                                    ) : (
                                        <Button
                                            size="small"
                                            className="room-action-btn"
                                            disabled
                                        >
                                            Private
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <Empty description="No rooms found" />
                )}
            </div>
        </aside>
    );
}