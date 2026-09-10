package com.portfolio.repository;

import com.portfolio.model.TravelBlog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TravelBlogRepository extends JpaRepository<TravelBlog, UUID> {
}
