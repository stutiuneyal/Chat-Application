import { Modal, Button, Typography, Space, Avatar, message } from "antd";
import { LockOutlined, TeamOutlined, CrownOutlined } from "@ant-design/icons";
import { useState } from "react";
import http from "../api/http";

export default function JoinRoomModal({ open, onClose, room }) {
    const [loading, setLoading] = useState(false);

    const admins = room?.admins || [];
    const memberCount = room?.memberCount ?? 0;

    const joinOrRequest = async () => {
        if (!room?.id) return;

        try {
            setLoading(true);
            const { data } = await http.post(`/api/rooms/${room.id}/join-request`);
            if (data?.joined === true) {
                message.success("Joined room");
            } else {
                message.success("Request sent to admins");
            }
            onClose?.(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={() => onClose?.()}
            destroyOnClose
            title={room?.name || "Room"}
            footer={null}
        >
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Typography.Text>
                    {room?.isPrivate ? <LockOutlined /> : <TeamOutlined />}{" "}
                    {room?.isPrivate ? "Private room" : "Public room"} • {memberCount} members
                </Typography.Text>

                {!!admins.length && (
                    <div>
                        <Typography.Text strong>Admins</Typography.Text>
                        <Space wrap style={{ marginTop: 8 }}>
                            {admins.map((a) => (
                                <Space key={a.id || a.email}>
                                    <Avatar icon={<CrownOutlined />} />
                                    <span>{a.name || a.email}</span>
                                </Space>
                            ))}
                        </Space>
                    </div>
                )}

                <Button type="primary" loading={loading} onClick={joinOrRequest}>
                    {room?.isPrivate ? "Send join request" : "Join now"}
                </Button>
            </Space>
        </Modal>
    );
}