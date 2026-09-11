package com.portfolio;

import com.portfolio.service.email.EmailSender;
import com.portfolio.service.email.LoggingEmailSender;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PasswordResetApiTest extends ApiTestBase {

    private static final Pattern TOKEN_IN_LINK =
            Pattern.compile("/admin/reset-password\\?token=([A-Za-z0-9_-]+)");

    @Autowired
    private EmailSender emailSender;

    private LoggingEmailSender outbox() {
        return (LoggingEmailSender) emailSender;
    }

    private void postJson(String url, String body) throws Exception {
        mockMvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk());
    }

    /** Requests a reset for ADMIN_EMAIL and pulls the raw token out of the dev-email outbox. */
    private String requestTokenFromEmail() throws Exception {
        outbox().clearOutbox();
        postJson("/api/auth/forgot-password", "{\"email\":\"" + ADMIN_EMAIL + "\"}");
        assertEquals(1, outbox().outbox().size());
        Matcher m = TOKEN_IN_LINK.matcher(outbox().outbox().getLast().html());
        assertTrue(m.find(), "reset link missing from email html");
        return m.group(1);
    }

    private void loginExpecting(String password, org.springframework.test.web.servlet.ResultMatcher status)
            throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status);
    }

    @Test
    void forgotPasswordIsGenericForUnknownEmail() throws Exception {
        outbox().clearOutbox();
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@nowhere.test\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.message").value(containsString("If an account")));
        assertEquals(0, outbox().outbox().size(), "no email for unknown account");
    }

    @Test
    void forgotPasswordEmailsResetLink() throws Exception {
        outbox().clearOutbox();
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + ADMIN_EMAIL + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.message").value(containsString("If an account")));
        assertEquals(1, outbox().outbox().size());
        LoggingEmailSender.Sent mail = outbox().outbox().getLast();
        assertEquals(ADMIN_EMAIL, mail.to());
        assertTrue(TOKEN_IN_LINK.matcher(mail.html()).find(), "email must contain the reset link");
    }

    @Test
    void resetFlowRoundTripConsumesToken() throws Exception {
        String token = requestTokenFromEmail();
        postJson("/api/auth/reset-password",
                "{\"token\":\"" + token + "\",\"newPassword\":\"Freshly-Minted-9900\"}");

        loginExpecting("Freshly-Minted-9900", status().isOk());
        loginExpecting(ADMIN_PASSWORD, status().isUnauthorized());

        // token is single-use
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token + "\",\"newPassword\":\"Another-Secret-77\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message").value(containsString("invalid or has expired")));
    }

    @Test
    void resetRejectsBogusToken() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"totally-made-up-token\",\"newPassword\":\"Whatever-Valid-1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.error.message").value(containsString("invalid or has expired")));
    }

    @Test
    void resetValidatesPasswordLength() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"some-token\",\"newPassword\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void resetRejectsSameAsCurrentPassword() throws Exception {
        String token = requestTokenFromEmail();
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token + "\",\"newPassword\":\"" + ADMIN_PASSWORD + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message").value(containsString("must be different")));
    }

    @Test
    void rateLimitCapsResetEmails() throws Exception {
        outbox().clearOutbox();
        String body = "{\"email\":\"" + ADMIN_EMAIL + "\"}";
        for (int i = 0; i < 4; i++) {
            mockMvc.perform(post("/api/auth/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk());
        }
        assertEquals(3, outbox().outbox().size(), "4th request inside the window must not send");
    }
}
