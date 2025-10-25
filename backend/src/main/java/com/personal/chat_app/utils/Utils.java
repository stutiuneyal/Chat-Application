package com.personal.chat_app.utils;

import java.security.Principal;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.personal.chat_app.Documents.User;

@Component
public class Utils {

    public String getLoggedInUserEmail(Authentication authentication) {
        User loggedInUser = (User) authentication.getPrincipal();
        return loggedInUser.getEmail();
    }

}
