import { useState } from "react";
import { Form, Input, Button, Tabs, Typography, message, Card } from "antd";
import { MailOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../store/auth";
import http from "../api/http";

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState("login");
    const setToken = useAuth((s) => s.setToken);

    const onLogin = async (values) => {
        try {
            setLoading(true);
            const { data } = await http.post("/api/auth/login", values);
            if (!data?.token) throw new Error("No token returned");
            setToken(data.token);
            message.success("Welcome back");
        } catch {
            message.error("Login failed");
        } finally {
            setLoading(false);
        }
    };

    const onRegister = async (values) => {
        try {
            setLoading(true);
            const { data } = await http.post("/api/auth/register", values);
            if (!data?.token) {
                message.success("Account created. Please log in.");
                setTab("login");
                return;
            }
            setToken(data.token);
            message.success("Account created");
        } catch {
            message.error("Register failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrap">
            <Card bordered={false} className="auth-card">
                <Typography.Title level={2} className="auth-title">
                    Aurora Chat
                </Typography.Title>

                <Typography.Paragraph
                    style={{
                        marginBottom: 18,
                        color: "rgba(15, 23, 42, 0.68)",
                        textAlign: "left",
                    }}
                >
                    Real-time conversations with clean room-based access
                </Typography.Paragraph>

                <Tabs
                    className="auth-tabs"
                    activeKey={tab}
                    onChange={setTab}
                    items={[
                        {
                            key: "login",
                            label: "Login",
                            children: (
                                <Form layout="vertical" onFinish={onLogin} style={{ marginTop: 16 }}>
                                    <Form.Item
                                        name="email"
                                        label="Email"
                                        rules={[{ required: true, message: "Please enter your email" }]}
                                    >
                                        <Input
                                            prefix={<MailOutlined />}
                                            placeholder="you@domain.com"
                                            autoComplete="email"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="password"
                                        label="Password"
                                        rules={[{ required: true, message: "Please enter your password" }]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined />}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                        />
                                    </Form.Item>

                                    <Button type="primary" htmlType="submit" block loading={loading}>
                                        Login
                                    </Button>
                                </Form>
                            ),
                        },
                        {
                            key: "register",
                            label: "Register",
                            children: (
                                <Form layout="vertical" onFinish={onRegister} style={{ marginTop: 16 }}>
                                    <Form.Item
                                        name="name"
                                        label="Full name"
                                        rules={[{ required: true, message: "Please enter your name" }]}
                                    >
                                        <Input
                                            prefix={<UserOutlined />}
                                            placeholder="Your full name"
                                            autoComplete="name"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="email"
                                        label="Email"
                                        rules={[{ required: true, message: "Please enter your email" }]}
                                    >
                                        <Input
                                            prefix={<MailOutlined />}
                                            placeholder="you@domain.com"
                                            autoComplete="email"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="password"
                                        label="Password"
                                        rules={[{ required: true, message: "Please create a password" }]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined />}
                                            placeholder="Create a password"
                                            autoComplete="new-password"
                                        />
                                    </Form.Item>

                                    <Button type="primary" htmlType="submit" block loading={loading}>
                                        Register
                                    </Button>
                                </Form>
                            ),
                        },
                    ]}
                />
            </Card>
        </div>
    );
}