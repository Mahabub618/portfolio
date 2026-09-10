package com.portfolio.repository;

import com.portfolio.model.Extracurricular;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExtracurricularRepository extends JpaRepository<Extracurricular, UUID> {
    List<Extracurricular> findAllByOrderByDisplayOrderAsc();
}
