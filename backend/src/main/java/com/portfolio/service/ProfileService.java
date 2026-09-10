package com.portfolio.service;

import com.portfolio.dto.CtaConfig;
import com.portfolio.dto.ProfileDtos;
import com.portfolio.model.ProfileEntity;
import com.portfolio.repository.ProfileRepository;
import com.portfolio.web.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;

@Service
public class ProfileService {

    private final ProfileRepository profiles;

    public ProfileService(ProfileRepository profiles) {
        this.profiles = profiles;
    }

    @Transactional(readOnly = true)
    public ProfileDtos.Response get() {
        ProfileEntity profile = profiles.findFirstByOrderByCreatedAtAsc()
                .orElseThrow(() -> new NotFoundException("Profile", "(not created yet)"));
        return ProfileDtos.Response.from(profile);
    }

    @Transactional
    public ProfileDtos.Response update(ProfileDtos.Request request) {
        ProfileEntity profile = profiles.findFirstByOrderByCreatedAtAsc().orElseGet(ProfileEntity::new);
        profile.setName(request.name().trim());
        profile.setTagline(Support.blankToNull(request.tagline()));
        profile.setIntro(Support.blankToNull(request.intro()));
        profile.setPhotoUrl(Support.blankToNull(request.photoUrl()));
        profile.setPhotoAlt(Support.blankToNull(request.photoAlt()));
        profile.setBannerImageUrl(Support.blankToNull(request.bannerImageUrl()));
        profile.setBannerAlt(Support.blankToNull(request.bannerAlt()));
        profile.setSocialLinks(request.socialLinks() == null ? new LinkedHashMap<>() : new LinkedHashMap<>(request.socialLinks()));
        profile.setCtaConfig(request.ctas() == null ? new ArrayList<CtaConfig>() : new ArrayList<>(request.ctas()));
        profile.setResumeUrl(Support.blankToNull(request.resumeUrl()));
        return ProfileDtos.Response.from(profiles.save(profile));
    }
}
