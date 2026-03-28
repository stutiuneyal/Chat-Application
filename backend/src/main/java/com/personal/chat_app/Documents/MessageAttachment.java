package com.personal.chat_app.Documents;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageAttachment {
    private String fileName;
    private String url;
    private String contentType;
    private Long size;
    private String storagePath;
}