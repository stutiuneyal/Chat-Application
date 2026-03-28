package com.personal.chat_app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteMessageResultDto {
    private String messageId;
    private String roomId;
    private boolean deletedForUser;
}