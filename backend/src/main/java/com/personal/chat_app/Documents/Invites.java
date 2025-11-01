package com.personal.chat_app.Documents;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.personal.chat_app.utils.Constants.Status;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("invites")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invites {

    @Id
    private String id;

    private String toUserId; // invited
    private String roomId; // invitedFor
    private String roomName; // invitedForName

    private String adminId; // invitedBy
    private String adminName; // invitedByName

    private Instant sentAt;
    private Instant updatedAt;
    private Status status;

}
