package com.portfolio.controller;

import com.portfolio.dto.ProfileDtos;
import com.portfolio.service.ProfileService;
import com.portfolio.web.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ApiResponse<ProfileDtos.Response> get() {
        return ApiResponse.ok(profileService.get());
    }

    @PutMapping
    public ApiResponse<ProfileDtos.Response> update(@Valid @RequestBody ProfileDtos.Request request) {
        return ApiResponse.ok(profileService.update(request));
    }
}
