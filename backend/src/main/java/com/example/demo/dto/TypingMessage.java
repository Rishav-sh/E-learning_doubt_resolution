package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypingMessage {
    private Long doubtId;
    private Long senderId;
    private String senderUsername;
    private boolean isTyping;
}
