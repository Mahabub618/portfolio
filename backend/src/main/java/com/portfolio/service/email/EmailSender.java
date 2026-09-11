package com.portfolio.service.email;

/**
 * Minimal email abstraction. A Resend-backed sender is used when
 * {@code app.email.resend-api-key} is set; otherwise a logging sender
 * is used (local development and tests).
 */
public interface EmailSender {

    void send(String to, String subject, String html);
}
