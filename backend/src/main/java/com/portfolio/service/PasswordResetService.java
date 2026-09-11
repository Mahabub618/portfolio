package com.portfolio.service;

import com.portfolio.config.AppProperties;
import com.portfolio.dto.AuthDtos;
import com.portfolio.model.AdminUser;
import com.portfolio.model.PasswordResetToken;
import com.portfolio.repository.AdminUserRepository;
import com.portfolio.repository.PasswordResetTokenRepository;
import com.portfolio.service.email.EmailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private final AdminUserRepository adminUsers;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder passwordEncoder;
    private final EmailSender emailSender;
    private final AppProperties.Email config;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(AdminUserRepository adminUsers,
                                PasswordResetTokenRepository tokens,
                                PasswordEncoder passwordEncoder,
                                EmailSender emailSender,
                                AppProperties props) {
        this.adminUsers = adminUsers;
        this.tokens = tokens;
        this.passwordEncoder = passwordEncoder;
        this.emailSender = emailSender;
        this.config = props.email();
    }

    /**
     * Always answers the same generic message (no account enumeration).
     * If the account exists and the rate limit allows, a reset email is sent.
     */
    @Transactional
    public void requestReset(String email) {
        String normalized = email.trim();
        AdminUser admin = adminUsers.findByEmailIgnoreCase(normalized).orElse(null);
        if (admin == null) {
            return;
        }
        Instant windowStart = Instant.now().minus(config.rateLimitWindowMinutes(), ChronoUnit.MINUTES);
        if (tokens.countByEmailIgnoreCaseAndCreatedAtAfter(admin.getEmail(), windowStart) >= config.rateLimitMax()) {
            log.warn("Password reset rate limit reached for {}", admin.getEmail());
            return;
        }
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        PasswordResetToken token = new PasswordResetToken();
        token.setEmail(admin.getEmail());
        token.setTokenHash(sha256(rawToken));
        token.setExpiresAt(Instant.now().plus(config.tokenTtlMinutes(), ChronoUnit.MINUTES));
        token.setUsedAt(null);
        token.setCreatedAt(Instant.now());
        tokens.save(token);

        String link = config.frontendUrl().replaceAll("/+$", "") + "/admin/reset-password?token=" + rawToken;
        emailSender.send(admin.getEmail(), "Reset your portfolio admin password", emailHtml(link));
    }

    @Transactional
    public void resetPassword(AuthDtos.ResetPasswordRequest request) {
        PasswordResetToken token = tokens.findByTokenHash(sha256(request.token().trim()))
                .orElseThrow(() -> new IllegalArgumentException("Reset link is invalid or has expired"));
        if (token.getUsedAt() != null || token.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Reset link is invalid or has expired");
        }
        AdminUser admin = adminUsers.findByEmailIgnoreCase(token.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Reset link is invalid or has expired"));
        if (passwordEncoder.matches(request.newPassword(), admin.getPasswordHash())) {
            throw new IllegalArgumentException("New password must be different from the current one");
        }
        admin.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        adminUsers.save(admin);
        token.setUsedAt(Instant.now());
        tokens.save(token);
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String emailHtml(String link) {
        return """
                <div style="font-family:Inter,Arial,sans-serif;background:#0B0E1A;padding:32px;color:#E6E6F0">
                  <div style="max-width:480px;margin:0 auto;background:#141830;border-radius:16px;padding:32px">
                    <h1 style="font-size:20px;margin:0 0 12px;color:#fff">Password reset</h1>
                    <p style="font-size:14px;line-height:1.6;margin:0 0 20px">
                      We received a request to reset your portfolio admin password.
                      This link expires in %d minutes and can be used once.
                    </p>
                    <a href="%s"
                       style="display:inline-block;background:#8B5CF6;color:#fff;text-decoration:none;
                              font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px">
                      Choose a new password
                    </a>
                    <p style="font-size:12px;line-height:1.6;margin:20px 0 0;color:#9A9AB0">
                      If you did not request this, you can safely ignore this email.
                      Your password will not change.
                    </p>
                  </div>
                </div>
                """.formatted(15, link);
    }
}
