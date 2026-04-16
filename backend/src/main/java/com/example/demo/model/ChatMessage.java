package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long doubtId;

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false, length = 1000)
    private String content;

    // Transient means it will be sent in JSON over Websockets, but NOT saved to the database!
    @Transient
    private String senderUsername;

    private LocalDateTime timestamp = LocalDateTime.now();
    
    public ChatMessage(Long doubtId, Long senderId, String content) {
        this.doubtId = doubtId;
        this.senderId = senderId;
        this.content = content;
    }
}
