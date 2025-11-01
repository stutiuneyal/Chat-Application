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

                return new ResponseEntity<>(
                                roomService.createRoom(utils.getLoggedInUserEmail(authentication),
                                                (String) request.get("name"),
                                                Boolean.TRUE.equals(request.get("isPrivate")), roomPermissions),
                                HttpStatus.OK);
        }

        @RequestMapping(value = "/{roomId}/users/add", method = RequestMethod.POST)
        public ResponseEntity<?> addUserToRoom(
                        Authentication authentication,
                        @PathVariable("roomId") String roomId,
                        @RequestBody Map<String, Object> request) {
                return new ResponseEntity<>(roomService.addUserToRoom(utils.getLoggedInUserEmail(authentication),
                                roomId,
                                (String) request.get("email"), Boolean.TRUE.equals(request.get("isAdmin"))),
                                HttpStatus.OK);
        }

        @RequestMapping(value = "/{roomId}/users/{userId}/remove", method = RequestMethod.DELETE)
        public ResponseEntity<?> removeUserFromRoom(
                        Authentication authentication,
                        @PathVariable("roomId") String roomId,
                        @PathVariable("userId") String userId) {
                return new ResponseEntity<>(
                                roomService.removeUser(utils.getLoggedInUserEmail(authentication), roomId, userId),
                                HttpStatus.OK);
        }

        @RequestMapping(value = "/search", method = RequestMethod.GET)
        public ResponseEntity<?> searchRooms(
                        Authentication authentication,
                        @RequestParam(name = "query") String query,
                        @RequestParam(name = "adminScope", defaultValue = "false") boolean adminScope) {
                boolean adminView = adminScope; // admin can view private rooms metadata
                return ResponseEntity.ok(
                                roomService.searchRooms(utils.getLoggedInUserEmail(authentication), query, adminView));
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
                return ResponseEntity
                                .ok(roomService.updateRoomPermissions(utils.getLoggedInUserEmail(authentication),
                                                roomId, permissions));
        }

        // Invite Users -> admin -> user
        @RequestMapping(value = "/{roomId}/invite", method = RequestMethod.POST)
        public ResponseEntity<?> inviteUser(
                        Authentication authentication,
                        @RequestBody Map<String, Object> request,
                        @PathVariable("roomId") String roomId) {
                return ResponseEntity.ok(
                                roomService.inviteUser(utils.getLoggedInUserEmail(authentication), roomId, request));
        }

        // List all invites for the loggedIn user
        @RequestMapping(value = "/invites/list/{status}", method = RequestMethod.GET)
        public ResponseEntity<?> listUserInvites(
                        Authentication authentication,
                        @PathVariable(name = "status") String status) {
                return ResponseEntity
                                .ok(roomService.listUserInvites(utils.getLoggedInUserEmail(authentication), status));
        }

        // respond to invite
        @RequestMapping(value = "/invites/{inviteId}", method = RequestMethod.PUT)
        public ResponseEntity<?> respondToInvite(
                        Authentication authentication,
                        @PathVariable("inviteId") String inviteId,
                        @RequestParam(name = "action", defaultValue = "accept") String action) {
                return ResponseEntity
                                .ok(roomService.respondToInvite(utils.getLoggedInUserEmail(authentication), inviteId,
                                                action));
        }

        // User -> send Join Request -> user -> admins
        @RequestMapping(value = "/{roomId}/join-request", method = RequestMethod.POST)
        public ResponseEntity<?> sendRoomJoinRequest(
                        Authentication authentication,
                        @PathVariable("roomId") String roomId) {
                return ResponseEntity.ok(
                                roomService.sendRoomJoinRequest(utils.getLoggedInUserEmail(authentication), roomId));
        }

        // Admin -> list all the join requests for the room
        @RequestMapping(value = "/{roomId}/join-requests/list/{status}", method = RequestMethod.GET)
        public ResponseEntity<?> listRoomJoinRequest(
                        Authentication authentication,
                        @PathVariable("roomId") String roomId,
                        @PathVariable("status") String status) {
                return ResponseEntity
                                .ok(roomService.listRoomJoinRequest(utils.getLoggedInUserEmail(authentication), roomId,
                                                status));
        }

        // respond to join request
        @RequestMapping(value = "/join-requests/{requestId}", method = RequestMethod.PUT)
        public ResponseEntity<?> respondToJoinRequest(
                        Authentication authentication,
                        @PathVariable("requestId") String requestId,
                        @RequestParam(name = "action", defaultValue = "accept") String action) {
                return ResponseEntity
                                .ok(roomService.respondToJoinRequest(utils.getLoggedInUserEmail(authentication),
                                                requestId, action));
        }

}
