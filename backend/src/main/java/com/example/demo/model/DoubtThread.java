package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "doubt_threads")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoubtThread {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String question;

    @Column(nullable = false)
    private Long studentId;
    
    private Long expertId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DoubtStatus status;
    
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public DoubtThread(String question, Long studentId) {
        this.question = question;
        this.studentId = studentId;
        this.status = DoubtStatus.OPEN;
    }
}
