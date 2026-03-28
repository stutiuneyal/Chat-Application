import { Layout, Button, Typography, Avatar } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../store/auth";

const { Header } = Layout;

export default function TopNav() {
    const { logout, user } = useAuth();

    const username = localStorage.getItem("username")

    const displayName =
        username ||
        user?.name ||
        (user?.email ? user.email.split("@")[0] : null) ||
        "Guest";

    return (
        <Header className="top-nav top-nav-premium">
            <div className="top-nav-premium-bg" />

            <div className="top-nav-inner">
                <div className="top-nav-brand">
                    <div className="top-nav-brand-mark">
                        <div className="top-nav-brand-orb" />
                        <div className="top-nav-brand-ring" />
                    </div>

                    <div className="top-nav-brand-copy">
                        <Typography.Title level={2} className="top-nav-title">
                            Aurora
                        </Typography.Title>
                        <Typography.Text className="top-nav-subtitle">
                            Focused conversations for teams
                        </Typography.Text>
                    </div>
                </div>

                <div className="top-nav-actions">
                    <div className="top-nav-user">
                        <Avatar className="top-nav-avatar" icon={<UserOutlined />} />
                        <div className="top-nav-user-copy">
                            <span className="top-nav-user-name">{displayName}</span>
                            <span className="top-nav-user-status">Active now</span>
                        </div>
                    </div>

                    <Button
                        className="top-nav-logout-btn"
                        icon={<LogoutOutlined />}
                        onClick={logout}
                    >
                        Logout
                    </Button>
                </div>
            </div>
        </Header>
    );
}