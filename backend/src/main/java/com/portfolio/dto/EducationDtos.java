package com.portfolio.dto;

import com.portfolio.model.EducationEntry;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public final class EducationDtos {

    private EducationDtos() {}

    public record Request(
            @NotBlank @Size(max = 255) String institution,
            @NotBlank @Size(max = 255) String degree,
            @Size(max = 255) String fieldOfStudy,
            LocalDate startDate,
            LocalDate endDate,
            @Size(max = 50) String gradeOrGpa,
            String description,
            Integer displayOrder) {}

    public record Response(
            UUID id,
            String institution,
            String degree,
            String fieldOfStudy,
            LocalDate startDate,
            LocalDate endDate,
            String gradeOrGpa,
            String description,
            int displayOrder,
            Instant createdAt,
            Instant updatedAt) {

        public static Response from(EducationEntry e) {
            return new Response(e.getId(), e.getInstitution(), e.getDegree(), e.getFieldOfStudy(),
                    e.getStartDate(), e.getEndDate(), e.getGradeOrGpa(), e.getDescription(),
                    e.getDisplayOrder(), e.getCreatedAt(), e.getUpdatedAt());
        }
    }
}
