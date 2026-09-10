package com.portfolio.service.storage;

import com.portfolio.config.AppProperties;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/** Dev-only driver: writes to a local directory served at /uploads/**. */
public class LocalStorage implements StorageService {

    private final Path dir;
    private final String publicBaseUrl;

    public LocalStorage(AppProperties props) {
        this.dir = Paths.get(props.storage().localDir()).toAbsolutePath().normalize();
        String base = props.storage().publicBaseUrl();
        this.publicBaseUrl = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    @Override
    public String store(byte[] bytes, String contentType, String extension) throws IOException {
        Files.createDirectories(dir);
        String filename = UUID.randomUUID() + extension;
        Files.write(dir.resolve(filename), bytes);
        return publicBaseUrl + "/uploads/" + filename;
    }
}
