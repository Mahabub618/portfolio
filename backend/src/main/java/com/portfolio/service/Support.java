package com.portfolio.service;

/** Small shared helpers for the service layer. */
final class Support {

    private Support() {}

    /** Normalizes blank strings to null so optional fields stay clean in the DB. */
    static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    static int orZero(Integer value) {
        return value == null ? 0 : value;
    }
}
