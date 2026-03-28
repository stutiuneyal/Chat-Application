import { useEffect, useMemo, useRef, useState } from "react";
import {
    Avatar,
    Button,
    Dropdown,
    Empty,
    List,
    Spin,
    Typography,
    message,
    Tag,
    Popconfirm,
    Modal,
    Popover,
    Tooltip
} from "antd";
import {
    UserOutlined,
    DeleteOutlined,
    TeamOutlined,
    UserDeleteOutlined,
    PlusOutlined,
    MoreOutlined,
    AudioMutedOutlined,
    LogoutOutlined,
    InfoCircleOutlined,
    MessageOutlined,
    SmileOutlined,
} from "@ant-design/icons";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import InfiniteScroll from "react-infinite-scroll-component";
import { uploadChatFiles } from "../api/chatUpload";

import http from "../api/http";
import { useAuth } from "../store/auth";
import ChatComposer from "./ChatComposer";
import RichMessage from "../components/chat/RichMessage";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "🔥", "🙏"];

function groupMessageDate(dateValue) {
    return new Date(dateValue).toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function isWithinTwoMinutes(currentDate, previousDate) {
    const current = new Date(currentDate).getTime();
    const previous = new Date(previousDate).getTime();
    const diffMs = Math.abs(current - previous);
    return diffMs <= 2 * 60 * 1000;
}

function initials(name = "") {
    return (
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((x) => x[0]?.toUpperCase() || "")
            .join("") || "?"
    );
}

function getLoggedInUserId() {
    return String(localStorage.getItem("user") || "").trim();
}

function normalizeMessage(message) {
    return {
        ...message,
        senderId: String(message?.senderId || "").trim(),
        senderName: String(message?.senderName || "").trim(),
    };
}

function isMineMessage(message) {
    const loggedInUserId = getLoggedInUserId();
    const senderId = String(message?.senderId || "").trim();
    return loggedInUserId !== "" && senderId !== "" && loggedInUserId === senderId;
}

function getAttachmentKind(file) {
    const contentType = String(file?.contentType || "").toLowerCase();
    const url = String(file?.url || "").toLowerCase();

    if (contentType.startsWith("image/")) return "image";
    if (contentType.startsWith("video/")) return "video";
    if (contentType.startsWith("audio/")) return "audio";

    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(url)) return "image";
    if (/\.(mp4|webm|mov|ogg|m4v)$/.test(url)) return "video";
    if (/\.(mp3|wav|ogg|m4a|webm)$/.test(url)) return "audio";

    return "file";
}

function linkifyText(text = "") {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    return String(text).replace(
        urlRegex,
        (url) =>
            `<a href="${url}" target="_blank" rel="noreferrer" class="chat-auto-link">${url}</a>`
    );
}

function extractFirstUrl(text = "") {
    const match = String(text).match(/https?:\/\/[^\s<]+/i);
    return match ? match[0] : null;
}

function getDomainLabel(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
}

