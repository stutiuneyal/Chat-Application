import { Layout, Row, Col, Typography, Button, Switch, message } from "antd";
import TopNav from "../components/TopNav.jsx";
import GlassCard from "../components/GlassCard.jsx";
import RoomList from "../components/RoomList.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import ReviewsPanel from "../components/ReviewsPanel.jsx";
import InvitePanel from "../components/InvitePanel.jsx";
import { useState } from "react";
import http from "../api/http";
import CreateRoomModal from "../components/CreateRoomModal.jsx";
import InviteUsersModal from "../components/InviteUsersModal.jsx";
import JoinRoomModal from "../components/JoinRoomModal.jsx";
import MyInvitesDrawer from "../components/MyInvitesDrawer.jsx";
import JoinRequestsDrawer from "../components/JoinRequestsDrawer.jsx";

const { Content } = Layout;

export default function Dashboard() {
    const [room, setRoom] = useState(null);
    const [privateRoom, setPrivateRoom] = useState(false);
    const [reloadRooms, setReloadRooms] = useState(0);
    const [showCreate, setShowCreate] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [joinTarget, setJoinTarget] = useState(null);
    const [showMyInvites, setShowMyInvites] = useState(false);
    const [showJoinReqs, setShowJoinReqs] = useState(false);

    const paneHeight = "calc(100vh - 64px - 40px)";

    const createRoom = () => setShowCreate(true);

    const handleRoomCreated = (data) => {
        setRoom({ id: data.id, name: data.name, isPrivate: data.isPrivate });
        setReloadRooms(k => k + 1);
        message.success("Room created");
    };

    return (
        <Layout style={{ minHeight: "100vh", background: "transparent" }}>
            <TopNav />
            <Content style={{ padding: 12 }}>
                <Row gutter={12}>
                    <Col xs={24} md={7} lg={6}>
                        <GlassCard style={{ height: paneHeight, display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                                <Typography.Text style={{ color: "#0f172a", fontSize: 16, fontWeight: 700 }}>Rooms</Typography.Text>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ color: "rgba(15,23,42,.72)", fontSize: 12 }}>Private</span>
                                        <Switch checked={privateRoom} onChange={setPrivateRoom} />
                                    </div>
                                    <Button onClick={() => setShowMyInvites(true)}>Invites</Button>
                                    <Button type="primary" size="middle" onClick={createRoom}>New</Button>
                                </div>
                            </div>
                            <div className="scroll-y" style={{ flex: 1, minHeight: 0 }}>
                                <RoomList
                                    selectedId={room?.id}
                                    reloadKey={reloadRooms}
                                    onOpen={(r) => setRoom(r)}
                                    onRequestJoin={(r) => setJoinTarget(r)}
                                />
                            </div>
                        </GlassCard>
                    </Col>

                    <Col xs={24} md={10} lg={12}>
                        <GlassCard className="chat-panel" style={{ height: paneHeight, display: "flex", flexDirection: "column" }}>
                            {room?.id ? (
                                <div style={{ flex: 1, minHeight: 0 }}>
                                    <ChatWindow
                                        key={room.id}
                                        roomId={room.id}
                                        roomName={room.name}
                                        onInvite={() => setShowInvite(true)}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <Typography.Text className="text-white/70">Select or create a room</Typography.Text>
                                </div>
                            )}
                        </GlassCard>
                    </Col>

                    <Col xs={24} md={7} lg={6}>
                        <div className="flex flex-col gap-3" style={{ height: paneHeight }}>
                            <GlassCard className="scroll-y" style={{ flex: 1, minHeight: 0 }}>
                                <Typography.Text style={{ color: "white" }}>Reviews</Typography.Text>
                                {room && <div className="mt-2"><ReviewsPanel roomId={room.id} /></div>}
                            </GlassCard>
                            {room?.isPrivate && (
                                <GlassCard className="scroll-y" style={{ flex: 1, minHeight: 0 }}>
                                    <Typography.Text style={{ color: "white" }}>Invites</Typography.Text>
                                    <div className="mt-2"><InvitePanel roomId={room.id} /></div>
                                </GlassCard>
                            )}
                            {room?.id && (
                                <Button onClick={() => setShowJoinReqs(true)}>Requests</Button>
                            )}
                        </div>
                    </Col>
                </Row>
            </Content>

            <CreateRoomModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleRoomCreated} />
            <InviteUsersModal open={showInvite} onClose={() => setShowInvite(false)} roomId={room?.id} />
            <JoinRoomModal open={!!joinTarget} onClose={(joined) => { setJoinTarget(null); if (joined) setReloadRooms(k => k + 1); }} room={joinTarget} />
            <MyInvitesDrawer open={showMyInvites} onClose={() => setShowMyInvites(false)} onChanged={() => setReloadRooms(k => k + 1)} />
            <JoinRequestsDrawer open={showJoinReqs} onClose={() => setShowJoinReqs(false)} roomId={room?.id} onChanged={() => setReloadRooms(k => k + 1)} />
        </Layout>
    );
}
