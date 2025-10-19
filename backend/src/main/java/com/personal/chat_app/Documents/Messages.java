package com.personal.chat_app.Documents;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Messages {

    @Id
    private String id;

    private String senderId;
    private String roomId;

    private String content;

    private String replyToMessageId; // optional -> if this message is a reply to another message
    private boolean deletedForUser;

    private Instant createdAt;
}
