package com.personal.chat_app.service;

import org.springframework.data.domain.Page;

import com.personal.chat_app.Documents.Messages;
import com.personal.chat_app.dto.DeleteMessageResultDto;
import com.personal.chat_app.dto.MessageDto;
import com.personal.chat_app.dto.SendMessageWsPayload;

public interface IMessageService {
    Messages saveIncomingMessage(String roomId, String email, SendMessageWsPayload payload);

    Page<MessageDto> getPaginatedMessages(String roomId, int pageNo, int pageSize, boolean isAdmin,
            String currentUserId);

    DeleteMessageResultDto deleteMessage(String userEmail, String messageId);

    MessageDto toggleReaction(String userEmail, String messageId, String emoji);

    MessageDto toDto(Messages message, String currentUserId);
}