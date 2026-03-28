package com.personal.chat_app.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionDto {
    private String emoji;
    private int count;
    private boolean reactedByMe;
    private List<ReactionUserDto> reactedUsers;
}