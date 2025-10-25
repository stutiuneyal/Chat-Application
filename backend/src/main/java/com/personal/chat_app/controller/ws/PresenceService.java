package com.personal.chat_app.controller.ws;

import java.util.Collections;
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
                        "userId", user.getId(),
                        "userName", user.getName()));

    }

    public void userJoinedRoom(String roomId, String userId) {
        onlineUsers.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(userId);
        broadcastPresence(roomId);
    }

    public void userLeftRoom(String roomId, String userId) {
        Set<String> set = onlineUsers.getOrDefault(userId, Collections.emptySet());
        set.remove(userId);
        broadcastPresence(roomId);
    }

    private void broadcastPresence(String roomId) {
        messagingTemplate.convertAndSend("/topic/presence." + roomId, Map.of(
                "online", onlineCount(roomId)));
    }

    private int onlineCount(String roomId) {
        return onlineUsers.getOrDefault(roomId, Set.of()).size();
    }

}
