package com.portfolio.service;

import com.portfolio.config.AppProperties;
import com.portfolio.dto.UploadResponse;
import com.portfolio.service.storage.StorageService;
import com.portfolio.web.InvalidUploadException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
public class UploadService {

    private static final Map<String, String> ALLOWED = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif");

    private final StorageService storage;
    private final long maxBytes;

    public UploadService(StorageService storage, AppProperties props) {
        this.storage = storage;
        this.maxBytes = props.storage().maxUploadBytes();
    }

    public UploadResponse upload(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new InvalidUploadException("No file provided");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        String extension = ALLOWED.get(contentType);
        if (extension == null) {
            throw new InvalidUploadException(
                    "Unsupported file type '" + contentType + "'. Allowed: jpeg, png, webp, gif");
        }
        byte[] bytes = file.getBytes();
        if (bytes.length > maxBytes) {
            throw new InvalidUploadException("File exceeds the maximum allowed size of " + (maxBytes / 1024 / 1024) + " MB");
        }

        Integer width = null;
        Integer height = null;
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
        if (image != null) {
            width = image.getWidth();
            height = image.getHeight();
        }

        String url = storage.store(bytes, contentType, extension);
        return new UploadResponse(url, width, height, bytes.length, contentType);
    }
}
