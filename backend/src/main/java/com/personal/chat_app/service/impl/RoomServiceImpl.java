package com.personal.chat_app.service.impl;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.personal.chat_app.Documents.Members;
import com.personal.chat_app.Documents.RoomPermissions;
import com.personal.chat_app.Documents.Rooms;
import com.personal.chat_app.Documents.User;
import com.personal.chat_app.Repository.IMembersRepository;
import com.personal.chat_app.Repository.IRoomRepository;
import com.personal.chat_app.Repository.IUserRepository;
import com.personal.chat_app.service.IRoomService;
import com.personal.chat_app.utils.Constants.Roles;

@Service
public class RoomServiceImpl implements IRoomService {

    @Autowired
    private IRoomRepository roomRepository;

    @Autowired
    private IMembersRepository membersRepository;

    @Autowired
    private IUserRepository userRepository;

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

        // check if the admin User is the room's admin
        if (!room.getAdminIds().contains(adminUser.getId())) {
            throw new RuntimeException("Not room admin");
        }

        // check if the userId is the member, if yes then remove the user
        membersRepository.findByRoomId(roomId).stream().filter(mem -> mem.getUserId().equals(userId)).findFirst()
                .ifPresent(mem -> membersRepository.deleteById(mem.getId()));

        // if user is part of roomAdmin, then remove the user
        room.getAdminIds().remove(userId);

        roomRepository.save(room);

        return null;
    }

    @Override
    public List<Rooms> searchRooms(String adminEmail, String query, boolean adminView) {

        if(query==null || query.isEmpty()){
            List<Rooms> rooms = roomRepository.findAll();
            return rooms;
        }

        Pattern pattern = Pattern.compile(".*" + query + ".*", Pattern.CASE_INSENSITIVE);

        return adminView ? roomRepository.findByNameRegex(pattern)
                : roomRepository.findByIsPrivateFalseAndNameRegex(pattern);
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

}
