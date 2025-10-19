package com.personal.chat_app.Documents;

import java.time.Instant;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("rooms")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Rooms {

    @Id
    private String id;

    private String name;
    private boolean isPrivate;
    private Set<String> adminIds; // userIds
    private RoomPermissions roomPermissions;
    private Instant createdAt;
    private String createdBy; // userId

}
