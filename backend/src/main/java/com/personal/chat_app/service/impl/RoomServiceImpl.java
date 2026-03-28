package com.personal.chat_app.service.impl;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.personal.chat_app.Documents.Invites;
import com.personal.chat_app.Documents.JoinRequests;
import com.personal.chat_app.Documents.Members;
import com.personal.chat_app.Documents.RoomPermissions;
import com.personal.chat_app.Documents.Rooms;
import com.personal.chat_app.Documents.User;
import com.personal.chat_app.Repository.IInvitesRepository;
import com.personal.chat_app.Repository.IJoinRequestsRepository;
import com.personal.chat_app.Repository.IMembersRepository;
import com.personal.chat_app.Repository.IRoomRepository;
import com.personal.chat_app.Repository.IUserRepository;
import com.personal.chat_app.dto.RoomSearchResponseDto;
import com.personal.chat_app.service.IRoomService;
import com.personal.chat_app.utils.Constants.Roles;
import com.personal.chat_app.utils.Constants.Status;

@Service
public class RoomServiceImpl implements IRoomService {

    @Autowired
    private IRoomRepository roomRepository;

    @Autowired
    private IMembersRepository membersRepository;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private IInvitesRepository invitesRepository;

    @Autowired
    private IJoinRequestsRepository joinRequestsRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public Rooms createRoom(String creatorEmail, String name, boolean isPrivate, RoomPermissions roomPermissions) {

        User creator = userRepository.findByEmail(creatorEmail).orElseThrow();

        Rooms room = Rooms.builder()
                .name(name)
                .isPrivate(isPrivate)
                .adminIds(new HashSet<>(List.of(creator.getId())))
                .roomPermissions(
                        roomPermissions != null ? roomPermissions : new RoomPermissions(true, true, true, true))
                .createdAt(Instant.now())
                .createdBy(creator.getId())
                .build();

        roomRepository.save(room);

        // room-creator will join the room
        membersRepository.save(Members.builder()
                .roomId(room.getId())
                .userId(creator.getId())
                .isAdmin(true)
                .joinedAt(Instant.now())
                .build());

        return room;

    }

    @Override
    public Void addUserToRoom(String adminEmail, String roomId, String userEmail, boolean isAdmin) {

        User admin = userRepository.findByEmail(adminEmail).orElseThrow();
        Rooms room = roomRepository.findById(roomId).orElseThrow();

        // check if admin is the room's admin
        if (!room.getAdminIds().contains(admin.getId())) {
            throw new RuntimeException("Not a room admin");
        }

        User user = userRepository.findByEmail(userEmail).orElseThrow();

        // if User not already added, add the user
        if (!membersRepository.existsByRoomIdAndUserId(roomId, user.getId())) {
            membersRepository.save(Members.builder()
                    .roomId(roomId)
                    .userId(user.getId())
                    .isAdmin(isAdmin)
                    .joinedAt(Instant.now())
                    .build());
        }

        // if the user being added is admin then update the room-admins list
        if (isAdmin) {
            room.getAdminIds().add(user.getId());
        }

        roomRepository.save(room);

        return null;

    }

    @Override
    public Void removeUser(String adminEmail, String roomId, String userId) {

        User adminUser = userRepository.findByEmail(adminEmail).orElseThrow();
        Rooms room = roomRepository.findById(roomId).orElseThrow();
        User removedUser = userRepository.findById(userId).orElseThrow();

        // check if the admin user is the room's admin
        if (room.getAdminIds() == null || !room.getAdminIds().contains(adminUser.getId())) {
            throw new RuntimeException("Not room admin");
        }

        // remove the user from members
        membersRepository.findByRoomId(roomId)
                .stream()
                .filter(mem -> mem.getUserId().equals(userId))
                .findFirst()
                .ifPresent(mem -> membersRepository.deleteById(mem.getId()));

        // if user is part of room admins, then remove the user
        if (room.getAdminIds() != null) {
            room.getAdminIds().remove(userId);
        }

        roomRepository.save(room);

        // notify removed user over websocket
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("type", "ROOM_ACCESS_REVOKED");
        out.put("roomId", room.getId());
        out.put("roomName", room.getName());
        out.put("userId", removedUser.getId());
        out.put("message", "You were removed from this room");

        messagingTemplate.convertAndSend(
                "/topic/room-events."+room.getId()+"."+removedUser.getId(),
                out);

        return null;
    }

