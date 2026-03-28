package com.personal.chat_app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadedAttachmentDto {
    private String fileName;
    private String url;
    private String contentType;
    private Long size;
    private String storagePath;
}