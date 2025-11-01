import { Drawer, List, Button, Space, Tag, message, Empty } from "antd";
import { useEffect, useState } from "react";
import http from "../api/http";

export default function MyInvitesDrawer({ open, onClose, onChanged }) {
    const [loading, setLoading] = useState(false);
    const [invites, setInvites] = useState([]);
    const load = async () => {
        setLoading(true);
        try {
            const { data } = await http.get("/api/rooms/invites/list/PENDING");
            setInvites(data || []);
        } finally { setLoading(false); }
    };
    useEffect(() => { if (open) load(); }, [open]);
    const respond = async (id, action) => {
        await http.put(`/api/rooms/invites/${id}`, null, { params: { action } });
        message.success(action === "accept" ? "Joined" : "Declined");
        await load();
        onChanged && onChanged();
    };
    return (
        <Drawer title="Your invites" open={open} onClose={onClose} width={420} className="glass-modal">
            <List
                loading={loading}
                dataSource={invites}
                locale={{ emptyText: <Empty description="No pending invites" /> }}
                renderItem={(it) => (
                    <List.Item>
                        <Space style={{ justifyContent: "space-between", width: "100%" }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{it.roomName || it.roomId}</div>
                                <Tag color="blue">Invited by {it.invitedByName || it.invitedBy}</Tag>
                            </div>
                            <Space>
                                <Button onClick={() => respond(it.id, "decline")}>Decline</Button>
                                <Button type="primary" onClick={() => respond(it.id, "accept")}>Accept</Button>
                            </Space>
                        </Space>
                    </List.Item>
                )}
            />
        </Drawer>
    );
}
