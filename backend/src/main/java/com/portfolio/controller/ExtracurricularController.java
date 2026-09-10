package com.portfolio.controller;

import com.portfolio.dto.ExtracurricularDtos;
import com.portfolio.service.ExtracurricularService;
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
@RequestMapping("/api/extracurricular")
public class ExtracurricularController {

    private final ExtracurricularService extracurricularService;

    public ExtracurricularController(ExtracurricularService extracurricularService) {
        this.extracurricularService = extracurricularService;
    }

    @GetMapping
    public ApiResponse<List<ExtracurricularDtos.Response>> list() {
        return ApiResponse.ok(extracurricularService.list());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExtracurricularDtos.Response>> create(@Valid @RequestBody ExtracurricularDtos.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(extracurricularService.create(request)));
    }

    @PutMapping("/{id}")
    public ApiResponse<ExtracurricularDtos.Response> update(@PathVariable UUID id,
                                                            @Valid @RequestBody ExtracurricularDtos.Request request) {
        return ApiResponse.ok(extracurricularService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        extracurricularService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
