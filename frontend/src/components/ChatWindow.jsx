import { useEffect, useRef, useState } from "react";
import { List, Input, Button, Badge, Typography, message, Space } from "antd";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import http from "../api/http";
import InfiniteScroll from "react-infinite-scroll-component";
import { useAuth } from "../store/auth";

export default function ChatWindow({ roomId, roomName, onInvite }) {
    const [client, setClient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [text, setText] = useState("");
    const [online, setOnline] = useState(0);
    const [typingUser, setTypingUser] = useState(null);
    const typingTimer = useRef(null);
    const scrollRef = useRef(null);
    const token = useAuth((s) => s.token);

    const fetchPage = async (p = 0) => {
        try {
            const { data } = await http.get(`/api/messages/${roomId}`, { params: { page: p, size: 30 } });
            const chunk = [...data.content].reverse();
            if (p === 0) setMessages(chunk); else setMessages(prev => [...chunk, ...prev]);
            setHasMore(!data.last);
            setPage(p);
            if (p === 0 && scrollRef.current) setTimeout(() => scrollRef.current.scrollTop = scrollRef.current.scrollHeight, 0);
        } catch { message.error("Load messages failed"); }
    };

    useEffect(() => { setMessages([]); setPage(0); setHasMore(true); fetchPage(0); }, [roomId]);

    useEffect(() => {
        const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8092";
        const c = new Client({
            webSocketFactory: () => new SockJS(base + "/ws"),
            reconnectDelay: 2000,
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
            onConnect: () => {
                c.subscribe(`/topic/rooms.${roomId}`, msg => {
                    const body = JSON.parse(msg.body);
                    setMessages(prev => [...prev, body]);
                    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                });
                c.subscribe(`/topic/presence.${roomId}`, msg => setOnline(JSON.parse(msg.body).online));
                c.subscribe(`/topic/typing.${roomId}`, msg => {
                    const p = JSON.parse(msg.body);
                    setTypingUser(p.typing ? p.userId : null);
                    if (p.typing) {
                        clearTimeout(typingTimer.current);
                        typingTimer.current = setTimeout(() => setTypingUser(null), 2000);
                    }
                });
            }
        });
        c.activate(); setClient(c);
        return () => { c.deactivate(); };
    }, [roomId, token]);

    const loadMore = () => fetchPage(page + 1);

    const send = () => {
        if (!client || !text.trim()) return;
        client.publish({ destination: `/app/rooms/${roomId}/send`, body: JSON.stringify({ content: text }) });
        setText("");
        client.publish({ destination: `/app/rooms/${roomId}/stopTyping`, body: "" });
        if (scrollRef.current) setTimeout(() => scrollRef.current.scrollTop = scrollRef.current.scrollHeight, 0);
    };

    const onTyping = () => {
        if (!client) return;
        client.publish({ destination: `/app/rooms/${roomId}/typing`, body: "" });
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => client.publish({ destination: `/app/rooms/${roomId}/stopTyping`, body: "" }), 900);
    };

    const deleteOwn = async (id) => {
        try {
            await http.post(`/api/messages/${id}/delete`);
            setMessages(prev => prev.map(m => m.id === id ? { ...m, deletedForUsers: true } : m));
        } catch { message.error("Delete failed"); }
    };

    return (
        <div className="chat-shell">
            <div className="chat-header">
                <div className="left">
                    <Space size="middle" align="center">
                        <Typography.Text style={{ color: "var(--text-strong)" }}>Online:</Typography.Text>
                        <Badge count={online} />
                        <Typography.Text style={{ color: "var(--text-muted)" }}>{typingUser ? "Someone is typing…" : ""}</Typography.Text>
                    </Space>
                </div>
                <div className="center">
                    <Typography.Text className="room-chip">{roomName || "—"}</Typography.Text>
                </div>
                <div className="right">
                    {onInvite ? <Button size="small" onClick={onInvite}>Invite</Button> : null}
                </div>
            </div>

            <div id="chat-scroll" ref={scrollRef} className="chat-messages">
                <InfiniteScroll
                    dataLength={messages.length}
                    next={loadMore}
                    inverse
                    hasMore={hasMore}
                    loader={<div className="bubble-meta" style={{ textAlign: "center" }}>Loading older…</div>}
                    scrollableTarget="chat-scroll"
                    style={{ overflow: "visible" }}
                    endMessage={<div className="bubble-meta" style={{ textAlign: "center" }}>No more messages</div>}
                >
                    <div className="messages-stack">
                        {messages.map(m => (
                            <div key={m.id} className="msg-row">
                                <div className={`bubble`}>
                                    <div className="bubble-meta">
                                        <b style={{ color: "var(--text-strong)" }}>{m.senderName || "Unknown"}</b>
                                        <span> • {new Date(m.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    <div className={`text ${m.deletedForUsers ? 'italic opacity-60' : ''}`}>{m.deletedForUsers ? "[deleted]" : m.content}</div>
                                    {!m.deletedForUsers && (
                                        <div className="mt-2" style={{ display: "flex", justifyContent: "flex-end" }}>
                                            <Button size="small" onClick={() => deleteOwn(m.id)}>Delete for users</Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </InfiniteScroll>
            </div>

            <div className="chat-composer">
                <div className="composer-inner">
                    <Input.TextArea value={text} onChange={e => setText(e.target.value)} autoSize={{ minRows: 1, maxRows: 4 }} onInput={onTyping} placeholder="Type a message…" />
                    <Button type="primary" size="large" onClick={send}>Send</Button>
                </div>
            </div>
        </div>
    );
}
