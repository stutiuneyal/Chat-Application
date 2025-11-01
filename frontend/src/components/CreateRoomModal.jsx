import { Modal, Form, Input, Switch, Button, Typography } from "antd";
import http from "../api/http";
import { useState } from "react";

export default function CreateRoomModal({ open, onClose, onCreated }) {
    const [loading, setLoading] = useState(false);
    const onFinish = async (v) => {
        try {
            setLoading(true);
            const { data } = await http.post("/api/rooms/create", {
                name: v.name,
                isPrivate: v.isPrivate || false,
                permissions: { allowReplies: true, allowDeleteOwn: true, allowUserInvite: true, allowSelfJoinPublic: true }
            });
            onCreated && onCreated(data);
            onClose && onClose();
        } finally { setLoading(false); }
    };
    return (
        <Modal open={open} onCancel={onClose} destroyOnClose wrapClassName="glass-modal" title="Create a Room" footer={null}>
            <Typography.Paragraph style={{ color: "rgba(15,23,42,.72)", marginTop: 8 }}>Give your room a name and privacy setting.</Typography.Paragraph>
            <Form layout="vertical" onFinish={onFinish}>
                <Form.Item name="name" label="Room name" rules={[{ required: true, message: "Name is required" }]}>
                    <Input size="large" placeholder="e.g., Product Design" />
                </Form.Item>
                <Form.Item name="isPrivate" label="Private room?" valuePropName="checked" extra="Private rooms require approval to join.">
                    <Switch />
                </Form.Item>
                <Button type="primary" htmlType="submit" size="large" loading={loading} block>Create</Button>
            </Form>
        </Modal>
    );
}
