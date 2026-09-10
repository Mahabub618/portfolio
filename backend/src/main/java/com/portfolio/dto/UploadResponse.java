package com.portfolio.dto;

public record UploadResponse(
        String url,
        Integer width,
        Integer height,
        long size,
        String mimeType) {}
