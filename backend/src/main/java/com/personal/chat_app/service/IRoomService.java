package com.personal.chat_app.service;

import java.util.List;
import java.util.Map;

import com.personal.chat_app.Documents.Invites;
import com.personal.chat_app.Documents.JoinRequests;
import com.personal.chat_app.Documents.RoomPermissions;
import com.personal.chat_app.Documents.Rooms;

public interface IRoomService {

    Rooms createRoom(String creatorEmail, String name, boolean isPrivate, RoomPermissions roomPermissions);

    Void addUserToRoom(String adminEmail, String roomId, String userEmail, boolean isAdmin);

    Void removeUser(String adminEmail, String roomId, String userId);

    List<Rooms> searchRooms(String adminEmail, String query, boolean adminView);

    Void joinRoom(String userEmail, String roomId);

    Void updateRoomPermissions(String adminEmail, String roomId, RoomPermissions permissions);

    Void inviteUser(String loggedInUserEmail, String roomId, Map<String, Object> request);

    List<Invites> listUserInvites(String loggedInUserEmail, String status);

    Void respondToInvite(String loggedInUserEmail, String inviteId, String action);

    Void sendRoomJoinRequest(String loggedInUserEmail, String roomId);

    List<JoinRequests> listRoomJoinRequest(String loggedInUserEmail, String roomId, String status);

    Void respondToJoinRequest(String loggedInUserEmail, String requestId, String action);

}
