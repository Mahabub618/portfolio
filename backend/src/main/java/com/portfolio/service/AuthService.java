package com.portfolio.service;

import com.portfolio.dto.AuthDtos.LoginRequest;
import com.portfolio.dto.AuthDtos.LoginResponse;
import com.portfolio.model.AdminUser;
import com.portfolio.repository.AdminUserRepository;
import com.portfolio.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AdminUserRepository adminUsers;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AdminUserRepository adminUsers, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.adminUsers = adminUsers;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        AdminUser admin = adminUsers.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), admin.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        JwtService.IssuedToken issued = jwtService.issue(admin.getEmail());
        return new LoginResponse(issued.token(), issued.expiresAt(),
                new LoginResponse.User(admin.getEmail()));
    }
}