    @Override
    public List<RoomSearchResponseDto> searchRooms(String userEmail, String query, boolean adminView) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        Pattern pattern = Pattern.compile(
                ".*" + (query == null ? "" : Pattern.quote(query)) + ".*",
                Pattern.CASE_INSENSITIVE);

        List<Rooms> rooms = adminView
                ? roomRepository.findByNameRegex(pattern)
                : roomRepository.findByIsPrivateFalseAndNameRegex(pattern);

        List<Members> userMemberships = membersRepository.findByUserId(user.getId());

        Set<String> memberRoomIds = userMemberships.stream()
                .map(Members::getRoomId)
                .collect(Collectors.toSet());

        Set<String> adminRoomIds = userMemberships.stream()
                .filter(Members::isAdmin)
                .map(Members::getRoomId)
                .collect(Collectors.toSet());

        List<Rooms> memberPrivateRooms = roomRepository.findAllById(memberRoomIds)
                .stream()
                .filter(Rooms::isPrivate)
                .filter(room -> pattern.matcher(room.getName()).matches())
                .toList();

        List<Invites> pendingInvites = invitesRepository
                .findByToUserIdAndStatusOrderBySentAtDesc(user.getId(), Status.PENDING);

        Map<String, Invites> pendingInviteByRoomId = pendingInvites.stream()
                .collect(Collectors.toMap(
                        Invites::getRoomId,
                        inv -> inv,
                        (a, b) -> a));

        List<Rooms> invitedRooms = roomRepository.findAllById(pendingInviteByRoomId.keySet())
                .stream()
                .filter(room -> pattern.matcher(room.getName()).matches())
                .toList();

        List<Rooms> mergedRooms = Stream.of(
                rooms.stream(),
                memberPrivateRooms.stream(),
                invitedRooms.stream())
                .flatMap(s -> s)
                .collect(Collectors.collectingAndThen(
                        Collectors.toMap(Rooms::getId, r -> r, (a, b) -> a),
                        map -> new ArrayList<>(map.values())));

