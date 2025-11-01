import { Drawer, List, Button, Space, Tag, message, Empty } from "antd";
import { useEffect, useState } from "react";
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
        } finally { setLoading(false); }
    };
    useEffect(() => { if (open) load(); }, [open, roomId]);
    const respond = async (reqId, action) => {
        await http.put(`/api/rooms/join-requests/${reqId}`, null, { params: { action } });
        message.success(action === "accept" ? "Approved" : "Denied");
        await load();
        onChanged && onChanged();
    };
    return (
        <Drawer title="Join requests" open={open} onClose={onClose} width={480} className="glass-modal">
            <List
                loading={loading}
                dataSource={reqs}
                locale={{ emptyText: <Empty description="No pending requests" /> }}
                renderItem={(it) => (
                    <List.Item>
                        <Space style={{ justifyContent: "space-between", width: "100%" }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{it.userName || it.userId}</div>
                                <Tag>Requested at {new Date(it.createdAt).toLocaleString()}</Tag>
                            </div>
                            <Space>
                                <Button onClick={() => respond(it.id, "deny")}>Deny</Button>
                                <Button type="primary" onClick={() => respond(it.id, "accept")}>Approve</Button>
                            </Space>
                        </Space>
                    </List.Item>
                )}
            />
        </Drawer>
    );
}
