package com.personal.chat_app.controller.web;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.multipart.MultipartFile;

import com.personal.chat_app.service.IChatAttachmentService;
import com.personal.chat_app.utils.Utils;

@RestController
@RequestMapping("/api/chat-attachments")
public class ChatAttachmentController {

    @Autowired
    private IChatAttachmentService chatAttachmentService;

    @Autowired
    private Utils utils;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            Authentication authentication,
            @RequestParam("roomId") String roomId,
            @RequestParam("files") List<MultipartFile> files) {
        String email = utils.getLoggedInUserEmail(authentication);
        return ResponseEntity.ok(
                chatAttachmentService.uploadFiles(roomId, email, files));
    }
}