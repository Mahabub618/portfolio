package com.portfolio.controller;

import com.portfolio.dto.AchievementDtos;
import com.portfolio.service.AchievementService;
import com.portfolio.web.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/achievements")
public class AchievementController {

    private final AchievementService achievementService;

    public AchievementController(AchievementService achievementService) {
        this.achievementService = achievementService;
    }

    @GetMapping
    public ApiResponse<List<AchievementDtos.Response>> list(@RequestParam(required = false) String category) {
        return ApiResponse.ok(achievementService.list(category));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AchievementDtos.Response>> create(@Valid @RequestBody AchievementDtos.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(achievementService.create(request)));
    }

    @PutMapping("/{id}")
    public ApiResponse<AchievementDtos.Response> update(@PathVariable UUID id,
                                                        @Valid @RequestBody AchievementDtos.Request request) {
        return ApiResponse.ok(achievementService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        achievementService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
