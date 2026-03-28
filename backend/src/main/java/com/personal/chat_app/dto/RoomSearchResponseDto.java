package com.personal.chat_app.dto;

import java.time.Instant;
import java.util.Set;

import com.personal.chat_app.Documents.RoomPermissions;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomSearchResponseDto {

    private String id;
    private String name;
    private boolean isPrivate;
    private Set<String> adminIds;
    private RoomPermissions roomPermissions;
    private Instant createdAt;

    private boolean isMember;
    private boolean isAdmin;

    private boolean invitePending;
    private String inviteId;
}