package com.personal.chat_app.service.impl;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.util.Streamable;
import org.springframework.stereotype.Service;

import com.personal.chat_app.Documents.Messages;
import com.personal.chat_app.Documents.User;
import com.personal.chat_app.Repository.IMembersRepository;
import com.personal.chat_app.Repository.IMessageRepository;
import com.personal.chat_app.Repository.IRoomRepository;
import com.personal.chat_app.Repository.IUserRepository;
import com.personal.chat_app.dto.MessageDto;
import com.personal.chat_app.service.IMessageService;
import com.personal.chat_app.utils.Constants.Roles;

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

    @Override
    public Page<MessageDto> getPaginatedMessages(String roomId, int pageNo, int pageSize, boolean isAdmin) {

        Page<Messages> messages = messageRepository.findByRoomIdOrderByCreatedAtDesc(roomId,
                PageRequest.of(pageNo, pageSize));

        if (!isAdmin) {
            List<Messages> filteredMessages = messages.stream()
                    .filter(message -> !message.isDeletedForUser())
                    .collect(Collectors.toList());

            messages = new PageImpl<>(filteredMessages, messages.getPageable(), filteredMessages.size());
        }

        Page<MessageDto> mapped = messages.map(m -> {
            User sender = userRepository.findById(m.getSenderId()).orElse(null);
            String name = sender != null ? (sender.getName() != null ? sender.getName() : sender.getEmail())
                    : "Unknown";

            return MessageDto.builder()
                    .id(m.getId())
                    .roomId(m.getRoomId())
                    .senderId(m.getSenderId())
                    .senderName(name)
                    .content(m.getContent())
                    .replyToMessageId(m.getReplyToMessageId())
                    .deletedForUsers(m.isDeletedForUser())
                    .createdAt(m.getCreatedAt())
                    .build();
        });

        return new PageImpl<>(mapped.getContent(), messages.getPageable(), messages.getTotalElements());

    }

    // we will soft delete the messages
    @Override
    public Void deleteMessage(String userEmail, String messageId) {

        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Messages message = messageRepository.findById(messageId).orElseThrow();

        boolean isAdmin = user.getRoles() != null && user.getRoles().contains(Roles.ADMIN);

        // if it is not a sender or an admin
        if (!message.getSenderId().equals(user.getId()) && !isAdmin) {
            throw new RuntimeException("Can delete only own message, or the user is not an admin");
        }

        message.setDeletedForUser(true);
        messageRepository.save(message);

        return null;

    }

}
