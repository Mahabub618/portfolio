package com.portfolio.web;

import java.util.Map;

public record ApiResponse<T>(T data, ApiError error) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(data, null);
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(null, new ApiError(code, message, null));
    }

    public static <T> ApiResponse<T> error(String code, String message, Map<String, String> details) {
        return new ApiResponse<>(null, new ApiError(code, message, details));
    }
}
