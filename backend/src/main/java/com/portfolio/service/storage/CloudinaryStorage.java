package com.portfolio.service.storage;

import com.cloudinary.Cloudinary;
import com.portfolio.config.AppProperties;

import java.io.IOException;
import java.util.Map;

/** Production driver: uploads to Cloudinary (free tier) and returns the secure URL. */
public class CloudinaryStorage implements StorageService {

    private final Cloudinary cloudinary;
    private final String folder;

    public CloudinaryStorage(AppProperties props) {
        String url = props.storage().cloudinaryUrl();
        if (url == null || url.isBlank()) {
            throw new IllegalStateException(
                    "STORAGE_DRIVER=cloudinary but CLOUDINARY_URL is not set "
                  + "(expected format cloudinary://API_KEY:API_SECRET@CLOUD_NAME)");
        }
        this.cloudinary = new Cloudinary(url);
        this.folder = props.storage().cloudinaryFolder();
    }

    @Override
    public String store(byte[] bytes, String contentType, String extension) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(bytes, Map.of(
                "folder", folder,
                "resource_type", "image"));
        Object secureUrl = result.get("secure_url");
        if (secureUrl == null) {
            throw new IOException("Cloudinary upload did not return a secure_url");
        }
        return secureUrl.toString();
    }
}
