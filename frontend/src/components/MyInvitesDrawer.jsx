import { Drawer, List, Button, Space, message, Empty, Typography } from "antd";
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) load();
    }, [open]);

    const respond = async (id, action) => {
        await http.put(`/api/rooms/invites/${id}`, null, { params: { action } });
        message.success(action === "accept" ? "Joined room" : "Invite rejected");
        await load();
        onChanged?.();
    };

    return (
        <Drawer title="My invites" open={open} onClose={onClose} width={420}>
            {invites.length === 0 ? (
                <Empty description="No pending invites" />
            ) : (
                <List
                    loading={loading}
                    dataSource={invites}
                    renderItem={(it) => (
                        <List.Item
                            actions={[
                                <Button key="reject" onClick={() => respond(it.id, "reject")}>
                                    Reject
                                </Button>,
                                <Button key="accept" type="primary" onClick={() => respond(it.id, "accept")}>
                                    Accept
                                </Button>,
                            ]}
                        >
                            <List.Item.Meta
                                title={it.roomName || it.roomId}
                                description={
                                    <Space direction="vertical" size={2}>
                                        <Typography.Text type="secondary">
                                            Invited by {it.invitedByName || it.invitedBy}
                                        </Typography.Text>
                                    </Space>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </Drawer>
    );
}