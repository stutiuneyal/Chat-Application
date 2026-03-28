package com.personal.chat_app.controller.web;

import com.personal.chat_app.utils.Utils;
import java.security.Principal;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personal.chat_app.service.IInviteService;

@RestController
@RequestMapping("/api/invites")
public class InviteController {

    @Autowired
    private Utils utils;
    @Autowired
    private IInviteService inviteService;

    InviteController(Utils utils) {
        this.utils = utils;
    }

    @PostMapping("/rooms/{roomId}/users/{userId}")
    public ResponseEntity<?> sendInvite(
            @PathVariable String roomId,
            @PathVariable String userId,
            Authentication authentication) {
        inviteService.sendInvite(utils.getLoggedInUserEmail(authentication), roomId, userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyPendingInvites(Authentication authentication) {
        return ResponseEntity.ok(inviteService.getMyPendingInvites(utils.getLoggedInUserEmail(authentication)));
    }

    @PostMapping("/{inviteId}/accept")
    public ResponseEntity<?> acceptInvite(@PathVariable String inviteId, Authentication authentication) {
        inviteService.acceptInvite(utils.getLoggedInUserEmail(authentication), inviteId);
        return ResponseEntity.ok(Map.of("accepted", true));
    }

    @PostMapping("/{inviteId}/decline")
    public ResponseEntity<?> declineInvite(@PathVariable String inviteId, Authentication authentication) {
        inviteService.declineInvite(utils.getLoggedInUserEmail(authentication), inviteId);
        return ResponseEntity.ok(Map.of("declined", true));
    }
}