package com.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthApiTest extends ApiTestBase {

    @Test
    void loginReturnsJwt() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").value(notNullValue()))
                .andExpect(jsonPath("$.data.expiresAt").value(notNullValue()))
                .andExpect(jsonPath("$.data.user.email").value(ADMIN_EMAIL));
    }

    @Test
    void loginRejectsWrongPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void meRequiresToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    @Test
    void meWorksWithToken() throws Exception {
        String token = loginToken();
        mockMvc.perform(withAuth(get("/api/auth/me"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(ADMIN_EMAIL));
    }

    @Test
    void mutationWithoutTokenIs401() throws Exception {
        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Nope\",\"description\":\"should fail\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void malformedTokenIs401OnProtectedRoute() throws Exception {
        mockMvc.perform(withAuth(get("/api/auth/me"), "not.a.jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void envelopeShapeOnValidationError() throws Exception {
        String token = loginToken();
        mockMvc.perform(withAuth(post("/api/projects"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"description\":\"missing title\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.details.title").value(containsString("blank")));
    }

    @Test
    void passwordChangeRequiresToken() throws Exception {
        mockMvc.perform(post("/api/auth/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"x\",\"newPassword\":\"aaaaaaaaaaaa\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void passwordChangeRejectsWrongCurrent() throws Exception {
        mockMvc.perform(withAuth(post("/api/auth/password"), loginToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"not-the-password\",\"newPassword\":\"aaaaaaaaaaaa\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message").value(containsString("Current password is incorrect")));
    }

    @Test
    void passwordChangeRoundTrip() throws Exception {
        String fresh = "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}";
        mockMvc.perform(withAuth(post("/api/auth/password"), loginToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"" + ADMIN_PASSWORD + "\",\"newPassword\":\"Rotated-Secret-99\"}"))
                .andExpect(status().isOk());
        // old password no longer works, new one does
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(fresh))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"Rotated-Secret-99\"}"))
                .andExpect(status().isOk());
        // restore for other tests
        String tok = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"Rotated-Secret-99\"}"))
                .andReturn().getResponse().getContentAsString();
        String token = com.fasterxml.jackson.databind.ObjectMapper.class != null
                ? tok.split("\"token\":\"")[1].split("\"")[0] : tok;
        mockMvc.perform(withAuth(post("/api/auth/password"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Rotated-Secret-99\",\"newPassword\":\"" + ADMIN_PASSWORD + "\"}"))
                .andExpect(status().isOk());
    }
}
