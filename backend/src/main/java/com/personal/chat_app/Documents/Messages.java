package com.personal.chat_app.Documents;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

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

    private String contentText;
    private String contentHtml;
    private String contentJson;

    private String replyToMessageId;
    private boolean deletedForUser;

    private boolean edited;
    private Instant editedAt;

    @Builder.Default
    private List<MessageReaction> reactions = new ArrayList<>();

    @Builder.Default
    private List<MessageAttachment> attachments = new ArrayList<>();

    private Instant createdAt;
}