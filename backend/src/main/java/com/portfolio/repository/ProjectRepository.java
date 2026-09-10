package com.portfolio.repository;

import com.portfolio.model.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    @Query(value = """
            SELECT * FROM project
            WHERE tech_tags @> ARRAY[:tag]::text[]
            ORDER BY display_order ASC, created_at DESC
            """,
           countQuery = """
            SELECT count(*) FROM project
            WHERE tech_tags @> ARRAY[:tag]::text[]
            """,
           nativeQuery = true)
    Page<Project> findByTag(@Param("tag") String tag, Pageable pageable);
}
