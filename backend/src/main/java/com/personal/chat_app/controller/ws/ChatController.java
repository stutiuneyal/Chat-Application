package com.personal.chat_app.controller.ws;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.personal.chat_app.Documents.Messages;
import com.personal.chat_app.Documents.User;
import com.personal.chat_app.Repository.IUserRepository;
import com.personal.chat_app.dto.MessageDto;
import com.personal.chat_app.dto.ReactionWsPayload;
import com.personal.chat_app.dto.SendMessageWsPayload;
import com.personal.chat_app.service.IMessageService;
import com.personal.chat_app.utils.Utils;

@Controller
public class ChatController {

    @Autowired
    private IMessageService messageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private PresenceService presenceService;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private Utils utils;

    @MessageMapping("/rooms/{roomId}/send")
    public void sendMessage(
            @DestinationVariable("roomId") String roomId,
            @Payload SendMessageWsPayload payload,
            Principal principal) {
        String email = principal != null ? principal.getName() : "";

        Messages saved = messageService.saveIncomingMessage(roomId, email, payload);
        User sender = userRepository.findByEmail(email).orElseThrow();

        MessageDto dto = messageService.toDto(saved, sender.getId());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("type", "MESSAGE_CREATED");
        out.put("message", dto);

        messagingTemplate.convertAndSend("/topic/rooms." + roomId, out);
    }

    @MessageMapping("/rooms/{roomId}/react")
    public void reactToMessage(
            @DestinationVariable("roomId") String roomId,
            @Payload ReactionWsPayload payload,
            Principal principal) {
        String email = principal != null ? principal.getName() : "";
        MessageDto dto = messageService.toggleReaction(email, payload.getMessageId(), payload.getEmoji());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("type", "MESSAGE_REACTION_UPDATED");
        out.put("messageId", payload.getMessageId());
        out.put("reactions", dto.getReactions());

        messagingTemplate.convertAndSend("/topic/rooms." + roomId, out);
    }

    @MessageMapping("/room/{roomId}/typing")
    public void typing(
            @DestinationVariable("roomId") String roomId,
            Principal principal) {
        String email = principal != null ? principal.getName() : "";
        if (!email.isBlank()) {
            presenceService.setTyping(roomId, email, true);
        }
    }

    @MessageMapping("/room/{roomId}/stopTyping")
    public void stopTyping(
            @DestinationVariable("roomId") String roomId,
            Principal principal) {
        String email = principal != null ? principal.getName() : "";
        if (!email.isBlank()) {
            presenceService.setTyping(roomId, email, false);
        }
    }
}