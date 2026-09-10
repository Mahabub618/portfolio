package com.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Base64;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UploadApiTest extends ApiTestBase {

    // a real 1x1 transparent PNG
    private static final byte[] ONE_PX_PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    @Test
    void uploadStoresFileAndReturnsPublicUrl() throws Exception {
        String token = loginToken();
        mockMvc.perform(multipart("/api/uploads")
                        .file(new MockMultipartFile("file", "pixel.png", "image/png", ONE_PX_PNG))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.url", containsString("/uploads/")))
                .andExpect(jsonPath("$.data.width").value(1))
                .andExpect(jsonPath("$.data.height").value(1))
                .andExpect(jsonPath("$.data.mimeType").value("image/png"));
    }

    @Test
    void uploadRequiresAuth() throws Exception {
        mockMvc.perform(multipart("/api/uploads")
                        .file(new MockMultipartFile("file", "pixel.png", "image/png", ONE_PX_PNG)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void uploadRejectsUnsupportedType() throws Exception {
        String token = loginToken();
        mockMvc.perform(multipart("/api/uploads")
                        .file(new MockMultipartFile("file", "notes.txt", "text/plain", "hello".getBytes()))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_UPLOAD"));
    }
}
