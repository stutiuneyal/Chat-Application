package com.personal.chat_app.Documents;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("members")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Members {

    @Id
    private String id;

    private String userId;
    private String roomId;

    private boolean isAdmin;

    private Instant joinedAt;

}
