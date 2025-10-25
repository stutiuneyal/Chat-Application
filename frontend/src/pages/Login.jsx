import { useState } from "react";
import { useAuth } from "../store/auth";
import http from "../api/http";
import { Form, Input, Button, Tabs, Typography, message } from "antd";
import { MailOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";

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
            message.success("Welcome back ✨");
            // If your App routes on token presence, no need to navigate.
            // If you need to hard-jump: window.location.href = "/";
        } catch (e) {
            message.error("Login failed");
        } finally {
            setLoading(false);
        }
    };

    const onRegister = async (values) => {
        try {
            setLoading(true);
            // Assume register returns token? You said it DOESN'T — only login does.
            await http.post("/api/auth/register", values);
            message.success("Account created. Please log in.");
            setTab("login");                          // ✅ switch to Login tab
        } catch (e) {
            message.error("Register failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrap">
            <div className="auth-card">
                <Typography.Title level={2} className="auth-title">
                    Welcome to Aurora Chat
                </Typography.Title>

                <Tabs
                    size="large"
                    className="auth-tabs"
                    activeKey={tab}
                    onChange={setTab}
                    items={[
                        {
                            key: "login",
                            label: "Login",
                            children: (
                                <Form layout="vertical" onFinish={onLogin} disabled={loading}>
                                    <Form.Item
                                        label="Email"
                                        name="email"
                                        rules={[
                                            { required: true, message: "Email is required" },
                                            { type: "email", message: "Enter a valid email" },
                                        ]}
                                    >
                                        <Input
                                            size="large"
                                            prefix={<MailOutlined />}
                                            placeholder="you@domain.com"
                                            autoComplete="email"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Password"
                                        name="password"
                                        rules={[{ required: true, message: "Password is required" }]}
                                    >
                                        <Input.Password
                                            size="large"
                                            prefix={<LockOutlined />}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                        />
                                    </Form.Item>

                                    <Button type="primary" htmlType="submit" size="large" loading={loading} block>
                                        Login
                                    </Button>
                                </Form>
                            ),
                        },
                        {
                            key: "register",
                            label: "Register",
                            children: (
                                <Form layout="vertical" onFinish={onRegister} disabled={loading}>
                                    <Form.Item
                                        label="Name"
                                        name="name"
                                        rules={[{ required: true, message: "Name is required" }]}
                                    >
                                        <Input
                                            size="large"
                                            prefix={<UserOutlined />}
                                            placeholder="Your full name"
                                            autoComplete="name"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Email"
                                        name="email"
                                        rules={[
                                            { required: true, message: "Email is required" },
                                            { type: "email", message: "Enter a valid email" },
                                        ]}
                                    >
                                        <Input
                                            size="large"
                                            prefix={<MailOutlined />}
                                            placeholder="you@domain.com"
                                            autoComplete="email"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Password"
                                        name="password"
                                        rules={[{ required: true, message: "Password is required" }]}
                                    >
                                        <Input.Password
                                            size="large"
                                            prefix={<LockOutlined />}
                                            placeholder="Create a password"
                                            autoComplete="new-password"
                                        />
                                    </Form.Item>

                                    <Button type="primary" htmlType="submit" size="large" loading={loading} block>
                                        Register
                                    </Button>
                                </Form>
                            ),
                        },
                    ]}
                />
            </div>
        </div>
    );
}