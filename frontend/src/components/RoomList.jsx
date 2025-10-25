import { Input, List, Tag, Button, message, Empty } from "antd";
import { useEffect, useState } from "react";
import http from "../api/http";

export default function RoomList({ onOpen, reloadKey = 0, selectedId }) {
    const [query, setQ] = useState("");
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);

    const search = async (q = query) => {
        try {
            setLoading(true);
            const { data } = await http.get("/api/rooms/search", {
                params: { query: q, adminScope: false },
            });

            // Robust DESC sort by createdAt (ISO string or timestamp)
            const sorted = [...(data || [])].sort((a, b) => {
                const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
                return tb - ta; // DESC
            });

            setRooms(sorted);
        } catch (e) {
            message.error("Search failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { search(); }, []);
    useEffect(() => { search(query); }, [reloadKey]);
    return (
        <div className="rooms-list" style={{ display: "grid", gap: 12 }}>
            {/* search stays here */}
            <Input.Search
                placeholder="Search rooms"
                allowClear
                value={query}
                onChange={(e) => setQ(e.target.value)}
                onSearch={search}
            />

            {rooms?.length ? (
                <List
                    dataSource={rooms}
                    loading={loading}
                    renderItem={(r) => {
                        const isSelected = r.id === selectedId;
                        return (
                            <List.Item style={{ background: "transparent", padding: 8 }}>
                                <div
                                    className={`room-row ${isSelected ? "selected" : ""}`}
                                    onClick={() => onOpen(r)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="room-title">{r.name}</div>
                                    <div className="room-meta">
                                        {r.isPrivate ? <Tag color="purple">Private</Tag> : <Tag color="green">Public</Tag>}
                                        <Button type="primary" size="small" onClick={(e) => { e.stopPropagation(); onOpen(r); }}>
                                            Open
                                        </Button>
                                    </div>
                                </div>
                            </List.Item>
                        );
                    }}
                />
            ) : (
                <Empty description="No rooms yet" />
            )}
        </div>
    );
}
