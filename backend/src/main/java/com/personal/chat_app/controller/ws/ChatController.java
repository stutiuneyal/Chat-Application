package com.personal.chat_app.controller.ws;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.personal.chat_app.Documents.Messages;
import com.personal.chat_app.service.IMessageService;

@Controller
public class ChatController {

    @Autowired
    private IMessageService messageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private PresenceService presenceService;

    @MessageMapping("/rooms/{roomId}/send")
    public void sendMessage(@DestinationVariable("roomId") String roomId, @Payload Map<String, String> payload,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";

        Messages saved = messageService.saveIncomingMessage(roomId, email, payload.get("content"),
                payload.get("replyTo"));

        // broadcast the message to the room
        messagingTemplate.convertAndSend("/topic/rooms." + roomId, Map.of(
                "id", saved.getId(),
                "roomId", roomId,
                "senderId", saved.getSenderId(),
                "content", saved.getContent(),
                "replyToMessageId", saved.getReplyToMessageId(),
                "deletedForUser", saved.isDeletedForUser(),
                "createdAt", saved.getCreatedAt().toString()));
    }

    @MessageMapping("/room/{roomId}/typing")
    public void typing(@DestinationVariable("roomId") String roomId, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        presenceService.setTyping(roomId, email, true);
    }

    @MessageMapping("/room/{roomId}/stopTyping")
    public void stopTyping(@DestinationVariable("roomId") String roomId, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "";
        presenceService.setTyping(roomId, email, false);
    }

}
