package com.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CtaConfig(
        @NotBlank @Size(max = 100) String label,
        @NotBlank @Size(max = 512) String url,
        @Size(max = 20) String style) {}
