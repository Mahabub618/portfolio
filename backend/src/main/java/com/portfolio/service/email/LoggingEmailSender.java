package com.portfolio.service.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Fallback sender for local development and tests: logs the email and
 * keeps the last few messages in memory so tests can assert on them.
 */
public class LoggingEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(LoggingEmailSender.class);

    public record Sent(String to, String subject, String html) {}

    private final List<Sent> sent = new CopyOnWriteArrayList<>();

    @Override
    public void send(String to, String subject, String html) {
        sent.add(new Sent(to, subject, html));
        if (sent.size() > 10) {
            sent.removeFirst();
        }
        log.info("[dev-email] to={} subject={}\n{}", to, subject, html);
    }

    public List<Sent> outbox() {
        return List.copyOf(sent);
    }

    public void clearOutbox() {
        sent.clear();
    }
}
