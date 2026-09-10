package com.portfolio.service;

import com.portfolio.dto.ProjectDtos;
import com.portfolio.model.Project;
import com.portfolio.repository.ProjectRepository;
import com.portfolio.web.NotFoundException;
import com.portfolio.web.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ProjectRepository projects;

    public ProjectService(ProjectRepository projects) {
        this.projects = projects;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectDtos.Response> list(int page, int size, String tag) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        String normalizedTag = Support.blankToNull(tag);

        Page<Project> result;
        if (normalizedTag != null) {
            result = projects.findByTag(normalizedTag, PageRequest.of(safePage - 1, safeSize));
        } else {
            Pageable pageable = PageRequest.of(safePage - 1, safeSize,
                    Sort.by("displayOrder").ascending().and(Sort.by("createdAt").descending()));
            result = projects.findAll(pageable);
        }
        return PageResponse.from(result, ProjectDtos.Response::from, safePage);
    }

    @Transactional(readOnly = true)
    public ProjectDtos.Response get(UUID id) {
        return ProjectDtos.Response.from(findOrThrow(id));
    }

    @Transactional
    public ProjectDtos.Response create(ProjectDtos.Request request) {
        Project project = new Project();
        apply(project, request);
        return ProjectDtos.Response.from(projects.save(project));
    }

    @Transactional
    public ProjectDtos.Response update(UUID id, ProjectDtos.Request request) {
        Project project = findOrThrow(id);
        apply(project, request);
        return ProjectDtos.Response.from(projects.save(project));
    }

    @Transactional
    public void delete(UUID id) {
        projects.delete(findOrThrow(id));
    }

    private Project findOrThrow(UUID id) {
        return projects.findById(id).orElseThrow(() -> new NotFoundException("Project", id));
    }

    private void apply(Project project, ProjectDtos.Request r) {
        project.setTitle(r.title().trim());
        project.setDescription(r.description().trim());
        project.setLongDescription(Support.blankToNull(r.longDescription()));
        project.setThumbnailUrl(Support.blankToNull(r.thumbnailUrl()));
        project.setThumbnailAlt(Support.blankToNull(r.thumbnailAlt()));
        project.setLiveUrl(Support.blankToNull(r.liveUrl()));
        project.setRepoUrl(Support.blankToNull(r.repoUrl()));
        List<String> tags = r.techTags() == null ? List.of()
                : r.techTags().stream()
                    .filter(t -> t != null && !t.isBlank())
                    .map(String::trim)
                    .distinct()
                    .toList();
        project.setTechTags(new ArrayList<>(tags));
        project.setDisplayOrder(Support.orZero(r.displayOrder()));
    }
}
