package com.personal.chat_app.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    private String id;
    private String roomId;
    private String senderId;
    private String senderName;
    private String content;
    private String replyToMessageId;
    private boolean deletedForUsers;
    private Instant createdAt;
}
