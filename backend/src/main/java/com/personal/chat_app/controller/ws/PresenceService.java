package com.personal.chat_app.controller.ws;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.personal.chat_app.Documents.User;
import com.personal.chat_app.Repository.IUserRepository;

@Service
public class PresenceService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private IUserRepository userRepository;

    private final Map<String, Set<String>> onlineUsers = new ConcurrentHashMap<>();
    private final Set<String> typingUsers = ConcurrentHashMap.newKeySet();

    public void setTyping(String roomId, String email, boolean typing) {

        User user = userRepository.findByEmail(email).orElseThrow();

        String key = roomId + ":" + user.getName();

        if (typing) {
            typingUsers.add(key);
        } else {
            typingUsers.remove(key);
        }

        // broadcast it to the room
        messagingTemplate.convertAndSend("/topic/typing." + roomId,
                Map.of(
                        "typing", typing,
                        "userName", user.getName()));

    }

}
