import { Modal, Button, Typography, Space, Avatar, message } from "antd";
import { LockOutlined, TeamOutlined, CrownOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import http from "../api/http";

export default function JoinRoomModal({ open, onClose, room }) {
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        let ignore = false;
        (async () => {
            if (!room?.id) return;
            try {
                const { data } = await http.get(`/api/rooms/${room.id}/meta`);
                if (!ignore) setMeta(data);
            } catch { }
        })();
        return () => { ignore = true; };
    }, [room?.id]);
    const admins = room?.admins || meta?.admins || [];
    const memberCount = room?.memberCount ?? meta?.memberCount ?? 0;
    const joinOrRequest = async () => {
        try {
            setLoading(true);
            const { data } = await http.post(`/api/rooms/${room.id}/join-request`);
            if (data?.joined) message.success("Joined"); else message.success("Request sent to admins");
            onClose && onClose(true);
        } finally { setLoading(false); }
    };
    return (
        <Modal open={open} onCancel={() => onClose && onClose()} destroyOnClose wrapClassName="glass-modal" title={room?.name || "Room"} footer={null}>
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
                <Space align="center">
                    {room?.isPrivate ? <LockOutlined /> : <TeamOutlined />}
                    <Typography.Text strong>{room?.isPrivate ? "Private room" : "Public room"}</Typography.Text>
                    <Typography.Text type="secondary">• {memberCount} members</Typography.Text>
                </Space>
                {!!admins.length && (
                    <>
                        <Typography.Text type="secondary">Admins</Typography.Text>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {admins.map(a => (
                                <Space key={a.id} style={{ background: "rgba(255,255,255,.75)", border: "1px solid rgba(15,23,42,.08)", padding: "6px 10px", borderRadius: 12 }}>
                                    <Avatar size="small" icon={<CrownOutlined />} />
                                    <Typography.Text>{a.name}</Typography.Text>
                                </Space>
                            ))}
                        </div>
                    </>
                )}
                <Button type="primary" size="large" onClick={joinOrRequest} loading={loading} block>
                    {room?.isPrivate ? "Send join request" : "Join now"}
                </Button>
            </Space>
        </Modal>
    );
}
