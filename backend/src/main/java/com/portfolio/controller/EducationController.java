package com.portfolio.controller;

import com.portfolio.dto.EducationDtos;
import com.portfolio.service.EducationService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/education")
public class EducationController {

    private final EducationService educationService;

    public EducationController(EducationService educationService) {
        this.educationService = educationService;
    }

    @GetMapping
    public ApiResponse<List<EducationDtos.Response>> list() {
        return ApiResponse.ok(educationService.list());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EducationDtos.Response>> create(@Valid @RequestBody EducationDtos.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(educationService.create(request)));
    }

    @PutMapping("/{id}")
    public ApiResponse<EducationDtos.Response> update(@PathVariable UUID id,
                                                      @Valid @RequestBody EducationDtos.Request request) {
        return ApiResponse.ok(educationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        educationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
