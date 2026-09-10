package com.portfolio.service.storage;

import com.portfolio.config.AppProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StorageConfiguration {

    @Bean
    public StorageService storageService(AppProperties props) {
        String driver = props.storage().driver() == null ? "local" : props.storage().driver().trim().toLowerCase();
        return switch (driver) {
            case "local" -> new LocalStorage(props);
            case "cloudinary" -> new CloudinaryStorage(props);
            default -> throw new IllegalStateException("Unknown STORAGE_DRIVER: " + driver + " (expected local or cloudinary)");
        };
    }
}
