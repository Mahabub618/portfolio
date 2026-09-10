package com.portfolio.service.storage;

import java.io.IOException;

public interface StorageService {
    /** Stores bytes and returns their public URL. */
    String store(byte[] bytes, String contentType, String extension) throws IOException;
}
