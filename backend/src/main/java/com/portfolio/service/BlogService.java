package com.portfolio.service;

import com.portfolio.dto.BlogDtos;
import com.portfolio.model.TravelBlog;
import com.portfolio.model.TravelBlogPhoto;
import com.portfolio.repository.TravelBlogRepository;
import com.portfolio.web.NotFoundException;
import com.portfolio.web.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BlogService {

    private static final int MAX_PAGE_SIZE = 50;

    private final TravelBlogRepository blogs;

    public BlogService(TravelBlogRepository blogs) {
        this.blogs = blogs;
    }

    @Transactional(readOnly = true)
    public PageResponse<BlogDtos.SummaryResponse> list(int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(safePage - 1, safeSize,
                Sort.by("displayOrder").ascending()
                        .and(Sort.by(Sort.Order.desc("blogDate").with(Sort.NullHandling.NULLS_LAST))));
        Page<TravelBlog> result = blogs.findAll(pageable);
        return PageResponse.from(result, BlogDtos.SummaryResponse::from, safePage);
    }

    @Transactional(readOnly = true)
    public BlogDtos.DetailResponse get(UUID id) {
        return BlogDtos.DetailResponse.from(findOrThrow(id));
    }

    @Transactional
    public BlogDtos.DetailResponse create(BlogDtos.Request request) {
        TravelBlog blog = new TravelBlog();
        apply(blog, request);
        return BlogDtos.DetailResponse.from(blogs.save(blog));
    }

    @Transactional
    public BlogDtos.DetailResponse update(UUID id, BlogDtos.Request request) {
        TravelBlog blog = findOrThrow(id);
        apply(blog, request);
        return BlogDtos.DetailResponse.from(blogs.save(blog));
    }

    @Transactional
    public void delete(UUID id) {
        blogs.delete(findOrThrow(id));
    }

    // ---------- nested photos ----------

    @Transactional
    public BlogDtos.PhotoResponse addPhoto(UUID blogId, BlogDtos.PhotoRequest request) {
        TravelBlog blog = findOrThrow(blogId);
        TravelBlogPhoto photo = new TravelBlogPhoto();
        photo.setBlog(blog);
        photo.setPhotoUrl(request.photoUrl().trim());
        photo.setAltText(Support.blankToNull(request.altText()));
        photo.setCaption(Support.blankToNull(request.caption()));
        photo.setDisplayOrder(request.displayOrder() != null
                ? request.displayOrder()
                : blog.getPhotos().stream().mapToInt(TravelBlogPhoto::getDisplayOrder).max().orElse(-1) + 1);
        blog.getPhotos().add(photo);
        blogs.flush(); // blog is managed: flush cascade-persists the photo in place, assigning its UUID
        return BlogDtos.PhotoResponse.from(photo);
    }

    @Transactional
    public BlogDtos.PhotoResponse updatePhoto(UUID blogId, UUID photoId, BlogDtos.PhotoUpdateRequest request) {
        TravelBlogPhoto photo = findPhoto(blogId, photoId);
        photo.setPhotoUrl(request.photoUrl().trim());
        photo.setAltText(Support.blankToNull(request.altText()));
        photo.setCaption(Support.blankToNull(request.caption()));
        if (request.displayOrder() != null) {
            photo.setDisplayOrder(request.displayOrder());
        }
        return BlogDtos.PhotoResponse.from(photo);
    }

    @Transactional
    public List<BlogDtos.PhotoResponse> reorderPhotos(UUID blogId, BlogDtos.ReorderRequest request) {
        TravelBlog blog = findOrThrow(blogId);
        Map<UUID, TravelBlogPhoto> byId = blog.getPhotos().stream()
                .collect(Collectors.toMap(TravelBlogPhoto::getId, Function.identity()));
        if (request.orderedIds().size() != byId.size() || !byId.keySet().containsAll(request.orderedIds())) {
            throw new IllegalArgumentException("orderedIds must contain exactly the blog's photo ids");
        }
        for (int i = 0; i < request.orderedIds().size(); i++) {
            byId.get(request.orderedIds().get(i)).setDisplayOrder(i);
        }
        blogs.save(blog);
        return blog.getPhotos().stream()
                .sorted(Comparator.comparingInt(TravelBlogPhoto::getDisplayOrder))
                .map(BlogDtos.PhotoResponse::from)
                .toList();
    }

    @Transactional
    public void deletePhoto(UUID blogId, UUID photoId) {
        TravelBlog blog = findOrThrow(blogId);
        TravelBlogPhoto photo = findPhoto(blogId, photoId);
        blog.getPhotos().remove(photo); // orphanRemoval deletes the row
        blogs.save(blog);
    }

    private TravelBlog findOrThrow(UUID id) {
        return blogs.findById(id).orElseThrow(() -> new NotFoundException("Travel blog", id));
    }

    private TravelBlogPhoto findPhoto(UUID blogId, UUID photoId) {
        TravelBlog blog = findOrThrow(blogId);
        return blog.getPhotos().stream()
                .filter(p -> p.getId().equals(photoId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Blog photo", photoId));
    }

    private void apply(TravelBlog blog, BlogDtos.Request r) {
        blog.setTitle(r.title().trim());
        blog.setLocation(Support.blankToNull(r.location()));
        blog.setBlogDate(r.blogDate());
        blog.setCoverPhotoUrl(Support.blankToNull(r.coverPhotoUrl()));
        blog.setCoverPhotoAlt(Support.blankToNull(r.coverPhotoAlt()));
        blog.setSummary(Support.blankToNull(r.summary()));
        blog.setDisplayOrder(Support.orZero(r.displayOrder()));
    }
}
