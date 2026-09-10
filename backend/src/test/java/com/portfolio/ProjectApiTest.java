package com.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.emptyString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProjectApiTest extends ApiTestBase {

    @Test
    void publicListReturnsSeededProjectsInEnvelope() throws Exception {
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(3))
                .andExpect(jsonPath("$.data.page").value(1))
                .andExpect(jsonPath("$.data.total").value(3))
                .andExpect(jsonPath("$.data.items[0].title").value(not(emptyString())));
    }

    @Test
    void tagFilterUsesArrayContainment() throws Exception {
        mockMvc.perform(get("/api/projects").param("tag", "Go"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.items[0].techTags", hasItem("Go")));
    }

    @Test
    void fullCrudRoundTrip() throws Exception {
        String token = loginToken();

        String created = mockMvc.perform(withAuth(post("/api/projects"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"title":"Test Project","description":"A temporary project",
                             "techTags":["Angular","Go"],"displayOrder":99,
                             "liveUrl":"https://example.com","repoUrl":""}
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(not(emptyString())))
                .andExpect(jsonPath("$.data.techTags.length()").value(2))
                .andReturn().getResponse().getContentAsString();
        String id = jsonField(created, "id");

        mockMvc.perform(get("/api/projects/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Test Project"));

        mockMvc.perform(withAuth(put("/api/projects/" + id), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"title":"Renamed Project","description":"Updated",
                             "techTags":["Spring"],"displayOrder":1}
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Renamed Project"))
                .andExpect(jsonPath("$.data.techTags", hasItem("Spring")));

        mockMvc.perform(withAuth(delete("/api/projects/" + id), token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/projects/" + id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void updateUnknownProjectIs404() throws Exception {
        String token = loginToken();
        mockMvc.perform(withAuth(put("/api/projects/00000000-0000-0000-0000-000000000000"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"x\",\"description\":\"y\"}"))
                .andExpect(status().isNotFound());
    }
}
