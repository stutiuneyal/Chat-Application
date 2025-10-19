package com.personal.chat_app.service.impl;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.personal.chat_app.Documents.Messages;
import com.personal.chat_app.Documents.User;
import com.personal.chat_app.Repository.IMembersRepository;
import com.personal.chat_app.Repository.IMessageRepository;
import com.personal.chat_app.Repository.IRoomRepository;
import com.personal.chat_app.Repository.IUserRepository;
import com.personal.chat_app.service.IMessageService;

@Service
public class MessageServiceImpl implements IMessageService {

    @Autowired
    private IMessageRepository messageRepository;
    @Autowired
    private IUserRepository userRepository;
    @Autowired
    private IMembersRepository membersRepository;
    @Autowired
    private IRoomRepository roomRepository;

    @Override
    public Messages saveIncomingMessage(String roomId, String email, String content, String repyTo) {

        User sender = userRepository.findByEmail(email).orElseThrow();

        if (!membersRepository.existsByRoomIdAndUserId(roomId, sender.getId())) {
            throw new RuntimeException("Not a member");
        }

        Messages message = Messages.builder()
                .senderId(sender.getId())
                .roomId(roomId)
                .content(content)
                .replyToMessageId(repyTo)
                .deletedForUser(false)
                .createdAt(Instant.now())
                .build();

        return messageRepository.save(message);

    }

}
