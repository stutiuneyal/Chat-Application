package com.personal.chat_app.service.impl;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.personal.chat_app.Documents.MessageReaction;
import com.personal.chat_app.Documents.Messages;
import com.personal.chat_app.Documents.User;
import com.personal.chat_app.Repository.IMembersRepository;
import com.personal.chat_app.Repository.IMessageRepository;
import com.personal.chat_app.Repository.IRoomRepository;
import com.personal.chat_app.Repository.IUserRepository;
import com.personal.chat_app.dto.DeleteMessageResultDto;
import com.personal.chat_app.dto.MessageDto;
import com.personal.chat_app.dto.ReactionDto;
import com.personal.chat_app.dto.ReactionUserDto;
import com.personal.chat_app.dto.ReplyPreviewDto;
import com.personal.chat_app.dto.SendMessageWsPayload;
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
    public Messages saveIncomingMessage(String roomId, String email, SendMessageWsPayload payload) {
        User sender = userRepository.findByEmail(email).orElseThrow();

        if (!membersRepository.existsByRoomIdAndUserId(roomId, sender.getId())) {
            throw new RuntimeException("Not a member");
        }

        Messages message = Messages.builder()
                .senderId(sender.getId())
                .roomId(roomId)
                .contentText(payload.getContentText())
                .contentHtml(payload.getContentHtml())
                .contentJson(payload.getContentJson())
                .replyToMessageId(payload.getReplyToMessageId())
                .attachments(payload.getAttachments() != null ? payload.getAttachments() : new ArrayList<>())
                .deletedForUser(false)
                .edited(false)
                .createdAt(Instant.now())
                .reactions(new ArrayList<>())
                .build();

        return messageRepository.save(message);
    }

    @Override
    public Page<MessageDto> getPaginatedMessages(String roomId, int pageNo, int pageSize, boolean isAdmin,
            String currentUserId) {
        Page<Messages> messages = messageRepository.findByRoomIdOrderByCreatedAtDesc(
                roomId,
                PageRequest.of(pageNo, pageSize));

        if (!isAdmin) {
            List<Messages> filteredMessages = messages.stream()
                    .filter(message -> !message.isDeletedForUser())
                    .collect(Collectors.toList());

            messages = new PageImpl<>(filteredMessages, messages.getPageable(), filteredMessages.size());
        }

        List<MessageDto> mapped = messages.getContent().stream()
                .map(message -> toDto(message, currentUserId))
                .collect(Collectors.toList());

        return new PageImpl<>(mapped, messages.getPageable(), messages.getTotalElements());
    }

    @Override
    public DeleteMessageResultDto deleteMessage(String loggedInUserEmail, String messageId) {
        Messages msg = messageRepository.findById(messageId).orElseThrow();

        // your existing permission checks + delete logic here

        msg.setDeletedForUser(true);
        msg.setContentText("");
        msg.setContentHtml("");
        msg.setAttachments(Collections.emptyList());

        messageRepository.save(msg);

        return DeleteMessageResultDto.builder()
                .messageId(msg.getId())
                .roomId(msg.getRoomId())
                .deletedForUser(true)
                .build();
    }

    @Override
    public MessageDto toggleReaction(String userEmail, String messageId, String emoji) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Messages message = messageRepository.findById(messageId).orElseThrow();

        List<MessageReaction> reactions = message.getReactions() != null
                ? message.getReactions()
                : new ArrayList<>();

        MessageReaction existing = reactions.stream()
                .filter(reaction -> user.getId().equals(reaction.getUserId()))
                .findFirst()
                .orElse(null);

        if (existing == null) {
            reactions.add(
                    MessageReaction.builder()
                            .userId(user.getId())
                            .emoji(emoji)
                            .reactedAt(Instant.now())
                            .build());
        } else if (existing.getEmoji().equals(emoji)) {
            reactions.remove(existing);
        } else {
            existing.setEmoji(emoji);
            existing.setReactedAt(Instant.now());
        }

        message.setReactions(reactions);
        Messages saved = messageRepository.save(message);
        return toDto(saved, user.getId());
    }

    @Override
    public MessageDto toDto(Messages message, String currentUserId) {
        User sender = userRepository.findById(message.getSenderId()).orElse(null);
        String senderName = sender != null
                ? (sender.getName() != null ? sender.getName() : sender.getEmail())
                : "Unknown";

        ReplyPreviewDto replyPreview = null;
        if (message.getReplyToMessageId() != null) {
            Messages replyTo = messageRepository.findById(message.getReplyToMessageId()).orElse(null);
            if (replyTo != null) {
                User replySender = userRepository.findById(replyTo.getSenderId()).orElse(null);
                String replySenderName = replySender != null
                        ? (replySender.getName() != null ? replySender.getName() : replySender.getEmail())
                        : "Unknown";

                replyPreview = ReplyPreviewDto.builder()
                        .messageId(replyTo.getId())
                        .senderName(replySenderName)
                        .contentText(replyTo.getContentText())
                        .build();
            }
        }

        Map<String, Integer> counts = new LinkedHashMap<>();
        Map<String, List<ReactionUserDto>> reactedUsersByEmoji = new LinkedHashMap<>();
        String myEmoji = null;

        if (message.getReactions() != null) {
            for (MessageReaction reaction : message.getReactions()) {
                String emoji = reaction.getEmoji();
                counts.put(emoji, counts.getOrDefault(emoji, 0) + 1);

                User reactedUser = userRepository.findById(reaction.getUserId()).orElse(null);
                String reactedUserName = reactedUser != null
                        ? (reactedUser.getName() != null ? reactedUser.getName() : reactedUser.getEmail())
                        : "Unknown";

                reactedUsersByEmoji
                        .computeIfAbsent(emoji, key -> new ArrayList<>())
                        .add(ReactionUserDto.builder()
                                .id(reaction.getUserId())
                                .name(reactedUserName)
                                .email(reactedUser != null ? reactedUser.getEmail() : null)
                                .build());

                if (currentUserId != null && currentUserId.equals(reaction.getUserId())) {
                    myEmoji = emoji;
                }
            }
        }

        final String finalMyEmoji = myEmoji;

        List<ReactionDto> reactionDtos = counts.entrySet().stream()
                .map(entry -> ReactionDto.builder()
                        .emoji(entry.getKey())
                        .count(entry.getValue())
                        .reactedByMe(entry.getKey().equals(finalMyEmoji))
                        .reactedUsers(reactedUsersByEmoji.getOrDefault(entry.getKey(), Collections.emptyList()))
                        .build())
                .collect(Collectors.toList());

        return MessageDto.builder()
                .id(message.getId())
                .roomId(message.getRoomId())
                .senderId(message.getSenderId())
                .senderName(senderName)
                .contentText(message.getContentText())
                .contentHtml(message.getContentHtml())
                .contentJson(message.getContentJson())
                .replyToMessageId(message.getReplyToMessageId())
                .replyPreview(replyPreview)
                .deletedForUser(message.isDeletedForUser())
                .edited(message.isEdited())
                .editedAt(message.getEditedAt())
                .reactions(reactionDtos)
                .attachments(message.getAttachments())
                .createdAt(message.getCreatedAt())
                .build();
    }
}