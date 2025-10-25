package com.personal.chat_app.service;

import java.util.List;

import com.personal.chat_app.Documents.RoomPermissions;
import com.personal.chat_app.Documents.Rooms;

public interface IRoomService {

    Rooms createRoom(String creatorEmail, String name, boolean isPrivate, RoomPermissions roomPermissions);

    Void addUserToRoom(String adminEmail, String roomId, String userEmail, boolean isAdmin);

    Void removeUser(String adminEmail,String roomId, String userId);

    List<Rooms> searchRooms(String adminEmail, String query, boolean adminView);

    Void joinRoom(String userEmail, String roomId);

    Void updateRoomPermissions(String adminEmail, String roomId, RoomPermissions permissions);

}
