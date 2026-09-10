package com.portfolio.dto;

import com.portfolio.model.TravelBlog;
import com.portfolio.model.TravelBlogPhoto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class BlogDtos {

    private BlogDtos() {}

    public record Request(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 255) String location,
            LocalDate blogDate,
            @Size(max = 512) String coverPhotoUrl,
            @Size(max = 255) String coverPhotoAlt,
            String summary,
            Integer displayOrder) {}

    public record SummaryResponse(
            UUID id,
            String title,
            String location,
            LocalDate blogDate,
            String coverPhotoUrl,
            String coverPhotoAlt,
            String summary,
            int displayOrder) {

        public static SummaryResponse from(TravelBlog b) {
            return new SummaryResponse(b.getId(), b.getTitle(), b.getLocation(), b.getBlogDate(),
                    b.getCoverPhotoUrl(), b.getCoverPhotoAlt(), b.getSummary(), b.getDisplayOrder());
        }
    }

    public record PhotoResponse(
            UUID id,
            String photoUrl,
            String altText,
            String caption,
            int displayOrder) {

        public static PhotoResponse from(TravelBlogPhoto p) {
            return new PhotoResponse(p.getId(), p.getPhotoUrl(), p.getAltText(), p.getCaption(), p.getDisplayOrder());
        }
    }

    public record DetailResponse(
            UUID id,
            String title,
            String location,
            LocalDate blogDate,
            String coverPhotoUrl,
            String coverPhotoAlt,
            String summary,
            int displayOrder,
            Instant createdAt,
            Instant updatedAt,
            List<PhotoResponse> photos) {

        public static DetailResponse from(TravelBlog b) {
            return new DetailResponse(b.getId(), b.getTitle(), b.getLocation(), b.getBlogDate(),
                    b.getCoverPhotoUrl(), b.getCoverPhotoAlt(), b.getSummary(), b.getDisplayOrder(),
                    b.getCreatedAt(), b.getUpdatedAt(),
                    b.getPhotos().stream().map(PhotoResponse::from).toList());
        }
    }

    public record PhotoRequest(
            @NotBlank @Size(max = 512) String photoUrl,
            @Size(max = 255) String altText,
            String caption,
            Integer displayOrder) {}

    public record PhotoUpdateRequest(
            @NotBlank @Size(max = 512) String photoUrl,
            @Size(max = 255) String altText,
            String caption,
            Integer displayOrder) {}

    public record ReorderRequest(@NotEmpty List<UUID> orderedIds) {}
}
