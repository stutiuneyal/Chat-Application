package com.personal.chat_app.controller.web;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.personal.chat_app.service.IAuthService;



@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private IAuthService authService;

    @RequestMapping(value = "/register", method = RequestMethod.POST)
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> request) {
        String token = authService.registerUser(request.get("name"), request.get("email"), request.get("password"),
                Boolean.parseBoolean(request.getOrDefault("admin", "false")));
        return ResponseEntity.ok(Map.of("token", token));
    }

    @RequestMapping(value = "/login", method = RequestMethod.POST)
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> request) {
        String token = authService.loginUser(request.get("email"), request.get("password"));
        return ResponseEntity.ok(Map.of("token", token));
    }

}
