package com.portfolio.repository;

import com.portfolio.model.EducationEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EducationRepository extends JpaRepository<EducationEntry, UUID> {
    List<EducationEntry> findAllByOrderByDisplayOrderAsc();
}
