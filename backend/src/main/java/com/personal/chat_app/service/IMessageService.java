package com.personal.chat_app.service;

import com.personal.chat_app.Documents.Messages;

public interface IMessageService {

    Messages saveIncomingMessage(String roomId, String email, String content, String repyTo);

}