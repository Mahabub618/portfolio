package com.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Storage storage, Admin admin, Seed seed) {

    public record Jwt(String secret, long ttlMinutes) {}

    public record Cors(String allowedOrigins) {}

    public record Storage(String driver, long maxUploadBytes, String publicBaseUrl,
                          String localDir, String cloudinaryUrl, String cloudinaryFolder) {}

    public record Admin(String email, String password) {}

    public record Seed(boolean sampleData) {}
}
