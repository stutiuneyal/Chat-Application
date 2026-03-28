package com.personal.chat_app.dto;

import java.util.List;

import com.personal.chat_app.Documents.MessageAttachment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageWsPayload {
    private String contentText;
    private String contentHtml;
    private String contentJson;
    private String replyToMessageId;
    private List<MessageAttachment> attachments;
}