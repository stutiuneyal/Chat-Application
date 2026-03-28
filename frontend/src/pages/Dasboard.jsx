import { Layout, Row, Col, Typography, message, Tour } from "antd";
import TopNav from "../components/TopNav.jsx";
import GlassCard from "../components/GlassCard.jsx";
import RoomList from "../components/RoomList.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import { useEffect, useMemo, useState } from "react";
import http from "../api/http";
import CreateRoomModal from "../components/CreateRoomModal.jsx";
import InviteUsersModal from "../components/InviteUsersModal.jsx";
import JoinRoomModal from "../components/JoinRoomModal.jsx";
import MyInvitesDrawer from "../components/MyInvitesDrawer.jsx";
import JoinRequestsDrawer from "../components/JoinRequestsDrawer.jsx";

const { Content } = Layout;

const TOUR_IMAGE_SRC = "/tour/chat-preview.png";

function TourChecklist({ currentStep, hasRoomOpen }) {
    const itemStyle = (done) => ({
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 12,
        background: done ? "rgba(111, 162, 255, 0.12)" : "rgba(15, 23, 42, 0.04)",
        border: `1px solid ${done ? "rgba(111, 162, 255, 0.22)" : "rgba(15, 23, 42, 0.06)"}`,
        color: "#0f172a",
        fontSize: 12,
        fontWeight: 600,
    });

    const dotStyle = (done) => ({
        width: 18,
        height: 18,
        minWidth: 18,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: done ? "linear-gradient(135deg, #6fa2ff, #8d7dff)" : "rgba(15, 23, 42, 0.10)",
        color: "#fff",
        fontSize: 11,
        boxShadow: done ? "0 6px 14px rgba(91, 141, 246, 0.28)" : "none",
    });

    const steps = [
        { label: "Open Rooms", done: currentStep >= 0 },
        { label: "Create Room", done: currentStep >= 1 },
        { label: "View Workspace", done: currentStep >= 2 },
        { label: "Discover Actions", done: hasRoomOpen ? currentStep >= 3 : false },
        { label: "Send First Message", done: hasRoomOpen ? currentStep >= 4 : false },
    ];

    return (
        <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(15, 23, 42, 0.48)",
                }}
            >
                Getting Started
            </div>

            {steps.map((step, index) => (
                <div key={step.label} style={itemStyle(step.done)}>
                    <span style={dotStyle(step.done)}>{step.done ? "✓" : index + 1}</span>
                    <span>{step.label}</span>
                </div>
            ))}
        </div>
    );
}

let isActions = false

