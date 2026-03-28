package com.personal.chat_app.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.personal.chat_app.dto.UploadedAttachmentDto;

public interface IChatAttachmentService {
    List<UploadedAttachmentDto> uploadFiles(String roomId, String userEmail, List<MultipartFile> files);
}