package com.portfolio.dto;

import com.portfolio.model.ProfileEntity;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class ProfileDtos {

    private ProfileDtos() {}

    public record Request(
            @NotBlank @Size(max = 255) String name,
            @Size(max = 255) String tagline,
            String intro,
            @Size(max = 512) String photoUrl,
            @Size(max = 255) String photoAlt,
            @Size(max = 512) String bannerImageUrl,
            @Size(max = 255) String bannerAlt,
            Map<String, String> socialLinks,
            @Valid List<CtaConfig> ctas,
            @Size(max = 512) String resumeUrl) {}

    public record Response(
            UUID id,
            String name,
            String tagline,
            String intro,
            String photoUrl,
            String photoAlt,
            String bannerImageUrl,
            String bannerAlt,
            Map<String, String> socialLinks,
            List<CtaConfig> ctas,
            String resumeUrl,
            Instant updatedAt) {

        public static Response from(ProfileEntity p) {
            return new Response(p.getId(), p.getName(), p.getTagline(), p.getIntro(),
                    p.getPhotoUrl(), p.getPhotoAlt(), p.getBannerImageUrl(), p.getBannerAlt(),
                    p.getSocialLinks(), p.getCtaConfig(), p.getResumeUrl(), p.getUpdatedAt());
        }
    }
}
