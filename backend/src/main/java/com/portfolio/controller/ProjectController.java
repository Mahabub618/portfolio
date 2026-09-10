package com.portfolio.controller;

import com.portfolio.dto.ProjectDtos;
import com.portfolio.service.ProjectService;
import com.portfolio.web.ApiResponse;
import com.portfolio.web.PageResponse;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ApiResponse<PageResponse<ProjectDtos.Response>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String tag) {
        return ApiResponse.ok(projectService.list(page, size, tag));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProjectDtos.Response> get(@PathVariable UUID id) {
        return ApiResponse.ok(projectService.get(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectDtos.Response>> create(@Valid @RequestBody ProjectDtos.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(projectService.create(request)));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProjectDtos.Response> update(@PathVariable UUID id,
                                                    @Valid @RequestBody ProjectDtos.Request request) {
        return ApiResponse.ok(projectService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
