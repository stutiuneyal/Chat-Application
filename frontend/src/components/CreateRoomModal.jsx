import { Modal, Form, Input, Switch, Button, Typography, message } from "antd";
import http from "../api/http";
import { useState } from "react";

function normalizeRoom(room) {
    return {
        ...room,
        isPrivate:
            room?.isPrivate ??
            room?.is_private ??
            room?.private ??
            false,
    };
}

export default function CreateRoomModal({ open, onClose, onCreated }) {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const onFinish = async (values) => {
        try {
            setLoading(true);

            const payload = {
                name: values.name?.trim(),
                isPrivate: !!values.isPrivate,
                permissions: {
                    allowReplies: true,
                    allowDeleteOwn: true,
                    allowUserInvite: true,
                    allowSelfJoinPublic: true,
                },
            };

            const { data } = await http.post("/api/rooms/create", payload);

            const normalized = normalizeRoom(data);

            message.success("Room created successfully");
            onCreated?.(normalized);
            form.resetFields();
            onClose?.();
        } catch (err) {
            console.error("Create room failed", err);
            message.error(err?.response?.data?.message || "Failed to create room");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            destroyOnClose
            footer={null}
            centered
            wrapClassName="glass-modal"
            title="Create a Room"
        >
            <Typography.Paragraph
                style={{ color: "rgba(15,23,42,.72)", marginTop: 8 }}
            >
                Give your room a name and privacy setting.
            </Typography.Paragraph>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ isPrivate: false }}
            >
                <Form.Item
                    name="name"
                    label="Room name"
                    rules={[{ required: true, message: "Name is required" }]}
                >
                    <Input size="large" placeholder="e.g., Product Design" />
                </Form.Item>

                <Form.Item
                    name="isPrivate"
                    label="Private room?"
                    valuePropName="checked"
                    extra="Private rooms require approval to join."
                >
                    <Switch />
                </Form.Item>

                <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    block
                >
                    Create
                </Button>
            </Form>
        </Modal>
    );
}