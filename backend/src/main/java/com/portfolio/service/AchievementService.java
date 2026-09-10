package com.portfolio.service;

import com.portfolio.dto.AchievementDtos;
import com.portfolio.model.Achievement;
import com.portfolio.repository.AchievementRepository;
import com.portfolio.web.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AchievementService {

    private final AchievementRepository achievements;

    public AchievementService(AchievementRepository achievements) {
        this.achievements = achievements;
    }

    @Transactional(readOnly = true)
    public List<AchievementDtos.Response> list(String category) {
        String normalized = Support.blankToNull(category);
        List<Achievement> items = normalized == null
                ? achievements.findAllByOrderByDisplayOrderAsc()
                : achievements.findByCategoryOrderByDisplayOrderAsc(normalized);
        return items.stream().map(AchievementDtos.Response::from).toList();
    }

    @Transactional
    public AchievementDtos.Response create(AchievementDtos.Request request) {
        Achievement achievement = new Achievement();
        apply(achievement, request);
        return AchievementDtos.Response.from(achievements.save(achievement));
    }

    @Transactional
    public AchievementDtos.Response update(UUID id, AchievementDtos.Request request) {
        Achievement achievement = findOrThrow(id);
        apply(achievement, request);
        return AchievementDtos.Response.from(achievements.save(achievement));
    }

    @Transactional
    public void delete(UUID id) {
        achievements.delete(findOrThrow(id));
    }

    private Achievement findOrThrow(UUID id) {
        return achievements.findById(id).orElseThrow(() -> new NotFoundException("Achievement", id));
    }

    private void apply(Achievement a, AchievementDtos.Request r) {
        a.setCategory(r.category().trim());
        a.setTitle(r.title().trim());
        a.setPlatform(Support.blankToNull(r.platform()));
        a.setRank(Support.blankToNull(r.rank()));
        a.setRating(Support.blankToNull(r.rating()));
        a.setStandingUrl(Support.blankToNull(r.standingUrl()));
        a.setAchievedDate(r.achievedDate());
        a.setDescription(Support.blankToNull(r.description()));
        a.setDisplayOrder(Support.orZero(r.displayOrder()));
    }
}
