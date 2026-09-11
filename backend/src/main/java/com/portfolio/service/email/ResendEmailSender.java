package com.portfolio.service.email;

import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Sends mail through the Resend HTTP API (https://resend.com).
 * Failures are logged, never thrown: the forgot-password endpoint must
 * keep its generic response regardless of email delivery outcome.
 */
public class ResendEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailSender.class);

    private final String apiKey;
    private final String from;
    private final HttpClient http;
    private final ObjectMapper mapper = new ObjectMapper();

    public ResendEmailSender(String apiKey, String from) {
        this.apiKey = apiKey;
        this.from = from;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    @Override
    public void send(String to, String subject, String html) {
        try {
            String body = mapper.writeValueAsString(Map.of(
                    "from", from,
                    "to", List.of(to),
                    "subject", subject,
                    "html", html));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                log.error("Resend rejected email to {}: {} {}", to, response.statusCode(), response.body());
            } else {
                log.info("Reset email dispatched to {} via Resend", to);
            }
        } catch (Exception e) {
            log.error("Failed to send email to {} via Resend: {}", to, e.getMessage());
        }
    }
}