export default function ChatWindow({
    roomId,
    roomName,
    onInvite,
    onLeaveRoom,
    onMuteRoom,
    onRoomListRefresh,
    headerId,
    composerWrapperId,
}) {
    const token = useAuth((s) => s.token);
    const user = useAuth((s) => s.user);

    const [client, setClient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [typingUser, setTypingUser] = useState(null);
    const [loadingFirstPage, setLoadingFirstPage] = useState(false);

    const [roomMeta, setRoomMeta] = useState(null);
    const [loadingMeta, setLoadingMeta] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [accessRevoked, setAccessRevoked] = useState(false);

    const typingTimer = useRef(null);
    const typingPublishTimer = useRef(null);
    const scrollRef = useRef(null);

    const currentUserId = user?.id || user?._id || null;
    const myUserId = getLoggedInUserId();

    const fetchRoomMeta = async () => {
        if (!roomId) return;
        try {
            setLoadingMeta(true);
            const { data } = await http.get(`/api/rooms/${roomId}/meta`);
            setRoomMeta(data);

            if (data?.isMember === false) {
                setAccessRevoked(true);
                onRoomListRefresh?.();
            }
        } catch (err) {
            console.error("Failed to load room meta", err);

            if (err?.response?.status === 401 || err?.response?.status === 403) {
                setAccessRevoked(true);
                setTypingUser(null);
                onRoomListRefresh?.();
            }
        } finally {
            setLoadingMeta(false);
        }
    };

    const fetchPage = async (p = 0) => {
        try {
            if (p === 0) setLoadingFirstPage(true);

            const { data } = await http.get(`/api/messages/${roomId}`, {
                params: { pageNo: p, pageSize: 30 },
            });

            const rawChunk = [...(data?.content || [])].reverse();
            const chunk = rawChunk.map((m) => normalizeMessage(m));

            setMessages((prev) => (p === 0 ? chunk : [...chunk, ...prev]));
            setHasMore(!data?.last);
            setPage(p);

            if (p === 0 && scrollRef.current) {
                setTimeout(() => {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }, 0);
            }
        } catch (err) {
            console.error("Failed to load messages", err);
            message.error("Failed to load messages");
        } finally {
            setLoadingFirstPage(false);
        }
    };

    useEffect(() => {
        if (!roomId) return;
        setMessages([]);
        setPage(0);
        setHasMore(true);
        setReplyTo(null);
        setAccessRevoked(false);
        setTypingUser(null);
        fetchPage(0);
        fetchRoomMeta();
    }, [roomId, user]);

    useEffect(() => {
        if (!roomId) return;

        const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8092";

        const c = new Client({
            webSocketFactory: () => new SockJS(`${base}/ws`),
            reconnectDelay: 2000,
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
            onConnect: () => {
                c.subscribe(`/topic/rooms.${roomId}`, (msg) => {
                    const payload = JSON.parse(msg.body);

                    if (payload?.type === "MESSAGE_CREATED" && payload?.message) {
                        const normalized = normalizeMessage(payload.message);

                        setMessages((prev) => [...prev, normalized]);

                        if (scrollRef.current) {
                            setTimeout(() => {
                                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                            }, 0);
                        }
                        return;
                    }

                    if (payload?.type === "MESSAGE_REACTION_UPDATED" && payload?.messageId) {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === payload.messageId
                                    ? { ...m, reactions: payload.reactions || [] }
                                    : m
                            )
                        );
                        return;
                    }

                    if (payload?.type === "MESSAGE_DELETED" && payload?.messageId) {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === payload.messageId
                                    ? {
                                        ...m,
                                        deletedForUser: true,
                                        contentText: "",
                                        contentHtml: "",
                                        attachments: [],
                                    }
                                    : m
                            )
                        );
                        return;
                    }
                });

                c.subscribe(`/topic/typing.${roomId}`, (msg) => {
                    if (accessRevoked || roomMeta?.isMember === false) return;

                    const payload = JSON.parse(msg.body);
                    const typingUserId = String(payload?.userId || "").trim();

                    if (typingUserId && myUserId && typingUserId === myUserId) {
                        return;
                    }

                    setTypingUser(payload?.typing ? payload?.userName || "Someone" : null);

                    if (payload?.typing) {
                        clearTimeout(typingTimer.current);
                        typingTimer.current = setTimeout(() => setTypingUser(null), 1800);
                    }
                });

                c.subscribe(`/topic/room-events.${roomId}.${myUserId}`, (msg) => {
                    const payload = JSON.parse(msg.body);

                    if (payload?.type === "ROOM_ACCESS_REVOKED" && payload?.roomId === roomId) {
                        setAccessRevoked(true);
                        setTypingUser(null);
                        clearTimeout(typingTimer.current);
                        clearTimeout(typingPublishTimer.current);

                        message.warning(payload?.message || "You were removed from this room");
                        fetchRoomMeta();
                        onRoomListRefresh?.();
                    }
                });
            },
        });

        c.activate();
        setClient(c);

        return () => {
            clearTimeout(typingTimer.current);
            clearTimeout(typingPublishTimer.current);
            c.deactivate();
        };
    }, [roomId, token, accessRevoked, roomMeta?.isMember, myUserId]);

    const deleteOwn = async (id) => {
        try {
            await http.delete(`/api/messages/${id}/delete`);
            setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, deletedForUser: true } : m))
            );
            message.success("Message deleted");
        } catch {
            message.error("Delete failed");
        }
    };

    const removeUser = async (userId) => {
        try {
            await http.delete(`/api/rooms/${roomId}/users/${userId}/remove`);
            message.success("User removed");
            fetchRoomMeta();
            onRoomListRefresh?.();
        } catch (err) {
            message.error(err?.response?.data?.message || "Failed to remove user");
        }
    };

    const sendReaction = (messageId, emoji) => {
        if (!client) return;

        client.publish({
            destination: `/app/rooms/${roomId}/react`,
            body: JSON.stringify({ messageId, emoji }),
        });
    };

    const decoratedMessages = useMemo(() => {
        return messages.map((rawMessage, index) => {
            const m = {
                ...rawMessage,
                mine: isMineMessage(rawMessage),
            };

            const prevRaw = messages[index - 1];
            const prev = prevRaw
                ? {
                    ...prevRaw,
                    mine: isMineMessage(prevRaw),
                }
                : null;

            const dateLabel = groupMessageDate(m.createdAt);
            const prevDateLabel = prev ? groupMessageDate(prev.createdAt) : null;

            const sameSender =
                !!prev && String(prev.senderId || "") === String(m.senderId || "");

            const sameDay = dateLabel === prevDateLabel;
            const withinTwoMinutes =
                !!prev && isWithinTwoMinutes(m.createdAt, prev.createdAt);

            const groupedWithPrev = sameSender && sameDay && withinTwoMinutes;

            return {
                ...m,
                groupedWithPrev,
                groupStart: !groupedWithPrev,
                showDateDivider: dateLabel !== prevDateLabel,
                dateLabel,
            };
        });
    }, [messages]);

    const members = roomMeta?.members || [];
    const memberCount = roomMeta?.memberCount ?? members.length ?? 0;
    const admins = roomMeta?.admins || [];
    const isAdmin =
        roomMeta?.isAdmin ||
        roomMeta?.currentUserIsAdmin ||
        admins.some((a) => a.id === currentUserId);

    const resolvedRoomName = roomName || roomMeta?.name || "Room";
    const composerDisabled = accessRevoked || roomMeta?.isMember === false;

    const overflowItems = [
        {
            key: "details",
            icon: <InfoCircleOutlined />,
            label: "View details",
            onClick: () => setDetailsOpen(true),
        },
        {
            key: "mute",
            icon: <AudioMutedOutlined />,
            label: "Mute",
            onClick: () => {
                if (onMuteRoom) onMuteRoom(roomId);
                else message.info("Mute action not wired yet");
            },
        },
        {
            key: "leave",
            icon: <LogoutOutlined />,
            label: "Leave room",
            danger: true,
            onClick: () => {
                if (onLeaveRoom) onLeaveRoom(roomId);
                else message.info("Leave room action not wired yet");
            },
        },
    ];

    const reactionPopover = (messageId) => (
        <div className="chat-reaction-picker">
            {QUICK_REACTIONS.map((emoji) => (
                <button
                    key={emoji}
                    type="button"
                    className="chat-reaction-picker-btn"
                    onClick={() => sendReaction(messageId, emoji)}
                >
                    {emoji}
                </button>
            ))}
        </div>
    );

    return (
        <div className="chat-shell">
            <div className="chat-header" id={headerId}>
                <div className="chat-topbar">
                    <div className="chat-topbar-left">
                        <Avatar className="chat-room-avatar">{initials(resolvedRoomName)}</Avatar>

                        <div className="chat-topbar-meta">
                            <Typography.Title level={3} className="chat-room-title">
                                {resolvedRoomName}
                            </Typography.Title>

                            {typingUser ? (
                                <Typography.Text className="chat-room-status">
                                    {typingUser} is typing...
                                </Typography.Text>
                            ) : null}
                        </div>
                    </div>

                    <div className="chat-topbar-actions">
                        <div className="chat-member-chip">
                            <TeamOutlined />
                            <span>{loadingMeta ? "..." : memberCount}</span>
                        </div>

                        <Button
                            icon={<PlusOutlined />}
                            className="chat-topbar-invite-btn"
                            onClick={onInvite}
                            aria-label="Invite users"
                            title="Invite users"
                        />

                        <Dropdown menu={{ items: overflowItems }} trigger={["click"]} placement="bottomRight">
                            <Button className="chat-topbar-menu-btn" icon={<MoreOutlined />} aria-label="More actions" />
                        </Dropdown>
                    </div>
                </div>
            </div>

            <div id="chat-scroll" className="chat-messages" ref={scrollRef}>
                {loadingFirstPage ? (
                    <div className="chat-center">
                        <Spin />
                    </div>
                ) : decoratedMessages.length === 0 ? (
                    <div className="chat-center">
                        <Empty description="No messages yet" />
                    </div>
                ) : (
                    <InfiniteScroll
                        dataLength={decoratedMessages.length}
                        next={() => fetchPage(page + 1)}
                        hasMore={hasMore}
                        inverse
                        loader={<div className="chat-loader">Loading older messages…</div>}
                        scrollableTarget="chat-scroll"
                        style={{ overflow: "visible" }}
                    >
                        <List
                            dataSource={decoratedMessages}
                            renderItem={(m) => (
                                <div key={m.id}>
                                    {m.showDateDivider && (
                                        <div className="chat-date-divider">
                                            <span>{m.dateLabel}</span>
                                        </div>
                                    )}

                                    <div
                                        className={`chat-row ${m.mine ? "mine" : ""} ${m.groupedWithPrev ? "grouped" : ""} ${m.groupStart ? "group-start" : ""}`}
                                    >
                                        {!m.mine && !m.groupedWithPrev ? (
                                            <Avatar icon={<UserOutlined />} className="chat-avatar" />
                                        ) : (
                                            <div className="chat-avatar-spacer" />
                                        )}

                                        <div className="chat-message-stack">
                                            {!m.mine && !m.groupedWithPrev && (
                                                <Typography.Text className="chat-sender">
                                                    {m.senderName}
                                                </Typography.Text>
                                            )}

                                            <div className={`chat-bubble ${m.mine ? "mine" : "theirs"} ${m.deletedForUser ? "deleted" : ""}`}>
                                                {m.replyPreview ? (
                                                    <div className="chat-bubble-reply">
                                                        <div className="chat-bubble-reply-title">
                                                            {m.replyPreview.senderName || m.replyPreview.sender?.name || "Unknown"}
                                                        </div>
                                                        <div className="chat-bubble-reply-body">
                                                            {m.replyPreview.contentText || "[message]"}
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {m.deletedForUser ? (
                                                    <div className="chat-bubble-content">[deleted]</div>
                                                ) : (
                                                    <RichMessage
                                                        html={m.contentHtml || linkifyText(m.contentText || "")}
                                                        text={m.contentText}
                                                        mine={m.mine}
                                                    />
                                                )}

                                                {!m.deletedForUser && (() => {
                                                    const previewUrl = extractFirstUrl(m.contentText || "");
                                                    if (!previewUrl) return null;

                                                    return (
                                                        <a
                                                            href={previewUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className={`chat-link-preview ${m.mine ? "mine" : "theirs"}`}
                                                        >
                                                            <div className="chat-link-preview-label">Link preview</div>
                                                            <div className="chat-link-preview-url">{previewUrl}</div>
                                                            <div className="chat-link-preview-domain">{getDomainLabel(previewUrl)}</div>
                                                        </a>
                                                    );
                                                })()}

                                                {m.attachments?.length ? (
                                                    <div className="chat-message-attachments">
                                                        {m.attachments.map((file, index) => {
                                                            const kind = getAttachmentKind(file);

                                                            if (kind === "image") {
                                                                return (
                                                                    <a
                                                                        key={`${file.url}-${index}`}
                                                                        href={file.url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="chat-message-media-link"
                                                                    >
                                                                        <img
                                                                            src={file.url}
                                                                            alt={file.fileName || "attachment"}
                                                                            className="chat-message-image"
                                                                        />
                                                                    </a>
                                                                );
                                                            }

                                                            if (kind === "video") {
                                                                return (
                                                                    <video
                                                                        key={`${file.url}-${index}`}
                                                                        className="chat-message-video"
                                                                        controls
                                                                        preload="metadata"
                                                                    >
                                                                        <source src={file.url} type={file.contentType || "video/mp4"} />
                                                                    </video>
                                                                );
                                                            }

                                                            if (kind === "audio") {
                                                                return (
                                                                    <audio
                                                                        key={`${file.url}-${index}`}
                                                                        className="chat-message-audio"
                                                                        controls
                                                                        preload="metadata"
                                                                    >
                                                                        <source src={file.url} type={file.contentType || "audio/mpeg"} />
                                                                    </audio>
                                                                );
                                                            }

                                                            return (
                                                                <a
                                                                    key={`${file.url}-${index}`}
                                                                    href={file.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="chat-message-attachment"
                                                                >
                                                                    📎 {file.fileName}
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                ) : null}

                                                <div className="chat-bubble-meta">
                                                    {m.reactions?.length ? (
                                                        <div className="chat-reaction-strip">
                                                            {m.reactions.map((reaction) => {
                                                                const tooltipContent = reaction.reactedUsers?.length ? (
                                                                    <div className="chat-reaction-tooltip">
                                                                        {reaction.reactedUsers.map((user, index) => {
                                                                            const isMe =
                                                                                String(user?.id || "").trim() === String(myUserId || "").trim();

                                                                            return (
                                                                                <div
                                                                                    key={`${reaction.emoji}-${user?.id || index}`}
                                                                                    className="chat-reaction-tooltip-user"
                                                                                >
                                                                                    {isMe ? "You" : user?.name || user?.email || "Unknown"}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <div className="chat-reaction-tooltip-user">
                                                                        {reaction.count} reaction{reaction.count > 1 ? "s" : ""}
                                                                    </div>
                                                                );

                                                                return (
                                                                    <Tooltip
                                                                        key={reaction.emoji}
                                                                        title={tooltipContent}
                                                                        placement="top"
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            className={`chat-reaction-pill ${reaction.reactedByMe ? "active" : ""}`}
                                                                            onClick={() => sendReaction(m.id, reaction.emoji)}
                                                                        >
                                                                            <span>{reaction.emoji}</span>
                                                                            <span>{reaction.count}</span>
                                                                        </button>
                                                                    </Tooltip>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : null}

                                                    <span className="chat-bubble-time">
                                                        {new Date(m.createdAt).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>

                                                    <div className="chat-bubble-actions">
                                                        {!m.deletedForUser ? (
                                                            <>
                                                                <Popover
                                                                    trigger="click"
                                                                    placement={m.mine ? "topRight" : "topLeft"}
                                                                    content={reactionPopover(m.id)}
                                                                >
                                                                    <Button type="text" size="small" icon={<SmileOutlined />} />
                                                                </Popover>

                                                                <Button
                                                                    type="text"
                                                                    size="small"
                                                                    icon={<MessageOutlined />}
                                                                    onClick={() =>
                                                                        setReplyTo({
                                                                            id: m.id,
                                                                            senderName: m.senderName,
                                                                            contentText: m.contentText,
                                                                        })
                                                                    }
                                                                />

                                                                {m.mine ? (
                                                                    <Button
                                                                        type="text"
                                                                        size="small"
                                                                        icon={<DeleteOutlined />}
                                                                        onClick={() => deleteOwn(m.id)}
                                                                    />
                                                                ) : null}
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                    </InfiniteScroll>
                )}
            </div>

            {composerDisabled ? (
                <div
                    style={{
                        margin: "8px 12px 0",
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: "rgba(255, 236, 214, 0.9)",
                        border: "1px solid rgba(255, 184, 77, 0.35)",
                        color: "#8a4b00",
                        fontSize: 13,
                        fontWeight: 600,
                    }}
                >
                    You were removed from this room. You can no longer send messages here.
                </div>
            ) : null}
            <div id={composerWrapperId}>
            <ChatComposer
                disabled={composerDisabled}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onUploadFiles={(files) => uploadChatFiles(roomId, files)}
                onSendMessage={async (payload) => {
                    if (composerDisabled) {
                        message.error("You can no longer send messages in this room");
                        return;
                    }

                    if (!client) return;

                    client.publish({
                        destination: `/app/rooms/${roomId}/send`,
                        body: JSON.stringify(payload),
                    });

                    client.publish({
                        destination: `/app/room/${roomId}/stopTyping`,
                        body: "",
                    });
                }}
                onTyping={(nextValue) => {
                    if (composerDisabled) return;
                    if (!client) return;

                    const hasText = !!nextValue?.trim();
                    clearTimeout(typingPublishTimer.current);

                    if (hasText) {
                        client.publish({
                            destination: `/app/room/${roomId}/typing`,
                            body: "",
                        });

                        typingPublishTimer.current = setTimeout(() => {
                            client.publish({
                                destination: `/app/room/${roomId}/stopTyping`,
                                body: "",
                            });
                        }, 900);
                    } else {
                        client.publish({
                            destination: `/app/room/${roomId}/stopTyping`,
                            body: "",
                        });
                    }
                }}
            />
            </div>

            <Modal
                open={detailsOpen}
                onCancel={() => setDetailsOpen(false)}
                footer={null}
                title="Room details"
                centered
            >
                <div style={{ display: "grid", gap: 12 }}>
                    <div>
                        <Typography.Text strong>Room name:</Typography.Text>{" "}
                        <Typography.Text>{roomMeta?.name || roomName}</Typography.Text>
                    </div>

                    <div>
                        <Typography.Text strong>Privacy:</Typography.Text>{" "}
                        <Typography.Text>{roomMeta?.isPrivate ? "Private" : "Public"}</Typography.Text>
                    </div>

                    <div>
                        <Typography.Text strong>Members:</Typography.Text>{" "}
                        <Typography.Text>{memberCount}</Typography.Text>
                    </div>

                    <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                        {members.length ? (
                            members.map((member) => {
                                const memberName = member?.name || member?.email || "Unknown";
                                const memberIsAdmin = member?.isAdmin === true || member?.isAdmin === "true";

                                return (
                                    <div
                                        key={member.id || member.email}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 12,
                                            padding: "10px 12px",
                                            borderRadius: 14,
                                            background: "rgba(255,255,255,0.72)",
                                            border: "1px solid rgba(164,179,245,0.24)",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <Avatar size="small" className="chat-member-avatar">
                                                {initials(memberName)}
                                            </Avatar>

                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span style={{ fontWeight: 700 }}>{memberName}</span>
                                                <span style={{ fontSize: 12, color: "rgba(23,32,51,0.58)" }}>
                                                    {member.email}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            {memberIsAdmin ? <Tag color="purple">Admin</Tag> : null}

                                            {isAdmin && !memberIsAdmin ? (
                                                <Popconfirm
                                                    title={`Remove ${memberName}?`}
                                                    okText="Remove"
                                                    cancelText="Cancel"
                                                    onConfirm={() => removeUser(member.id)}
                                                >
                                                    <Button type="text" size="small" danger icon={<UserDeleteOutlined />}>
                                                        Remove
                                                    </Button>
                                                </Popconfirm>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <Empty description="No member list available" />
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}