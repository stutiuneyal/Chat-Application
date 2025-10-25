package com.personal.chat_app.config;

import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.personal.chat_app.Repository.IUserRepository;
import com.personal.chat_app.security.JwtUtil;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;

@Configuration
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final String WS_USER_KEY = "WS_PRINCIPAL";

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private IUserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        System.out.println("WS preSend: " + accessor.getCommand()
                + " session=" + accessor.getSessionId()
                + " user=" + accessor.getUser());

        boolean mutated = false;
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String auth = accessor.getFirstNativeHeader("Authorization");
            if (auth != null && auth.startsWith("Bearer ")) {
                try {
                    Jws<Claims> jws = jwtUtil.parseToken(auth.substring(7));
                    String email = jws.getBody().getSubject();

                    // verify if user is still active
                    userRepository.findByEmail(email).ifPresent(u -> {
                        var authorities = u.getRoles().stream()
                                .map(role -> new SimpleGrantedAuthority(role.name()))
                                .toList();
                        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                                email, null, authorities);
                        accessor.setUser(authenticationToken);

                        // persist the user on further frames
                        accessor.getSessionAttributes().put(WS_USER_KEY, authenticationToken);
                        accessor.setHeader(SimpMessageHeaderAccessor.USER_HEADER, authenticationToken);

                        System.out.println("WS CONNECT user = " + accessor.getUser());
                    });
                    mutated = true;
                } catch (Exception ignored) {
                }
            }
        } else {
            if (accessor.getUser() == null) {
                Object saved = accessor.getSessionAttributes() != null
                        ? accessor.getSessionAttributes().get(WS_USER_KEY)
                        : null;

                if (saved instanceof Principal p) {
                    accessor.setUser(p);
                    accessor.setHeader(SimpMessageHeaderAccessor.USER_HEADER, p);
                    System.out.println("WS rehydrated user from session = " + p.getName());
                    mutated = true;
                }
            }
        }

        if (mutated) {
            accessor.setLeaveMutable(true);
            return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
        }
        return message;
    }

}
