package com.personal.chat_app.controller.web;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.personal.chat_app.Documents.RoomPermissions;
import com.personal.chat_app.service.IRoomService;
import com.personal.chat_app.utils.Utils;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    @Autowired
    private IRoomService roomService;
    @Autowired
    private Utils utils;

    @RequestMapping(value = "/create", method = RequestMethod.POST)
    public ResponseEntity<?> createRoom(
            Authentication authentication, @RequestBody Map<String, Object> request) {

        Map<String, Boolean> permissions = (Map<String, Boolean>) request.getOrDefault("permissions", Map.of());

        RoomPermissions roomPermissions = new RoomPermissions(
                permissions.getOrDefault("allowReplies", true),
                permissions.getOrDefault("allowDeleteOwn", true),
                permissions.getOrDefault("allowUserInvite", true),
                permissions.getOrDefault("allowSelfJoinPublic", true));

        return new ResponseEntity<>(roomService.createRoom(utils.getLoggedInUserEmail(authentication), (String) request.get("name"),
                Boolean.TRUE.equals(request.get("isPrivate")), roomPermissions), HttpStatus.OK);
    }

    @RequestMapping(value = "/{roomId}/users/add", method = RequestMethod.POST)
    public ResponseEntity<?> addUserToRoom(
            Authentication authentication,
            @PathVariable("roomId") String roomId,
            @RequestBody Map<String, Object> request) {
        return new ResponseEntity<>(roomService.addUserToRoom(utils.getLoggedInUserEmail(authentication), roomId,
                (String) request.get("email"), Boolean.TRUE.equals(request.get("isAdmin"))), HttpStatus.OK);
    }

    @RequestMapping(value = "/{roomId}/users/{userId}/remove", method = RequestMethod.DELETE)
    public ResponseEntity<?> removeUserFromRoom(
            Authentication authentication,
            @PathVariable("roomId") String roomId,
            @PathVariable("userId") String userId) {
        return new ResponseEntity<>(roomService.removeUser(utils.getLoggedInUserEmail(authentication), roomId, userId), HttpStatus.OK);
    }

    @RequestMapping(value = "/search", method = RequestMethod.GET)
    public ResponseEntity<?> searchRooms(
            Authentication authentication,
            @RequestParam(name = "query") String query,
            @RequestParam(name = "adminScope", defaultValue = "false") boolean adminScope) {
        boolean adminView = adminScope; // admin can view private rooms metadata
        return ResponseEntity.ok(roomService.searchRooms(utils.getLoggedInUserEmail(authentication), query, adminView));
    }

    // TODO: handle private room joins -> if it is a private room/self-join is not
    // allowed, then any external user need to raise a request
    // Admin, will approve the request, and the user will get added to the room
    @RequestMapping(value = "/{roomId}/join", method = RequestMethod.POST)
    public ResponseEntity<?> joinRoom(
            Authentication authentication,
            @PathVariable("roomId") String roomId) {
        return ResponseEntity.ok(roomService.joinRoom(utils.getLoggedInUserEmail(authentication), roomId));
    }

    @RequestMapping(value = "/{roomId}/update-permissions", method = RequestMethod.PATCH)
    public ResponseEntity<?> updateRoomPermissions(
            Authentication authentication,
            @PathVariable("roomId") String roomId,
            @RequestBody RoomPermissions permissions) {
        return ResponseEntity.ok(roomService.updateRoomPermissions(utils.getLoggedInUserEmail(authentication), roomId, permissions));
    }

}
