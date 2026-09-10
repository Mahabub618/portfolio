package com.portfolio.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public final class AuthDtos {

    private AuthDtos() {}

    public record LoginRequest(
            @NotBlank @Email @jakarta.validation.constraints.Size(max = 255) String email,
            @NotBlank String password) {}

    public record LoginResponse(String token, Instant expiresAt, User user) {
        public record User(String email) {}
    }
}
