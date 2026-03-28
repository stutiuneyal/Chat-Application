import { Drawer, List, Button, message, Empty, Typography, Avatar, Tag, Spin } from "antd";
import { useEffect, useState } from "react";
import { UserOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import http from "../api/http";

export default function JoinRequestsDrawer({ open, onClose, roomId, onChanged }) {
    const [loading, setLoading] = useState(false);
    const [reqs, setReqs] = useState([]);

    const load = async () => {
        if (!roomId) return;
        setLoading(true);
        try {
            const { data } = await http.get(`/api/rooms/${roomId}/join-requests/list/PENDING`);
            setReqs(data || []);
        } catch (err) {
            message.error(err?.response?.data?.message || "Failed to load join requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) load();
    }, [open, roomId]);

    const respond = async (reqId, action) => {
        try {
            await http.put(`/api/rooms/join-requests/${reqId}`, null, { params: { action } });
            message.success(action === "accept" ? "Request approved" : "Request rejected");
            await load();
            onChanged?.();
        } catch (err) {
            message.error(err?.response?.data?.message || "Failed to update request");
        }
    };

    return (
        <Drawer
            title="Join Requests"
            open={open}
            onClose={onClose}
            width={460}
            styles={{
                body: {
                    padding: 16,
                    background: "linear-gradient(180deg, #f8fbff 0%, #f3f7ff 100%)",
                },
            }}
        >
            <div style={{ marginBottom: 14 }}>
                <Typography.Text type="secondary">
                    Review pending access requests for this room.
                </Typography.Text>
            </div>

            {loading ? (
                <div style={{ display: "grid", placeItems: "center", padding: "40px 0" }}>
                    <Spin />
                </div>
            ) : reqs.length === 0 ? (
                <div
                    style={{
                        borderRadius: 20,
                        background: "#fff",
                        padding: 24,
                        border: "1px solid rgba(140,160,232,0.14)",
                    }}
                >
                    <Empty description="No pending requests" />
                </div>
            ) : (
                <List
                    dataSource={reqs}
                    split={false}
                    renderItem={(it) => {
                        const userName = it.userName || it.raisedbyUserName || it.userId || "Unknown user";
                        const createdAt = it.createdAt || it.raisedAt;

                        return (
                            <List.Item style={{ padding: 0, marginBottom: 12 }}>
                                <div
                                    style={{
                                        width: "100%",
                                        borderRadius: 18,
                                        background: "#fff",
                                        border: "1px solid rgba(164,179,245,0.18)",
                                        boxShadow: "0 8px 24px rgba(76, 98, 160, 0.06)",
                                        padding: 14,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 14,
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                                        <Avatar icon={<UserOutlined />} />
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, color: "#172033" }}>
                                                {userName}
                                            </div>
                                            <div style={{ marginTop: 4 }}>
                                                <Tag icon={<ClockCircleOutlined />} color="blue">
                                                    Requested {createdAt ? new Date(createdAt).toLocaleString() : "-"}
                                                </Tag>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                        <Button
                                            icon={<CloseOutlined />}
                                            onClick={() => respond(it.id, "rejected")}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            type="primary"
                                            icon={<CheckOutlined />}
                                            onClick={() => respond(it.id, "accept")}
                                        >
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            </List.Item>
                        );
                    }}
                />
            )}
        </Drawer>
    );
}