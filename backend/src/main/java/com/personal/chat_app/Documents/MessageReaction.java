package com.personal.chat_app.Documents;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageReaction {
    private String userId;
    private String emoji;
    private Instant reactedAt;
}
