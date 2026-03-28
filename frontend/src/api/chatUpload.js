import http from "./http";

export async function uploadChatFiles(roomId, files) {
    const formData = new FormData();
    formData.append("roomId", roomId);

    files.forEach((file) => {
        formData.append("files", file);
    });

    const { data } = await http.post("/api/chat-attachments/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return data;
}