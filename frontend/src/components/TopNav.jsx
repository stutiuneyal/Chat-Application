// TopNav.jsx
import { Layout, Button, Typography } from "antd";
import { useAuth } from "../store/auth";
const { Header } = Layout;

export default function TopNav() {
    const { logout } = useAuth();
    return (
        <Header className="sticky-header glass-header" style={{ height: 64 }}>
            <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
                <Typography.Title level={3} className="brand" style={{ margin: 0 }}>
                    ✨ Aurora Chat
                </Typography.Title>
                <Button className="logout-btn" size="middle" onClick={logout}>Logout</Button>
            </div>
        </Header>
    );
}
