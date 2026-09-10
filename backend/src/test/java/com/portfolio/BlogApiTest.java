package com.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.emptyString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BlogApiTest extends ApiTestBase {

    @Test
    void listIsPaginatedAndPublic() throws Exception {
        mockMvc.perform(get("/api/blogs").param("page", "1").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.total").value(greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.data.totalPages").value(greaterThanOrEqualTo(2)));
    }

    @Test
    void detailIncludesOrderedPhotos() throws Exception {
        String listBody = mockMvc.perform(get("/api/blogs"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String blogId = jsonField(listBody, "id");

        mockMvc.perform(get("/api/blogs/" + blogId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.photos.length()").value(greaterThanOrEqualTo(4)))
                .andExpect(jsonPath("$.data.photos[0].caption").value(not(emptyString())))
                .andExpect(jsonPath("$.data.photos[0].displayOrder").value(0));
    }

    @Test
    void photoLifecycleWithinBlog() throws Exception {
        String token = loginToken();

        String blog = mockMvc.perform(withAuth(post("/api/blogs"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Test Trip\",\"location\":\"Testville\",\"summary\":\"Testing\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String blogId = jsonField(blog, "id");

        String p1 = mockMvc.perform(withAuth(post("/api/blogs/" + blogId + "/photos"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"photoUrl\":\"https://example.com/1.jpg\",\"caption\":\"First\",\"altText\":\"one\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.displayOrder").value(0))
                .andReturn().getResponse().getContentAsString();
        String p1Id = jsonField(p1, "id");

        String p2 = mockMvc.perform(withAuth(post("/api/blogs/" + blogId + "/photos"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"photoUrl\":\"https://example.com/2.jpg\",\"caption\":\"Second\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.displayOrder").value(1))
                .andReturn().getResponse().getContentAsString();
        String p2Id = jsonField(p2, "id");

        // edit caption
        mockMvc.perform(withAuth(put("/api/blogs/" + blogId + "/photos/" + p1Id), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"photoUrl\":\"https://example.com/1.jpg\",\"caption\":\"First (edited)\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.caption").value("First (edited)"));

        // reorder: swap the two photos
        mockMvc.perform(withAuth(patch("/api/blogs/" + blogId + "/photos/reorder"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderedIds\":[\"" + p2Id + "\",\"" + p1Id + "\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(p2Id))
                .andExpect(jsonPath("$.data[1].id").value(p1Id));

        // delete one photo
        mockMvc.perform(withAuth(delete("/api/blogs/" + blogId + "/photos/" + p2Id), token))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/blogs/" + blogId))
                .andExpect(jsonPath("$.data.photos.length()").value(1));

        // deleting the blog cascades
        mockMvc.perform(withAuth(delete("/api/blogs/" + blogId), token))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/blogs/" + blogId))
                .andExpect(status().isNotFound());
    }

    @Test
    void reorderRejectsForeignIds() throws Exception {
        String token = loginToken();
        String blog = mockMvc.perform(withAuth(post("/api/blogs"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Reorder Trip\"}"))
                .andReturn().getResponse().getContentAsString();
        String blogId = jsonField(blog, "id");

        mockMvc.perform(withAuth(patch("/api/blogs/" + blogId + "/photos/reorder"), token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderedIds\":[\"11111111-1111-1111-1111-111111111111\"]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void photoManagementRequiresAuth() throws Exception {
        mockMvc.perform(post("/api/blogs/11111111-1111-1111-1111-111111111111/photos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"photoUrl\":\"https://example.com/x.jpg\"}"))
                .andExpect(status().isUnauthorized());
    }
}