        return mergedRooms.stream()
                .map(room -> {
                    Invites invite = pendingInviteByRoomId.get(room.getId());

                    return RoomSearchResponseDto.builder()
                            .id(room.getId())
                            .name(room.getName())
                            .isPrivate(room.isPrivate())
                            .roomPermissions(room.getRoomPermissions())
                            .createdAt(room.getCreatedAt())
                            .isMember(memberRoomIds.contains(room.getId()))
                            .isAdmin(
                                    adminRoomIds.contains(room.getId()) ||
                                            (room.getAdminIds() != null && room.getAdminIds().contains(user.getId())))
                            .invitePending(invite != null)
                            .inviteId(invite != null ? invite.getId() : null)
                            .build();
                })
                .toList();
    }

    @Override
    public Void joinRoom(String userEmail, String roomId) {

        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Rooms room = roomRepository.findById(roomId).orElseThrow();

        boolean isAdmin = user.getRoles().contains(Roles.ADMIN);

        // check if the room if private
        if (room.isPrivate()) {
            throw new RuntimeException("Private room, cannot self join");
        }

        if (!room.getRoomPermissions().isAllowSelfJoinPublic()) {
            throw new RuntimeException("Self join disabled in the group");
        }

        // add user to the room memebers
        if (!membersRepository.existsByRoomIdAndUserId(roomId, user.getId())) {
            membersRepository.save(Members.builder().roomId(roomId).userId(user.getId()).isAdmin(isAdmin)
                    .joinedAt(Instant.now()).build());
        }

        if (isAdmin) {
            room.getAdminIds().add(user.getId());
        }

        roomRepository.save(room);

        return null;
    }

    @Override
    public Void updateRoomPermissions(String adminEmail, String roomId, RoomPermissions permissions) {

        User admin = userRepository.findByEmail(adminEmail).orElseThrow();
        Rooms room = roomRepository.findById(roomId).orElseThrow();

        if (!room.getAdminIds().contains(admin.getId())) {
            throw new RuntimeException("Cannot update room permissions, as the user is not a room admin");
        }

        room.setRoomPermissions(permissions);
        roomRepository.save(room);

        return null;

    }

    @Override
    public Void inviteUser(String loggedInUserEmail, String roomId, Map<String, Object> request) {

        User admin = userRepository.findByEmail(loggedInUserEmail).orElseThrow();
        Rooms room = roomRepository.findById(roomId).orElseThrow();

        if (!room.getAdminIds().contains(admin.getId())) {
            throw new RuntimeException("User is not the room admin");
        }

        User invitedUser = userRepository.findByEmail((String) request.get("email")).orElseThrow();

        if (membersRepository.existsByRoomIdAndUserId(roomId, invitedUser.getId())) {
            throw new RuntimeException("User is already the member of the room");
        }

        Invites invite = Invites.builder()
                .toUserId(invitedUser.getId())
                .roomId(roomId)
                .roomName(room.getName())
                .adminId(admin.getId())
                .adminName(admin.getName())
                .sentAt(Instant.now())
                .status(Status.PENDING)
                .build();

        invitesRepository.save(invite);

        return null;

    }

    @Override
    public List<Invites> listUserInvites(String loggedInUserEmail, String status) {

        User user = userRepository.findByEmail(loggedInUserEmail).orElseThrow();

        return invitesRepository.getInvitesByStatusAndToUserId(Status.valueOf(status), user.getId());
    }

    @Override
    @Transactional
    public Void respondToInvite(String loggedInUserEmail, String inviteId, String action) {

        User user = userRepository.findByEmail(loggedInUserEmail).orElseThrow();
        Invites invite = invitesRepository.findById(inviteId).orElseThrow();

        if (!invite.getToUserId().equals(user.getId())) {
            throw new RuntimeException("Invalid Invite");
        }

        if (invite.getStatus().name().equals(Status.REJECTED.name())) {
            throw new RuntimeException("Invite already rejected");
        }

        if (invite.getStatus().name().equals(Status.ACCEPTED.name())) {
            throw new RuntimeException("Invite already accepted");
        }

        switch (action) {
            case "accept":
                invite.setStatus(Status.ACCEPTED);

                Rooms room = roomRepository.findById(invite.getRoomId()).orElseThrow();

                if (membersRepository.existsByRoomIdAndUserId(room.getId(), user.getId())) {
                    throw new RuntimeException("User is already the member of the room");
                }

                Members member = Members.builder()
                        .userId(user.getId())
                        .roomId(invite.getRoomId())
                        .isAdmin(user.getRoles().contains(Roles.ADMIN))
                        .joinedAt(Instant.now())
                        .build();

                member = membersRepository.save(member);

                if (member.isAdmin()) {
                    room.getAdminIds().add(user.getId());
                    roomRepository.save(room);
                }

                break;
            case "reject":
            case "decline":
                invite.setStatus(Status.REJECTED);
                break;
            default:
                throw new RuntimeException("Unsupported invite action");

        }

        invite.setUpdatedAt(Instant.now());
        invitesRepository.save(invite);

        return null;
    }

    @Override
    public Map<String, Object> sendRoomJoinRequest(String loggedInUserEmail, String roomId) {
        User user = userRepository.findByEmail(loggedInUserEmail).orElseThrow();
        Rooms room = roomRepository.findById(roomId).orElseThrow();

        if (joinRequestsRepository.findUserRoomJoinRequestNotRejected(user.getId(), room.getId(), Status.REJECTED)) {
            throw new RuntimeException("Join Request already initiated");
        }

        if (membersRepository.existsByRoomIdAndUserId(roomId, user.getId())) {
            throw new RuntimeException("User already a member of the room");
        }

        if (!room.isPrivate() && room.getRoomPermissions().isAllowSelfJoinPublic()) {
            joinRoom(loggedInUserEmail, roomId);
            return Map.of("joined", true, "requested", false);
        }

        JoinRequests joinRequest = JoinRequests.builder()
                .raisedbyUserId(user.getId())
                .raisedbyUserName(user.getName())
                .roomId(roomId)
                .raisedAt(Instant.now())
                .status(Status.PENDING)
                .build();

        joinRequestsRepository.save(joinRequest);
        return Map.of("joined", false, "requested", true);
    }

    @Override
    public List<JoinRequests> listRoomJoinRequest(String loggedInUserEmail, String roomId, String status) {

        User admin = userRepository.findByEmail(loggedInUserEmail).orElseThrow();
        Rooms room = roomRepository.findById(roomId).orElseThrow();

        if (!room.getAdminIds().contains(admin.getId())) {
            throw new RuntimeException("User is not the room admin");
        }

        return joinRequestsRepository.listJoinRequestsByRoomIdAndStatus(roomId, Status.valueOf(status));

    }

    @Override
    @Transactional
    public Void respondToJoinRequest(String loggedInUserEmail, String requestId, String action) {

        User admin = userRepository.findByEmail(loggedInUserEmail).orElseThrow();
        JoinRequests joinRequest = joinRequestsRepository.findById(requestId).orElseThrow();

        Rooms room = roomRepository.findById(joinRequest.getRoomId()).orElseThrow();

        if (!room.getAdminIds().contains(admin.getId())) {
            throw new RuntimeException("User is not the room admin");
        }

        if (joinRequest.getStatus().name().equals(Status.REJECTED.name())) {
            throw new RuntimeException("Join Request already rejected");
        }

        if (joinRequest.getStatus().name().equals(Status.ACCEPTED.name())) {
            throw new RuntimeException("Join Request already accepted");
        }

        switch (action) {
            case "accept":
                joinRequest.setStatus(Status.ACCEPTED);

                if (membersRepository.existsByRoomIdAndUserId(room.getId(), joinRequest.getRaisedbyUserId())) {
                    throw new RuntimeException("User is already the member of the room");
                }

                User user = userRepository.findById(joinRequest.getRaisedbyUserId()).orElseThrow();

                Members member = Members.builder()
                        .userId(joinRequest.getRaisedbyUserId())
                        .roomId(room.getId())
                        .isAdmin(user.getRoles().contains(Roles.ADMIN))
                        .joinedAt(Instant.now())
                        .build();

                member = membersRepository.save(member);

                if (member.isAdmin()) {
                    room.getAdminIds().add(user.getId());
                    roomRepository.save(room);
                }
                break;

            case "reject":
            case "rejected":
            case "deny":
                joinRequest.setStatus(Status.REJECTED);
                break;
            default:
                throw new RuntimeException("Unsupported join request action");
        }

        joinRequest.setApprovedByAdminId(admin.getId());
        joinRequest.setApprovedByAdminName(admin.getName());
        joinRequest.setUpdatedAt(Instant.now());
        joinRequestsRepository.save(joinRequest);

        return null;

    }

    @Override
    public Map<String, Object> getRoomMeta(String loggedInUserEmail, String roomId) {
        User user = userRepository.findByEmail(loggedInUserEmail).orElseThrow();
        Rooms room = roomRepository.findById(roomId).orElseThrow();

        boolean isMember = membersRepository.existsByRoomIdAndUserId(roomId, user.getId());
        boolean isAdmin = room.getAdminIds() != null && room.getAdminIds().contains(user.getId());

        if (room.isPrivate() && !isMember && !isAdmin) {
            throw new RuntimeException("Not allowed to view private room metadata");
        }

        List<Members> members = membersRepository.findByRoomId(roomId);

        List<Map<String, String>> memberDtos = members.stream()
                .map(m -> userRepository.findById(m.getUserId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(u -> Map.of(
                        "id", u.getId(),
                        "name", u.getName() != null ? u.getName() : "",
                        "email", u.getEmail(),
                        "isAdmin",
                        String.valueOf(room.getAdminIds() != null && room.getAdminIds().contains(u.getId()))))
                .toList();

        List<Map<String, String>> admins = room.getAdminIds().stream()
                .map(userRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(u -> Map.of(
                        "id", u.getId(),
                        "name", u.getName(),
                        "email", u.getEmail()))
                .toList();

        return Map.of(
                "id", room.getId(),
                "name", room.getName(),
                "isPrivate", room.isPrivate(),
                "memberCount", members.size(),
                "isAdmin", isAdmin,
                "members", memberDtos,
                "admins", admins);
    }

}