function TourPreviewCard({ mode = "workspace", currentStep = 0, hasRoomOpen = false }) {
    const highlightStyle = (() => {
        switch (mode) {
            case "actions":
                isActions = true
                return {
                    top: 5,
                    right: 8,
                    width: 130,
                    height: 24,
                };
            case "composer":
                isActions = false
                return {
                    top: 200,
                    left: 5,
                    right: 8,
                    bottom: 18,
                    height: 60,
                };
            case "workspace":
            default:
                isActions = false
                return {
                    left: 8,
                    right: 8,
                    top: 8,
                    bottom: 60,
                };
        }
    })();

    const arrowStyle = (() => {
        switch (mode) {
            case "actions":
                return {
                    top: 36,
                    right: 70,
                    transform: "rotate(-28deg)",
                };
            case "composer":
                return {
                    bottom: 60,
                    left: 40,
                    transform: "rotate(26deg)",
                };
            case "workspace":
            default:
                return {
                    top: 110,
                    left: 24,
                    transform: "rotate(-10deg)",
                };
        }
    })();

    const labelText = (() => {
        switch (mode) {
            case "actions":
                return "Members, invite, and menu";
            case "composer":
                return "Message composer";
            case "workspace":
            default:
                return "Main chat workspace";
        }
    })();

    return (
        <div
            className="aurora-tour-preview-card"
            style={{
                width: 430,
                maxWidth: "100%",
                borderRadius: 22,
                overflow: "hidden",
                background: "rgba(255,255,255,0.74)",
                border: "1px solid rgba(255,255,255,0.70)",
                boxShadow: "0 22px 50px rgba(31, 38, 135, 0.14)",
                backdropFilter: "blur(18px) saturate(160%)",
                WebkitBackdropFilter: "blur(18px) saturate(160%)",
            }}
        >
            <style>
                {`
                @keyframes auroraTourZoom {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.03); }
                    100% { transform: scale(1); }
                }
                @keyframes auroraTourPulse {
                    0% { transform: scale(1); opacity: 0.82; }
                    50% { transform: scale(1.015); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.82; }
                }
                @keyframes auroraTourArrowFloat {
                    0% { transform: translateY(0px); opacity: 0.82; }
                    50% { transform: translateY(-4px); opacity: 1; }
                    100% { transform: translateY(0px); opacity: 0.82; }
                }
                `}
            </style>

            <div
                style={{
                    position: "relative",
                    overflow: "hidden",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))",
                }}
            >
                <img
                    src={TOUR_IMAGE_SRC}
                    alt="Aurora workspace preview"
                    style={{
                        display: "block",
                        width: "100%",
                        animation: "auroraTourZoom 4.2s ease-in-out infinite",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        ...highlightStyle,
                        borderRadius: 18,
                        border: "2px solid rgba(111, 162, 255, 0.82)",
                        boxShadow:
                            "0 0 0 6px rgba(111, 162, 255, 0.14), 0 14px 34px rgba(91, 141, 246, 0.26)",
                        animation: "auroraTourPulse 1.9s ease-in-out infinite",
                        pointerEvents: "none",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        ...arrowStyle,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        animation: "auroraTourArrowFloat 1.7s ease-in-out infinite",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            padding: "7px 10px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.92)",
                            color: "#0f172a",
                            fontSize: 11,
                            fontWeight: 800,
                            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.10)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {labelText}
                    </div>
                    <div
                        style={{
                            fontSize: 24,
                            lineHeight: 1,
                            color: "#5b8df6",
                            textShadow: "0 8px 16px rgba(91, 141, 246, 0.28)",
                        }}
                    >

                        {!isActions ? `↘` : `↗`}

                    </div>
                </div>
            </div>

            <div style={{ padding: "16px 16px 14px" }}>
                <TourChecklist currentStep={currentStep} hasRoomOpen={hasRoomOpen} />
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [room, setRoom] = useState(null);
    const [privateRoom, setPrivateRoom] = useState(false);
    const [reloadRooms, setReloadRooms] = useState(0);
    const [showCreate, setShowCreate] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [joinTarget, setJoinTarget] = useState(null);
    const [showMyInvites, setShowMyInvites] = useState(false);
    const [showJoinReqs, setShowJoinReqs] = useState(false);

    const [tourOpen, setTourOpen] = useState(false);
    const [tourCurrent, setTourCurrent] = useState(0);

    const paneHeight = "calc(100vh - 84px - 24px)";
    const currentUserId = String(localStorage.getItem("user") || "").trim();
    const tourStorageKey = currentUserId
        ? `aurora_tour_seen_${currentUserId}`
        : "aurora_tour_seen_guest";

    const createRoom = () => setShowCreate(true);

    const refreshRooms = () => {
        setReloadRooms((prev) => prev + 1);
    };

    const requestJoin = async (targetRoom) => {
        try {
            const { data } = await http.post(`/api/rooms/${targetRoom.id}/join-request`);

            if (data?.joined) {
                message.success(`Joined ${targetRoom.name}`);
                setRoom((prev) => ({
                    ...(prev || {}),
                    ...targetRoom,
                    isMember: true,
                }));
                refreshRooms();
                return;
            } else if (data?.requested) {
                message.success(`Join request sent for ${targetRoom.name}`);
            } else {
                message.success(`Updated ${targetRoom.name}`);
            }

            refreshRooms();
        } catch (err) {
            console.error(err);
            message.error(err?.response?.data?.message || "Failed to send join request");
        }
    };

    const handleRoomCreated = (data) => {
        setRoom({ id: data.id, name: data.name, isPrivate: data.isPrivate });
        refreshRooms();
        message.success("Room created");
    };

    const handleLeaveRoom = async (roomId) => {
        try {
            await http.post(`/api/rooms/${roomId}/leave`);
            message.success("Left room");

            if (room?.id === roomId) {
                setRoom(null);
            }

            refreshRooms();
        } catch (err) {
            message.error(err?.response?.data?.message || "Failed to leave room");
        }
    };

    const handleMuteRoom = async (roomId) => {
        try {
            await http.post(`/api/rooms/${roomId}/mute`);
            message.success("Room muted");
        } catch (err) {
            message.info(
                err?.response?.data?.message || "Mute action is not available yet"
            );
        }
    };

    useEffect(() => {
        if (!currentUserId) return;

        const hasSeenTour = localStorage.getItem(tourStorageKey);
        if (hasSeenTour === "true") return;

        const timer = setTimeout(() => {
            setTourOpen(true);
            setTourCurrent(0);
        }, 700);

        return () => clearTimeout(timer);
    }, [currentUserId, tourStorageKey]);

    const handleCloseTour = () => {
        localStorage.setItem(tourStorageKey, "true");
        setTourOpen(false);
        setTourCurrent(0);
    };

    const hasOpenRoom = !!room?.id;

    const tourSteps = useMemo(() => {
        const auroraTitleStyle = {
            fontWeight: 800,
            letterSpacing: "-0.02em",
        };

        const liveSteps = [
            {
                title: <span style={auroraTitleStyle}>Rooms</span>,
                description:
                    "This is your room list. Browse available spaces and open a conversation from here.",
                target: () => document.getElementById("aurora-tour-room-list"),
            },
            {
                title: <span style={auroraTitleStyle}>Create room</span>,
                description:
                    "Use this button to create a new room for private or public collaboration.",
                target: () => document.getElementById("aurora-tour-create-room"),
                placement: "bottomLeft",
            },
        ];

        if (!hasOpenRoom) {
            return [
                ...liveSteps,
                {
                    title: <span style={auroraTitleStyle}>Chat workspace</span>,
                    description:
                        "Once you open a room, this is where messages, files, and discussions will appear.",
                    cover: (
                        <TourPreviewCard
                            mode="workspace"
                            currentStep={tourCurrent}
                            hasRoomOpen={false}
                        />
                    ),
                },
                {
                    title: <span style={auroraTitleStyle}>Room actions</span>,
                    description:
                        "Invite users, view room details, and manage the room from the header area.",
                    cover: (
                        <TourPreviewCard
                            mode="actions"
                            currentStep={tourCurrent}
                            hasRoomOpen={false}
                        />
                    ),
                },
                {
                    title: <span style={auroraTitleStyle}>Composer</span>,
                    description:
                        "Send messages, attach files, and record voice or video notes from the composer.",
                    cover: (
                        <TourPreviewCard
                            mode="composer"
                            currentStep={tourCurrent}
                            hasRoomOpen={false}
                        />
                    ),
                },
            ];
        }

        return [
            ...liveSteps,
            {
                title: <span style={auroraTitleStyle}>Chat workspace</span>,
                description:
                    "This is the main workspace for the active room. Messages, files, media, replies, and reactions all live here.",
                target: () => document.getElementById("aurora-tour-chat-panel"),
            },
            {
                title: <span style={auroraTitleStyle}>Room actions</span>,
                description:
                    "Use the room header to view members, invite people, and manage room-level actions.",
                target: () => document.getElementById("aurora-tour-chat-header"),
            },
            {
                title: <span style={auroraTitleStyle}>Composer</span>,
                description:
                    "Write messages, share files, and send voice or video notes from here.",
                target: () => document.getElementById("aurora-tour-composer"),
            },
        ];
    }, [hasOpenRoom, tourCurrent]);

    return (
        <Layout className="dashboard-layout">
            <TopNav />

            <Content className="dashboard-content">
                <Row gutter={16} className="dashboard-row">
                    <Col xs={24} md={8} lg={7} xl={6}>
                        <div
                            id="aurora-tour-room-list"
                            className="dashboard-pane"
                            style={{ height: paneHeight }}
                        >
                            <RoomList
                                selectedId={room?.id}
                                reloadKey={reloadRooms}
                                onOpen={(r) => setRoom(r)}
                                onRequestJoin={requestJoin}
                                onCreateRoom={createRoom}
                                onShowInvites={() => setShowMyInvites(true)}
                                privateOnly={privateRoom}
                            />
                        </div>
                    </Col>

                    <Col xs={24} md={16} lg={17} xl={18}>
                        <GlassCard
                            id="aurora-tour-chat-panel"
                            className="chat-panel dashboard-pane"
                            style={{
                                height: paneHeight,
                                display: "flex",
                                flexDirection: "column",
                                minHeight: 0,
                            }}
                        >
                            {room?.id ? (
                                <div className="chat-container">
                                    <ChatWindow
                                        key={room.id}
                                        roomId={room.id}
                                        roomName={room.name}
                                        onInvite={() => setShowInvite(true)}
                                        onLeaveRoom={handleLeaveRoom}
                                        onMuteRoom={handleMuteRoom}
                                        onRoomListRefresh={refreshRooms}
                                        headerId="aurora-tour-chat-header"
                                        composerWrapperId="aurora-tour-composer"
                                    />
                                </div>
                            ) : (
                                <div className="dashboard-empty-state">
                                    <Typography.Text className="dashboard-empty-text">
                                        Select a room to start chatting
                                    </Typography.Text>
                                </div>
                            )}
                        </GlassCard>
                    </Col>
                </Row>
            </Content>

            <CreateRoomModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={handleRoomCreated}
            />

            <InviteUsersModal
                open={showInvite}
                onClose={(changed) => {
                    setShowInvite(false);
                    if (changed) refreshRooms();
                }}
                roomId={room?.id}
            />

            <JoinRoomModal
                open={!!joinTarget}
                onClose={(joined) => {
                    setJoinTarget(null);
                    if (joined) refreshRooms();
                }}
                room={joinTarget}
            />

            <MyInvitesDrawer
                open={showMyInvites}
                onClose={() => setShowMyInvites(false)}
                onChanged={refreshRooms}
            />

            <JoinRequestsDrawer
                open={showJoinReqs}
                onClose={() => setShowJoinReqs(false)}
                roomId={room?.id}
                onChanged={refreshRooms}
            />

            <Tour
                open={tourOpen}
                current={tourCurrent}
                onChange={setTourCurrent}
                onClose={handleCloseTour}
                steps={tourSteps}
                placement="bottom"
                zIndex={1200}
                mask={{
                    style: {
                        backdropFilter: "blur(8px)",
                        background: "rgba(15, 23, 42, 0.34)",
                    },
                }}
                rootClassName="aurora-tour"
            />
        </Layout>
    );
}