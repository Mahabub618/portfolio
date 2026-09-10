package com.portfolio.dto;

import com.portfolio.model.Achievement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class AchievementDtos {

    private AchievementDtos() {}

    public record Request(
            @NotBlank @Size(max = 100) String category,
            @NotBlank @Size(max = 255) String title,
            @Size(max = 100) String platform,
            @Size(max = 100) String rank,
            @Size(max = 50) String rating,
            @Size(max = 512) String standingUrl,
            LocalDate achievedDate,
            String description,
            Integer displayOrder) {}

    public record Response(
            UUID id,
            String category,
            String title,
            String platform,
            String rank,
            String rating,
            String standingUrl,
            LocalDate achievedDate,
            String description,
            int displayOrder,
            Instant createdAt,
            Instant updatedAt) {

        public static Response from(Achievement a) {
            return new Response(a.getId(), a.getCategory(), a.getTitle(), a.getPlatform(),
                    a.getRank(), a.getRating(), a.getStandingUrl(), a.getAchievedDate(),
                    a.getDescription(), a.getDisplayOrder(), a.getCreatedAt(), a.getUpdatedAt());
        }
    }
}
