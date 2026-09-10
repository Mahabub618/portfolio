package com.portfolio.service;

import com.portfolio.config.AppProperties;
import com.portfolio.dto.CtaConfig;
import com.portfolio.model.Achievement;
import com.portfolio.model.EducationEntry;
import com.portfolio.model.Extracurricular;
import com.portfolio.model.ProfileEntity;
import com.portfolio.model.Project;
import com.portfolio.model.TravelBlog;
import com.portfolio.model.TravelBlogPhoto;
import com.portfolio.model.AdminUser;
import com.portfolio.repository.AchievementRepository;
import com.portfolio.repository.AdminUserRepository;
import com.portfolio.repository.EducationRepository;
import com.portfolio.repository.ExtracurricularRepository;
import com.portfolio.repository.ProfileRepository;
import com.portfolio.repository.ProjectRepository;
import com.portfolio.repository.TravelBlogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * On first boot: creates the admin user from ADMIN_EMAIL / ADMIN_PASSWORD,
 * and (when SEED_SAMPLE_DATA=true) inserts sample portfolio content so the
 * frontend has something to render immediately. Safe to run on every boot —
 * it only acts when the corresponding tables are empty.
 */
@Component
public class SeedService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedService.class);

    private final AppProperties props;
    private final PasswordEncoder passwordEncoder;
    private final AdminUserRepository adminUsers;
    private final ProfileRepository profiles;
    private final ProjectRepository projects;
    private final EducationRepository education;
    private final AchievementRepository achievements;
    private final ExtracurricularRepository activities;
    private final TravelBlogRepository blogs;

    public SeedService(AppProperties props, PasswordEncoder passwordEncoder,
                       AdminUserRepository adminUsers, ProfileRepository profiles,
                       ProjectRepository projects, EducationRepository education,
                       AchievementRepository achievements, ExtracurricularRepository activities,
                       TravelBlogRepository blogs) {
        this.props = props;
        this.passwordEncoder = passwordEncoder;
        this.adminUsers = adminUsers;
        this.profiles = profiles;
        this.projects = projects;
        this.education = education;
        this.achievements = achievements;
        this.activities = activities;
        this.blogs = blogs;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedAdmin();
        if (props.seed().sampleData() && profiles.count() == 0) {
            seedSampleContent();
            log.info("Seeded sample portfolio content (profile, projects, education, achievements, activities, blogs).");
        }
    }

    private void seedAdmin() {
        if (adminUsers.count() > 0) {
            return;
        }
        String email = props.admin().email();
        String password = props.admin().password();
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            log.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin creation. "
                   + "Set them in the environment to enable /api/auth/login.");
            return;
        }
        AdminUser admin = new AdminUser();
        admin.setEmail(email.trim().toLowerCase());
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setCreatedAt(java.time.Instant.now());
        adminUsers.save(admin);
        log.info("Seeded admin user {}", admin.getEmail());
    }

    private void seedSampleContent() {
        // ---- profile ----
        ProfileEntity profile = new ProfileEntity();
        profile.setName("Your Name");
        profile.setTagline("Software Engineer · Full-Stack & Algorithms");
        profile.setIntro("I design and build fast, thoughtful software — from competitive-programming tooling to photo-rich web experiences. This is sample content: edit everything from /admin.");
        profile.setPhotoUrl("https://picsum.photos/seed/profile-photo/600/600");
        profile.setPhotoAlt("Portrait photo");
        profile.setBannerImageUrl("https://picsum.photos/seed/hero-banner/2400/1400");
        profile.setBannerAlt("Abstract banner background");
        Map<String, String> socials = new LinkedHashMap<>();
        socials.put("github", "https://github.com/yourhandle");
        socials.put("linkedin", "https://linkedin.com/in/yourhandle");
        socials.put("codeforces", "https://codeforces.com/profile/yourhandle");
        profile.setSocialLinks(socials);
        profile.setCtaConfig(new ArrayList<>(List.of(
                new CtaConfig("View Projects", "#projects", "primary"),
                new CtaConfig("Download Résumé", "#", "secondary"),
                new CtaConfig("Contact Me", "#contact", "secondary"))));
        profiles.save(profile);

        // ---- projects ----
        projects.save(project("Transit Pulse",
                "Real-time city bus tracking with live ETAs and disruption alerts.",
                "Built during a hackathon and kept alive since. Ingests GTFS-realtime feeds, smooths GPS jitter with a Kalman filter, and pushes vehicle positions to browsers over WebSockets.",
                "https://picsum.photos/seed/project-transit/1200/800", "Bus tracking map screenshot",
                "https://example.com", "https://github.com/yourhandle/transit-pulse",
                List.of("Angular", "Go", "PostgreSQL", "WebSockets"), 0));
        projects.save(project("Markdown Ledger",
                "Plain-text accounting app where every entry is a Markdown file you own.",
                "A desktop-first PWA with offline sync. Files stay in your git repo; the app is just a lens over them.",
                "https://picsum.photos/seed/project-ledger/1200/800", "Ledger dashboard screenshot",
                null, "https://github.com/yourhandle/markdown-ledger",
                List.of("Angular", "TypeScript", "IndexedDB"), 1));
        projects.save(project("Photon Gallery",
                "Self-hosted photography portfolio with client-side image pipeline.",
                "Generates responsive variants and blur-up placeholders at upload time; serves them from object storage with signed URLs.",
                "https://picsum.photos/seed/project-photon/1200/800", "Photo gallery screenshot",
                null, "https://github.com/yourhandle/photon-gallery",
                List.of("Spring Boot", "Java", "S3"), 2));

        // ---- education ----
        education.save(educationEntry("University of Engineering & Technology",
                "B.Sc. in Computer Science & Engineering", "Algorithms & Systems",
                LocalDate.of(2019, 1, 10), LocalDate.of(2023, 12, 20), "3.78 / 4.00",
                "Thesis: latency-aware task scheduling for edge clusters. Teaching assistant for Data Structures (2 semesters).", 0));
        education.save(educationEntry("Online & Certifications",
                "Continuous learning", "Distributed systems, ML engineering",
                LocalDate.of(2024, 1, 1), null, null,
                "Ongoing: distributed systems reading group, cloud certifications.", 1));

        // ---- achievements ----
        achievements.save(achievement("competitive-programming", "Codeforces — Expert rating",
                "Codeforces", "Best rank 412 (Div. 2)", "1850", "https://codeforces.com/profile/yourhandle",
                LocalDate.of(2023, 7, 15), "Reached Expert (cyan→blue) after 60+ rated contests.", 0));
        achievements.save(achievement("competitive-programming", "ICPC Asia Regional — 42nd",
                "ICPC", "42nd / 1,850 teams", null, null,
                LocalDate.of(2022, 11, 20), "Three-person team; solved 7/11 problems on site.", 1));
        achievements.save(achievement("hackathon", "Winner — National Hackathon 2023",
                "National Hackathon", "1st / 240 teams", null, null,
                LocalDate.of(2023, 3, 5), "Built the first version of Transit Pulse in 36 hours.", 2));

        // ---- extracurricular ----
        activities.save(activity("Competitive Programming Club", "President",
                "University CP Club", LocalDate.of(2022, 1, 1), LocalDate.of(2023, 12, 31),
                "Ran weekly practice contests and mentorship circles for ~120 members.", 0));
        activities.save(activity("Photography & Travel", "Hobby → this site",
                "Independent", LocalDate.of(2021, 6, 1), null,
                "Landscape and street photography; the travel blog section is my archive.", 1));

        // ---- travel blogs ----
        blogs.save(blog("Sundarbans by Boat", "Sundarbans, Bangladesh", LocalDate.of(2025, 12, 18),
                "https://picsum.photos/seed/sundarban-cover/1600/1000", "Mangrove canal at dawn",
                "Four days through the world's largest mangrove delta — canals, silence, and the occasional kingfisher.",
                0, List.of(
                    photo("https://picsum.photos/seed/sundarban-1/1600/1000", "Narrow canal between mangrove walls", "The boat slips into a canal barely wider than its hull.", 0),
                    photo("https://picsum.photos/seed/sundarban-2/1600/1000", "Fog over the river at sunrise", "Sunrise fog settles over the river; the engine cuts and everything goes quiet.", 1),
                    photo("https://picsum.photos/seed/sundarban-3/1600/1000", "Kingfisher on a branch", "A kingfisher waits, absolutely still, then is gone.", 2),
                    photo("https://picsum.photos/seed/sundarban-4/1600/1000", "Fisher boats in the evening", "Fisher boats head home before the light does.", 3),
                    photo("https://picsum.photos/seed/sundarban-5/1600/1000", "Watchtower view over the delta", "From the watchtower the delta looks like green lace.", 4))));
        blogs.save(blog("Sylhet: Tea & Rain", "Sylhet, Bangladesh", LocalDate.of(2026, 7, 8),
                "https://picsum.photos/seed/sylhet-cover/1600/1000", "Terraced tea garden in rain",
                "Monsoon week among tea terraces, waterfalls and the flattest greens you will ever see.",
                1, List.of(
                    photo("https://picsum.photos/seed/sylhet-1/1600/1000", "Tea terraces after rain", "Rainpolish on the tea terraces at Malnicherra.", 0),
                    photo("https://picsum.photos/seed/sylhet-2/1600/1000", "Waterfall in the hills", "Bisnakandi: stones, current, and low monsoon clouds.", 1),
                    photo("https://picsum.photos/seed/sylhet-3/1600/1000", "Boatman on the river", "A boatman poles upstream without hurrying.", 2),
                    photo("https://picsum.photos/seed/sylhet-4/1600/1000", "Green hills at dusk", "The hills turn ink-blue just before dusk.", 3))));
    }

    // ---- small builders ----

    private Project project(String title, String description, String longDescription,
                            String thumbnailUrl, String thumbnailAlt, String liveUrl, String repoUrl,
                            List<String> techTags, int order) {
        Project p = new Project();
        p.setTitle(title);
        p.setDescription(description);
        p.setLongDescription(longDescription);
        p.setThumbnailUrl(thumbnailUrl);
        p.setThumbnailAlt(thumbnailAlt);
        p.setLiveUrl(liveUrl);
        p.setRepoUrl(repoUrl);
        p.setTechTags(new ArrayList<>(techTags));
        p.setDisplayOrder(order);
        return p;
    }

    private EducationEntry educationEntry(String institution, String degree, String field,
                                          LocalDate start, LocalDate end, String gpa, String description, int order) {
        EducationEntry e = new EducationEntry();
        e.setInstitution(institution);
        e.setDegree(degree);
        e.setFieldOfStudy(field);
        e.setStartDate(start);
        e.setEndDate(end);
        e.setGradeOrGpa(gpa);
        e.setDescription(description);
        e.setDisplayOrder(order);
        return e;
    }

    private Achievement achievement(String category, String title, String platform, String rank,
                                    String rating, String standingUrl, LocalDate date, String description, int order) {
        Achievement a = new Achievement();
        a.setCategory(category);
        a.setTitle(title);
        a.setPlatform(platform);
        a.setRank(rank);
        a.setRating(rating);
        a.setStandingUrl(standingUrl);
        a.setAchievedDate(date);
        a.setDescription(description);
        a.setDisplayOrder(order);
        return a;
    }

    private Extracurricular activity(String title, String role, String organization,
                                     LocalDate start, LocalDate end, String description, int order) {
        Extracurricular x = new Extracurricular();
        x.setTitle(title);
        x.setRole(role);
        x.setOrganization(organization);
        x.setStartDate(start);
        x.setEndDate(end);
        x.setDescription(description);
        x.setDisplayOrder(order);
        return x;
    }

    private TravelBlog blog(String title, String location, LocalDate date, String coverUrl, String coverAlt,
                            String summary, int order, List<TravelBlogPhoto> photos) {
        TravelBlog b = new TravelBlog();
        b.setTitle(title);
        b.setLocation(location);
        b.setBlogDate(date);
        b.setCoverPhotoUrl(coverUrl);
        b.setCoverPhotoAlt(coverAlt);
        b.setSummary(summary);
        b.setDisplayOrder(order);
        for (TravelBlogPhoto p : photos) {
            p.setBlog(b);
            b.getPhotos().add(p);
        }
        return b;
    }

    private TravelBlogPhoto photo(String url, String alt, String caption, int order) {
        TravelBlogPhoto p = new TravelBlogPhoto();
        p.setPhotoUrl(url);
        p.setAltText(alt);
        p.setCaption(caption);
        p.setDisplayOrder(order);
        return p;
    }
}
