package com.portfolio.model;

import com.portfolio.dto.CtaConfig;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "profile")
public class ProfileEntity {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String tagline;

    @Column(columnDefinition = "text")
    private String intro;

    @Column(name = "photo_url", length = 512)
    private String photoUrl;

    @Column(name = "photo_alt")
    private String photoAlt;

    @Column(name = "banner_image_url", length = 512)
    private String bannerImageUrl;

    @Column(name = "banner_alt")
    private String bannerAlt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "social_links", columnDefinition = "jsonb", nullable = false)
    private Map<String, String> socialLinks = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "cta_config", columnDefinition = "jsonb", nullable = false)
    private List<CtaConfig> ctaConfig = new ArrayList<>();

    @Column(name = "resume_url", length = 512)
    private String resumeUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); updatedAt = createdAt; }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTagline() { return tagline; }
    public void setTagline(String tagline) { this.tagline = tagline; }
    public String getIntro() { return intro; }
    public void setIntro(String intro) { this.intro = intro; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public String getPhotoAlt() { return photoAlt; }
    public void setPhotoAlt(String photoAlt) { this.photoAlt = photoAlt; }
    public String getBannerImageUrl() { return bannerImageUrl; }
    public void setBannerImageUrl(String bannerImageUrl) { this.bannerImageUrl = bannerImageUrl; }
    public String getBannerAlt() { return bannerAlt; }
    public void setBannerAlt(String bannerAlt) { this.bannerAlt = bannerAlt; }
    public Map<String, String> getSocialLinks() { return socialLinks; }
    public void setSocialLinks(Map<String, String> socialLinks) { this.socialLinks = socialLinks; }
    public List<CtaConfig> getCtaConfig() { return ctaConfig; }
    public void setCtaConfig(List<CtaConfig> ctaConfig) { this.ctaConfig = ctaConfig; }
    public String getResumeUrl() { return resumeUrl; }
    public void setResumeUrl(String resumeUrl) { this.resumeUrl = resumeUrl; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
