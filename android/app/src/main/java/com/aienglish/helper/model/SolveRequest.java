package com.aienglish.helper.model;

import java.util.List;

/**
 * Request model for sending a question to the AI API.
 */
public class SolveRequest {

    private String image; // Base64 encoded image (optional)
    private String text;  // Text input (optional)
    private String language;

    public SolveRequest(String image, String text, String language) {
        this.image = image;
        this.text = text;
        this.language = language;
    }

    public String getImage() { return image; }
    public String getText() { return text; }
    public String getLanguage() { return language; }
}
