import { useEffect, useState } from "react";
import { List, Input, Button, Tag, Empty, Tooltip } from "antd";
import { LockOutlined } from "@ant-design/icons";
import http from "../api/http";

export default function RoomList({ onOpen, onRequestJoin, reloadKey = 0, selectedId }) {
    const [rooms, setRooms] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const fetchRooms = async (query = "") => {
        try {
            setLoading(true);
            const { data } = await http.get("/api/rooms/search", { params: { query } });
            // sort descending by createdAt
            const sorted = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setRooms(sorted);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchRooms(); }, []);
    useEffect(() => { fetchRooms(q); }, [reloadKey]);
    const onSearch = (val) => fetchRooms(val.trim());
    return (
        <div className="rooms-list" style={{ display: "grid", gap: 12 }}>
            <Input.Search placeholder="Search rooms" allowClear value={q} onChange={(e) => setQ(e.target.value)} onSearch={onSearch} />
            {rooms?.length ? (
                <List
                    dataSource={rooms}
                    loading={loading}
                    renderItem={(r) => {
                        const isSelected = r.id === selectedId;
                        const canOpen = r.isMember || !r.isPrivate;
                        return (
                            <List.Item style={{ background: "transparent", padding: 8 }}>
                                <div
                                    className={`room-row ${isSelected ? "selected" : ""}`}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => (canOpen ? onOpen(r) : onRequestJoin && onRequestJoin(r))}
                                >
                                    <div className="room-title" title={r.name}>{r.name}</div>
                                    <div className="room-meta">
                                        {r.isPrivate ? (
                                            <Tooltip title={r.isMember ? "Private (member)" : "Private"}>
                                                <Tag color="purple" icon={<LockOutlined />}>Private</Tag>
                                            </Tooltip>
                                        ) : (
                                            <Tag color="green">Public</Tag>
                                        )}
                                        <Button
                                            type="primary"
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); canOpen ? onOpen(r) : onRequestJoin && onRequestJoin(r); }}
                                        >
                                            {canOpen ? "Open" : "Request"}
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
