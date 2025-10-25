package com.personal.chat_app.controller.ws;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import com.personal.chat_app.Repository.IUserRepository;

@Component
public class WsEventListener {

    @Autowired
    private PresenceService presenceService;

    @Autowired
    private IUserRepository userRepository;

    // sessionId -> userId
    private final Map<String, String> sessionUser = new ConcurrentHashMap<>();

    // (sessionId:roomId) ->m marker
    private final Map<String, Boolean> sessionRoom = new ConcurrentHashMap<>();

    @EventListener
    public void onConnect(SessionConnectEvent event) {
        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();

        if (principal != null) {
            String email = principal.getName();
            userRepository.findByEmail(email).ifPresent(u -> {
                String sessionId = accessor.getSessionId();
                if (sessionId != null) {
                    sessionUser.put(sessionId, u.getId());
                }
            });
        }
    }

    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {

        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();
        String sessionId = accessor.getSessionId();

        if (destination == null || sessionId == null) {
            return;
        }

        if (destination.startsWith("/topic/rooms.")) {
            String roomId = destination.substring("/topic/rooms.".length());
            String userId = sessionUser.get(sessionId);

            if (userId != null) {
                String key = sessionId + ":" + roomId;
                if (sessionRoom.putIfAbsent(key, true) == null) {
                    presenceService.userJoinedRoom(roomId, userId);
                }
            }
        }

    }

    @EventListener
    public void onUnsubscribe(SessionUnsubscribeEvent event) {

        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();
        String sessionId = accessor.getSessionId();

        if (destination == null || sessionId == null) {
            return;
        }

        if (destination.startsWith("/topic/rooms.")) {
            String roomId = destination.substring("/topic/rooms.".length());
            String userId = sessionUser.get(sessionId);

            if (userId != null) {
                String key = sessionId + ":" + roomId;
                if (sessionRoom.remove(key) != null) {
                    presenceService.userLeftRoom(roomId, userId);
                }
            }
        }

    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {

        String sessionId = event.getSessionId();
        String userId = sessionUser.remove(sessionId);

        if (userId == null) {
            return;
        }

        sessionRoom.keySet().removeIf(key -> {
            if (key.startsWith(sessionId + ":")) {
                String roomId = key.substring((sessionId + ":").length());
                presenceService.userLeftRoom(roomId, userId);
                return true;
            }
            return false;
        });

    }

}
