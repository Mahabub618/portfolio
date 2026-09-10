package com.portfolio.service;

import com.portfolio.dto.ExtracurricularDtos;
import com.portfolio.model.Extracurricular;
import com.portfolio.repository.ExtracurricularRepository;
import com.portfolio.web.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ExtracurricularService {

    private final ExtracurricularRepository activities;

    public ExtracurricularService(ExtracurricularRepository activities) {
        this.activities = activities;
    }

    @Transactional(readOnly = true)
    public List<ExtracurricularDtos.Response> list() {
        return activities.findAllByOrderByDisplayOrderAsc().stream()
                .map(ExtracurricularDtos.Response::from).toList();
    }

    @Transactional
    public ExtracurricularDtos.Response create(ExtracurricularDtos.Request request) {
        Extracurricular activity = new Extracurricular();
        apply(activity, request);
        return ExtracurricularDtos.Response.from(activities.save(activity));
    }

    @Transactional
    public ExtracurricularDtos.Response update(UUID id, ExtracurricularDtos.Request request) {
        Extracurricular activity = findOrThrow(id);
        apply(activity, request);
        return ExtracurricularDtos.Response.from(activities.save(activity));
    }

    @Transactional
    public void delete(UUID id) {
        activities.delete(findOrThrow(id));
    }

    private Extracurricular findOrThrow(UUID id) {
        return activities.findById(id).orElseThrow(() -> new NotFoundException("Activity", id));
    }

    private void apply(Extracurricular x, ExtracurricularDtos.Request r) {
        x.setTitle(r.title().trim());
        x.setOrganization(Support.blankToNull(r.organization()));
        x.setRole(Support.blankToNull(r.role()));
        x.setStartDate(r.startDate());
        x.setEndDate(r.endDate());
        x.setDescription(Support.blankToNull(r.description()));
        x.setDisplayOrder(Support.orZero(r.displayOrder()));
    }
}
