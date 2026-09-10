package com.portfolio.dto;

import com.portfolio.model.Extracurricular;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class ExtracurricularDtos {

    private ExtracurricularDtos() {}

    public record Request(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 255) String organization,
            @Size(max = 255) String role,
            LocalDate startDate,
            LocalDate endDate,
            String description,
            Integer displayOrder) {}

    public record Response(
            UUID id,
            String title,
            String organization,
            String role,
            LocalDate startDate,
            LocalDate endDate,
            String description,
            int displayOrder,
            Instant createdAt,
            Instant updatedAt) {

        public static Response from(Extracurricular x) {
            return new Response(x.getId(), x.getTitle(), x.getOrganization(), x.getRole(),
                    x.getStartDate(), x.getEndDate(), x.getDescription(),
                    x.getDisplayOrder(), x.getCreatedAt(), x.getUpdatedAt());
        }
    }
}
