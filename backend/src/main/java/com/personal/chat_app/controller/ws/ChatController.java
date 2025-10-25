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
    public void sendMessage(@DestinationVariable("roomId") String roomId, @Payload Map<String, String> payload,
            Principal principal) {
        String email = principal != null ? principal.getName() : "";

        Messages saved = messageService.saveIncomingMessage(roomId, email, payload.get("content"),
                payload.get("replyTo"));

        User sender = userRepository.findById(saved.getSenderId()).orElse(null);
        String senderName = sender != null ? (sender.getName() != null ? sender.getName() : sender.getEmail())
                : "Unknown";

        // broadcast the message to the room
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", saved.getId());
        out.put("roomId", roomId);
        out.put("senderId", saved.getSenderId());
        out.put("senderName", senderName);
        out.put("content", saved.getContent());
        out.put("deletedForUser", saved.isDeletedForUser());
        out.put("createdAt", saved.getCreatedAt().toString());

        if (saved.getReplyToMessageId() != null) {
            out.put("replyToMessageId", saved.getReplyToMessageId());
        }

        messagingTemplate.convertAndSend("/topic/rooms." + roomId, out);
    }

    @MessageMapping("/room/{roomId}/typing")
    public void typing(@DestinationVariable("roomId") String roomId, Authentication authentication) {
        String email = authentication != null ? utils.getLoggedInUserEmail(authentication) : "";
        presenceService.setTyping(roomId, email, true);
    }

    @MessageMapping("/room/{roomId}/stopTyping")
    public void stopTyping(@DestinationVariable("roomId") String roomId, Authentication authentication) {
        String email = authentication != null ? utils.getLoggedInUserEmail(authentication) : "";
        presenceService.setTyping(roomId, email, false);
    }

}
