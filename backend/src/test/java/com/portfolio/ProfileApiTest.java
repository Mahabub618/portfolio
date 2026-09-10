package com.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProfileApiTest extends ApiTestBase {

    private static final String PROFILE_JSON = """
            {"name":"Test Person","tagline":"Engineer","intro":"Hello",
             "photoUrl":"https://example.com/p.jpg","photoAlt":"Me",
             "socialLinks":{"github":"https://github.com/test"},
             "ctas":[{"label":"Projects","url":"#projects","style":"primary"}],
             "resumeUrl":""}
            """;

    @Test
    void profileIsPublic() throws Exception {
        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Your Name"))
                .andExpect(jsonPath("$.data.ctas.length()").value(3));
    }

    @Test
    void profileUpdateRequiresAuth() throws Exception {
        mockMvc.perform(put("/api/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PROFILE_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void profileUpdateRoundTrip() throws Exception {
        String token = loginToken();
        mockMvc.perform(withAuth(put("/api/profile"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PROFILE_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Test Person"))
                .andExpect(jsonPath("$.data.socialLinks.github").value("https://github.com/test"))
                .andExpect(jsonPath("$.data.ctas[*].label", hasItem("Projects")));

        // change is visible on the public GET within the same transaction
        mockMvc.perform(get("/api/profile"))
                .andExpect(jsonPath("$.data.name").value("Test Person"));
    }

    @Test
    void profileUpdateValidatesName() throws Exception {
        String token = loginToken();
        mockMvc.perform(withAuth(put("/api/profile"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }
}
