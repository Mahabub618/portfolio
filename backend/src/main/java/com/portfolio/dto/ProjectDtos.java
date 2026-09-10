package com.portfolio.dto;

import com.portfolio.model.Project;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class ProjectDtos {

    private ProjectDtos() {}

    public record Request(
            @NotBlank @Size(max = 255) String title,
            @NotBlank String description,
            String longDescription,
            @Size(max = 512) String thumbnailUrl,
            @Size(max = 255) String thumbnailAlt,
            @Size(max = 512) String liveUrl,
            @Size(max = 512) String repoUrl,
            List<@Size(max = 50) String> techTags,
            Integer displayOrder) {}

    public record Response(
            UUID id,
            String title,
            String description,
            String longDescription,
            String thumbnailUrl,
            String thumbnailAlt,
            String liveUrl,
            String repoUrl,
            List<String> techTags,
            int displayOrder,
            Instant createdAt,
            Instant updatedAt) {

        public static Response from(Project p) {
            return new Response(p.getId(), p.getTitle(), p.getDescription(), p.getLongDescription(),
                    p.getThumbnailUrl(), p.getThumbnailAlt(), p.getLiveUrl(), p.getRepoUrl(),
                    p.getTechTags(), p.getDisplayOrder(), p.getCreatedAt(), p.getUpdatedAt());
        }
    }
}
