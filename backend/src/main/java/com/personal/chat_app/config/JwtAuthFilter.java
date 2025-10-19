package com.personal.chat_app.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.personal.chat_app.Documents.User;
import com.personal.chat_app.Repository.IUserRepository;
import com.personal.chat_app.security.JwtUtil;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import jakarta.servlet.FilterChain;
import jakarta.servlet.GenericFilter;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class JwtAuthFilter extends GenericFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private IUserRepository userRepository;

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest http = (HttpServletRequest) req;

        String header = http.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            try {
                Jws<Claims> jws = jwtUtil.parseToken(header.substring(7));
                String email = jws.getBody().getSubject();
                User u = userRepository.findByEmail(email).orElse(null);
                if (u != null && u.isActive()) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            new org.springframework.security.core.userdetails.User(u.getEmail(), u.getPasswordHash(), u
                                    .getRoles().stream()
                                    .map(r -> new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                            "ROLE_" + r))
                                    .toList()),
                            null,
                            u.getRoles().stream()
                                    .map(r -> new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                            "ROLE_" + r))
                                    .toList());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception ignored) {
            }

            chain.doFilter(req, res);
        }

    }

}
