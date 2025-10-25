package com.personal.chat_app.service.impl;

import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.personal.chat_app.Documents.User;
import com.personal.chat_app.Repository.IUserRepository;
import com.personal.chat_app.security.JwtUtil;
import com.personal.chat_app.service.IAuthService;
import com.personal.chat_app.utils.Constants.Roles;

@Service
public class AuthServiceImpl implements IAuthService {

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Override
    public String registerUser(String name, String email, String password, boolean isAdmin) {

        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email exists");
        }

        User user = User.builder()
                .name(name)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .roles(isAdmin ? Set.of(Roles.ADMIN, Roles.USER) : Set.of(Roles.USER))
                .active(true)
                .build();

        userRepository.save(user);

        return jwtUtil.generateToken(email,
                Map.of("roles", user.getRoles(), "name", user.getName(), "id", user.getId()));

    }

    @Override
    public String loginUser(String email, String password) {
        System.out.println(email+" "+password);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid Email, please register"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid Password");
        }

        return jwtUtil.generateToken(email,
                Map.of("roles", user.getRoles(), "name", user.getName(), "id", user.getId()));
    }

}
