package com.personal.chat_app.service;


import org.springframework.data.domain.Page;

import com.personal.chat_app.Documents.Messages;
import com.personal.chat_app.dto.MessageDto;

public interface IMessageService {

    Messages saveIncomingMessage(String roomId, String email, String content, String repyTo);

	Page<MessageDto> getPaginatedMessages(String roomId, int pageNo, int pageSize, boolean isAdmin);

    Void deleteMessage(String userEmail, String messageId);

}