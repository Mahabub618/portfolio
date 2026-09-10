package com.portfolio.controller;

import com.portfolio.dto.BlogDtos;
import com.portfolio.service.BlogService;
import com.portfolio.web.ApiResponse;
import com.portfolio.web.PageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/api/blogs")
public class BlogController {

    private final BlogService blogService;

    public BlogController(BlogService blogService) {
        this.blogService = blogService;
    }

    @GetMapping
    public ApiResponse<PageResponse<BlogDtos.SummaryResponse>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(blogService.list(page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<BlogDtos.DetailResponse> get(@PathVariable UUID id) {
        return ApiResponse.ok(blogService.get(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BlogDtos.DetailResponse>> create(@Valid @RequestBody BlogDtos.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(blogService.create(request)));
    }

    @PutMapping("/{id}")
    public ApiResponse<BlogDtos.DetailResponse> update(@PathVariable UUID id,
                                                       @Valid @RequestBody BlogDtos.Request request) {
        return ApiResponse.ok(blogService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        blogService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- nested photos ----------

    @PostMapping("/{id}/photos")
    public ResponseEntity<ApiResponse<BlogDtos.PhotoResponse>> addPhoto(
            @PathVariable UUID id, @Valid @RequestBody BlogDtos.PhotoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(blogService.addPhoto(id, request)));
    }

    @PutMapping("/{id}/photos/{photoId}")
    public ApiResponse<BlogDtos.PhotoResponse> updatePhoto(
            @PathVariable UUID id, @PathVariable UUID photoId,
            @Valid @RequestBody BlogDtos.PhotoUpdateRequest request) {
        return ApiResponse.ok(blogService.updatePhoto(id, photoId, request));
    }

    @PatchMapping("/{id}/photos/reorder")
    public ApiResponse<List<BlogDtos.PhotoResponse>> reorderPhotos(
            @PathVariable UUID id, @Valid @RequestBody BlogDtos.ReorderRequest request) {
        return ApiResponse.ok(blogService.reorderPhotos(id, request));
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID id, @PathVariable UUID photoId) {
        blogService.deletePhoto(id, photoId);
        return ResponseEntity.noContent().build();
    }
}
