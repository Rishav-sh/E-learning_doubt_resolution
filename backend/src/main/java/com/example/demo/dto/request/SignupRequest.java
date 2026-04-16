package com.example.demo.dto.request;

import lombok.Data;

@Data
public class SignupRequest {
    private String username;
    private String role; // STUDENT or EXPERT
    private String password;
}
