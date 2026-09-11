package com.portfolio.controller;

import com.portfolio.dto.AuthDtos;
import com.portfolio.dto.AuthDtos.LoginRequest;
import com.portfolio.dto.AuthDtos.LoginResponse;
import com.portfolio.service.AuthService;
import com.portfolio.service.PasswordResetService;
import com.portfolio.web.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, String>> me(Authentication authentication) {
        return ApiResponse.ok(Map.of("email", authentication.getName()));
    }

    @PostMapping("/password")
    public ApiResponse<Map<String, String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody AuthDtos.ChangePasswordRequest request) {
        authService.changePassword(authentication.getName(), request);
        return ApiResponse.ok(Map.of("message", "Password updated"));
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Map<String, String>> forgotPassword(
            @Valid @RequestBody AuthDtos.ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.email());
        return ApiResponse.ok(Map.of(
                "message", "If an account with that email exists, a reset link is on its way"));
    }

    @PostMapping("/reset-password")
    public ApiResponse<Map<String, String>> resetPassword(
            @Valid @RequestBody AuthDtos.ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ApiResponse.ok(Map.of("message", "Password reset - you can log in now"));
    }
}
