import { Modal, Form, Select, Button, Typography, message } from "antd";
import { useState } from "react";
import http from "../api/http";

export default function InviteUsersModal({ open, onClose, roomId }) {
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([]);

    const searchUsers = async (query) => {
        if (!query?.trim()) {
            setOptions([]);
            return;
        }

        try {
            const { data } = await http.get("/api/auth/users/search", {
                params: { query: query.trim() },
            });

            const opts = (data || []).map((u) => ({
                value: u.id,
                label: `${u.name} (${u.email})`,
            }));

            setOptions(opts);
        } catch (err) {
            console.error("Failed to search users", err);
            setOptions([]);
        }
    };

    const onFinish = async ({ user }) => {
        if (!user || !roomId) return;

        try {
            setLoading(true);

            await http.post(`/api/invites/rooms/${roomId}/users/${user}`);

            message.success("Invite sent");
            onClose?.(true);
        } catch (err) {
            message.error(err?.response?.data?.message || "Invite failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={() => onClose?.()}
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