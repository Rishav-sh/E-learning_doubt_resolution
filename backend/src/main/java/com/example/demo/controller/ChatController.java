package com.example.demo.controller;

import com.example.demo.model.ChatMessage;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.model.User;
import com.example.demo.dto.TypingMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import java.time.LocalDateTime;
import java.util.Optional;

@Controller
public class ChatController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    @Autowired
    private UserRepository userRepository;

    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        // Enforce the current server timestamp just to be totally safe
        chatMessage.setTimestamp(LocalDateTime.now());
        
        // Magically resolve the username before broadcasting it
        Optional<User> sender = userRepository.findById(chatMessage.getSenderId());
        if(sender.isPresent()) {
            chatMessage.setSenderUsername(sender.get().getUsername());
        } else {
            chatMessage.setSenderUsername("Unknown User");
        }
        
        // Save to Database (the @Transient username will be ignored by JPA natively)
        chatMessageRepository.save(chatMessage);
        
        // Broadcast out to all clients subscribed to /topic/messages!
        return chatMessage;
    }
    
    // Brand new endpoint strictly for real-time presence indicators!
    @MessageMapping("/typing")
    @SendTo("/topic/typing")
    public TypingMessage handleTyping(@Payload TypingMessage typingMessage) {
        return typingMessage;
    }
}
