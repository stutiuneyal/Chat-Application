import { Modal, Form, Select, Button, Typography, message } from "antd";
import { useState } from "react";
import http from "../api/http";

export default function InviteUsersModal({ open, onClose, roomId }) {
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);
    const [emailMap, setEmailMap] = useState({});

    const searchUsers = async (query) => {
        if (!query) {
            setOptions([]);
            return;
        }
        try {
            const { data } = await http.get("/api/auth/users/search", { params: { query } });
            const mapped = {};
            const opts = (data || []).map(u => {
                mapped[u.id] = u.email;
                return { value: u.id, label: `${u.name} (${u.email})` };
            });
            setEmailMap(mapped);
            setOptions(opts);
        } catch {
            setOptions([]);
        }
    };

    const onFinish = async ({ user }) => {
        if (!user) return;
        const email = emailMap[user];
        if (!email) {
            message.error("Invalid user selection");
            return;
        }
        try {
            setLoading(true);
            await http.post(`/api/rooms/${roomId}/invite`, { email });
            message.success("Invite sent");
            onClose && onClose();
        } catch {
            message.error("Invite failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            destroyOnClose
            wrapClassName="glass-modal"
            title="Invite user"
            footer={null}
        >
            <Typography.Paragraph style={{ color: "rgba(15,23,42,.72)" }}>
                Search and pick a user to invite.
            </Typography.Paragraph>
            <Form layout="vertical" onFinish={onFinish}>
                <Form.Item
                    name="user"
                    label="User"
                    rules={[{ required: true, message: "Select a user" }]}
                >
                    <Select
                        showSearch
                        filterOption={false}
                        onSearch={searchUsers}
                        options={options}
                        size="large"
                        placeholder="Type a name or email"
                        popupClassName="glass-select"
                    />
                </Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    block
                >
                    Send Invite
                </Button>
            </Form>
        </Modal>
    );
}
