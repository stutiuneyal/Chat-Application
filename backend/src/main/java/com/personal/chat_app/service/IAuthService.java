package com.personal.chat_app.service;

public interface IAuthService {

    String registerUser(String name, String email, String password, boolean isAdmin);

    String loginUser(String email, String password);

}
