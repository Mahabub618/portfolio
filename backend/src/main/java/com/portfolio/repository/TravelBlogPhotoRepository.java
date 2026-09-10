package com.portfolio.repository;

import com.portfolio.model.TravelBlogPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TravelBlogPhotoRepository extends JpaRepository<TravelBlogPhoto, UUID> {
    List<TravelBlogPhoto> findAllByBlogIdOrderByDisplayOrderAsc(UUID blogId);
    long countByBlogId(UUID blogId);
}
