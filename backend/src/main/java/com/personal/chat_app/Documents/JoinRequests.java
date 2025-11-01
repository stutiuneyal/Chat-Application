package com.personal.chat_app.Documents;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.personal.chat_app.utils.Constants.Status;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("join-requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinRequests {

    @Id
    private String id;

    private String raisedbyUserId; // user
    private String raisedbyUserName; // userName
    private String roomId; // for room

    private Instant raisedAt;
    private Instant updatedAt;
    private Status status;

    private String approvedByAdminId; // adminId
    private String approvedByAdminName; // adminName

}
