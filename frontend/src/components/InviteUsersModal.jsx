import { Modal, Form, Select, Button, Typography, message } from "antd";
import { useState } from "react";
import http from "../api/http";

export default function InviteUsersModal({ open, onClose, roomId }) {
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);
    const searchUsers = async (q) => {
        if (!q) return setOptions([]);
        const { data } = await http.get("/api/users/search", { params: { query } });
        setOptions((data || []).map(u => ({ value: u.id, label: `${u.name} (${u.email})` })));
    };
    const onFinish = async ({ users }) => {
        if (!users?.length) return;
        try {
            setLoading(true);
            await http.post(`/api/rooms/${roomId}/invite`, { userIds: users });
            message.success("Invites sent");
            onClose && onClose();
        } finally { setLoading(false); }
    };
    return (
        <Modal open={open} onCancel={onClose} destroyOnClose wrapClassName="glass-modal" title="Invite users" footer={null}>
            <Typography.Paragraph style={{ color: "rgba(15,23,42,.72)" }}>Search and select people to invite.</Typography.Paragraph>
            <Form layout="vertical" onFinish={onFinish}>
                <Form.Item name="users" label="Users" rules={[{ required: true, message: "Pick at least one user" }]}>
                    <Select mode="multiple" showSearch filterOption={false} onSearch={searchUsers} options={options} size="large" placeholder="Search by name or email" />
                </Form.Item>
                <Button type="primary" htmlType="submit" size="large" loading={loading} block>Send Invites</Button>
            </Form>
        </Modal>
    );
}
