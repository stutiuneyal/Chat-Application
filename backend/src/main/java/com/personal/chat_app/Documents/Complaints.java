package com.personal.chat_app.Documents;

import java.time.Instant;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.personal.chat_app.utils.Constants.ReviewStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document("complaints")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Complaints {

    @Id
    private String id;

    private String roomId;
    private String raisedByUserId;
    private Set<String> againstUserIds;
    private String description;
    private ReviewStatus status;
    private Instant createdAt;
    private Instant resolvedAt;
    private String resolvedByAdminId;
    private String resolutionNote;

}