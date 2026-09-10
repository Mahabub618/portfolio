package com.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "travel_blog_photo")
public class TravelBlogPhoto {

    @Id
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "blog_id", nullable = false)
    private TravelBlog blog;

    @Column(name = "photo_url", nullable = false, length = 512)
    private String photoUrl;

    @Column(name = "alt_text")
    private String altText;

    @Column(columnDefinition = "text")
    private String caption;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    public UUID getId() { return id; }
    public TravelBlog getBlog() { return blog; }
    public void setBlog(TravelBlog blog) { this.blog = blog; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public String getAltText() { return altText; }
    public void setAltText(String altText) { this.altText = altText; }
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
}
