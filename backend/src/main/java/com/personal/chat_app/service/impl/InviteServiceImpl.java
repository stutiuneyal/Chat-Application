package com.personal.chat_app.service.impl;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.personal.chat_app.Documents.Invites;
import com.personal.chat_app.Documents.Members;
import com.personal.chat_app.Documents.Rooms;
import com.personal.chat_app.Documents.User;
import com.personal.chat_app.Repository.IInvitesRepository;
import com.personal.chat_app.Repository.IMembersRepository;
import com.personal.chat_app.Repository.IRoomRepository;
import com.personal.chat_app.Repository.IUserRepository;
import com.personal.chat_app.service.IInviteService;
import com.personal.chat_app.utils.Constants.Status;

@Service
public class InviteServiceImpl implements IInviteService {

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IRoomRepository roomRepository;

    @Autowired
    private IMembersRepository membersRepository;

    @Autowired
    private IInvitesRepository invitesRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public void sendInvite(String adminEmail, String roomId, String userId) {
        User admin = userRepository.findByEmail(adminEmail).orElseThrow();
        User targetUser = userRepository.findById(userId).orElseThrow();
        Rooms room = roomRepository.findById(roomId).orElseThrow();

        boolean isAdmin = room.getAdminIds() != null && room.getAdminIds().contains(admin.getId());
        if (!isAdmin) {
            throw new RuntimeException("Only room admin can invite users");
        }

        boolean alreadyMember = membersRepository.existsByRoomIdAndUserId(roomId, userId);
        if (alreadyMember) {
            throw new RuntimeException("User is already a member of this room");
        }

        boolean pendingInviteExists = invitesRepository.existsByRoomIdAndToUserIdAndStatus(
                roomId, userId, Status.PENDING);

        if (pendingInviteExists) {
            throw new RuntimeException("Invite already sent");
        }

        Invites invite = invitesRepository.save(
                Invites.builder()
                        .toUserId(userId)
                        .roomId(roomId)
                        .roomName(room.getName())
                        .adminId(admin.getId())
                        .adminName(admin.getName())
                        .sentAt(Instant.now())
                        .updatedAt(Instant.now())
                        .status(Status.PENDING)
                        .build()
        );

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "ROOM_INVITE_RECEIVED");
        payload.put("inviteId", invite.getId());
        payload.put("roomId", invite.getRoomId());
        payload.put("roomName", invite.getRoomName());
        payload.put("adminId", invite.getAdminId());
        payload.put("adminName", invite.getAdminName());
        payload.put("sentAt", invite.getSentAt());
        payload.put("status", invite.getStatus());

        messagingTemplate.convertAndSendToUser(
                targetUser.getEmail(),
                "/queue/invites",
                payload
        );
    }

    @Override
    public List<Invites> getMyPendingInvites(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        return invitesRepository.findByToUserIdAndStatusOrderBySentAtDesc(user.getId(), Status.PENDING);
    }

    @Override
    public void acceptInvite(String userEmail, String inviteId) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Invites invite = invitesRepository.findByIdAndToUserId(inviteId, user.getId()).orElseThrow();

        if (invite.getStatus() != Status.PENDING) {
            throw new RuntimeException("Invite is no longer pending");
        }

        boolean alreadyMember = membersRepository.existsByRoomIdAndUserId(invite.getRoomId(), user.getId());
        if (!alreadyMember) {
            membersRepository.save(
                    Members.builder()
                            .roomId(invite.getRoomId())
                            .userId(user.getId())
                            .isAdmin(false)
                            .joinedAt(Instant.now())
                            .build()
            );
        }

        invite.setStatus(Status.ACCEPTED);
        invite.setUpdatedAt(Instant.now());
        invitesRepository.save(invite);
    }

    @Override
    public void declineInvite(String userEmail, String inviteId) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Invites invite = invitesRepository.findByIdAndToUserId(inviteId, user.getId()).orElseThrow();

        if (invite.getStatus() != Status.PENDING) {
            throw new RuntimeException("Invite is no longer pending");
        }

        invite.setStatus(Status.REJECTED);
        invite.setUpdatedAt(Instant.now());
        invitesRepository.save(invite);
    }
}