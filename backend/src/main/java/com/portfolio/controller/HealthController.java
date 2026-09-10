package com.portfolio.controller;

import com.portfolio.web.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/api/health")
    public ApiResponse<Map<String, Object>> health() {
        boolean dbUp;
        try (Connection conn = dataSource.getConnection()) {
            dbUp = conn.isValid(2);
        } catch (Exception e) {
            dbUp = false;
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("status", dbUp ? "ok" : "degraded");
        data.put("version", "1.0.0");
        data.put("db", dbUp ? "up" : "down");
        return ApiResponse.ok(data);
    }
}
