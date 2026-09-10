package com.portfolio.web;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

public record PageResponse<T>(List<T> items, int page, int size, long total, int totalPages) {

    public static <E, T> PageResponse<T> from(Page<E> page, Function<E, T> mapper, int requestedPage) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                requestedPage,
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}
