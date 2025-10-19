package com.personal.chat_app.security;

import java.security.Key;
import java.util.Date;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private final Key key;
    private final long expiryMilliSeconds;

    // Constructor Injection
    public JwtUtil(@Value("${jwt.secret}")String secret, @Value("${jwt.expirySeconds}")long expirySeconds) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expiryMilliSeconds = expirySeconds * 1000;
    }

    public String generateToken(String subject, Map<String, Object> claims) {
        return Jwts.builder()
                .setSubject(subject)
                .setClaims(claims)
                .setIssuedAt(new Date()).setExpiration(new Date(System.currentTimeMillis() + expiryMilliSeconds))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
    }

}
