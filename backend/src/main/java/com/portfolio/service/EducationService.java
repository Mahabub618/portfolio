package com.portfolio.service;

import com.portfolio.dto.EducationDtos;
import com.portfolio.model.EducationEntry;
import com.portfolio.repository.EducationRepository;
import com.portfolio.web.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class EducationService {

    private final EducationRepository education;

    public EducationService(EducationRepository education) {
        this.education = education;
    }

    @Transactional(readOnly = true)
    public List<EducationDtos.Response> list() {
        return education.findAllByOrderByDisplayOrderAsc().stream().map(EducationDtos.Response::from).toList();
    }

    @Transactional
    public EducationDtos.Response create(EducationDtos.Request request) {
        EducationEntry entry = new EducationEntry();
        apply(entry, request);
        return EducationDtos.Response.from(education.save(entry));
    }

    @Transactional
    public EducationDtos.Response update(UUID id, EducationDtos.Request request) {
        EducationEntry entry = findOrThrow(id);
        apply(entry, request);
        return EducationDtos.Response.from(education.save(entry));
    }

    @Transactional
    public void delete(UUID id) {
        education.delete(findOrThrow(id));
    }

    private EducationEntry findOrThrow(UUID id) {
        return education.findById(id).orElseThrow(() -> new NotFoundException("Education entry", id));
    }

    private void apply(EducationEntry entry, EducationDtos.Request r) {
        entry.setInstitution(r.institution().trim());
        entry.setDegree(r.degree().trim());
        entry.setFieldOfStudy(Support.blankToNull(r.fieldOfStudy()));
        entry.setStartDate(r.startDate());
        entry.setEndDate(r.endDate());
        entry.setGradeOrGpa(Support.blankToNull(r.gradeOrGpa()));
        entry.setDescription(Support.blankToNull(r.description()));
        entry.setDisplayOrder(Support.orZero(r.displayOrder()));
    }
}
