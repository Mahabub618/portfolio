package com.portfolio.repository;

import com.portfolio.model.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AchievementRepository extends JpaRepository<Achievement, UUID> {
    List<Achievement> findAllByOrderByDisplayOrderAsc();
    List<Achievement> findByCategoryOrderByDisplayOrderAsc(String category);
}
