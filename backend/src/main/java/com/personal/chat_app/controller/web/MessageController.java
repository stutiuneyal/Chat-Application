package com.personal.chat_app.controller.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.personal.chat_app.Documents.User;
import com.personal.chat_app.Repository.IUserRepository;
import com.personal.chat_app.service.IMessageService;
import com.personal.chat_app.utils.Utils;
import com.personal.chat_app.utils.Constants.Roles;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    
    @Autowired
    private IMessageService messageService;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private Utils utils;

    @RequestMapping(value = "/{roomId}", method = RequestMethod.GET)
    public ResponseEntity<?> getPaginatedMessages(
        Authentication authentication,
        @PathVariable("roomId") String roomId,
        @RequestParam(name = "pageNo", defaultValue = "0") int pageNo,
        @RequestParam(name = "pageSize",defaultValue = "30") int pageSize
    ){
        User user = userRepository.findByEmail(utils.getLoggedInUserEmail(authentication)).orElseThrow();
        boolean isAdmin = user.getRoles()!=null && user.getRoles().contains(Roles.ADMIN);

        return ResponseEntity.ok(messageService.getPaginatedMessages(roomId,pageNo,pageSize,isAdmin));
    }

    @RequestMapping(value = "/{messageId}/delete", method = RequestMethod.DELETE)
    public ResponseEntity<?> deleteMessages(
        Authentication authentication,
        @PathVariable("messageId") String messageId
    ){
        return ResponseEntity.ok(messageService.deleteMessage(utils.getLoggedInUserEmail(authentication),messageId));
    }

}
