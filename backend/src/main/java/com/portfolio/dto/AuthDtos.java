package com.portfolio.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public final class AuthDtos {

    private AuthDtos() {}

    public record LoginRequest(
            @NotBlank @Email @jakarta.validation.constraints.Size(max = 255) String email,
            @NotBlank String password) {}

    public record ChangePasswordRequest(
            @NotBlank @jakarta.validation.constraints.Size(max = 72) String currentPassword,
            @NotBlank @jakarta.validation.constraints.Size(min = 12, max = 72) String newPassword) {}

    public record LoginResponse(String token, Instant expiresAt, User user) {
        public record User(String email) {}
    }
}
