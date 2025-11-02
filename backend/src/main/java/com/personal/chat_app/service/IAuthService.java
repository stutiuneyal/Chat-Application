package com.personal.chat_app.service;

import java.util.List;

import com.personal.chat_app.Documents.User;

public interface IAuthService {

    String registerUser(String name, String email, String password, boolean isAdmin);

    String loginUser(String email, String password);

    List<User> searchUser(String query);

}
