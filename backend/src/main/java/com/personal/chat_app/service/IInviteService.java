package com.personal.chat_app.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.personal.chat_app.Documents.Invites;

public interface IInviteService {
    void sendInvite(String adminEmail, String roomId, String userId);

    List<Invites> getMyPendingInvites(String userEmail);

    void acceptInvite(String userEmail, String inviteId);

    void declineInvite(String userEmail, String inviteId);
}
