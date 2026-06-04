package com.aienglish.helper.vision;

/**
 * OpenAI-compatible Chat Completion request for vision/OCR.
 * {"model":"gpt-4o","messages":[{"role":"user","content":[
 *   {"type":"text","text":"Extract all text..."},
 *   {"type":"image_url","image_url":{"url":"data:image/jpeg;base64,..."}}
 * ]}]}
 */
public class VisionRequest {

    private String model;
    private Message[] messages;
    private int maxTokens;

    public VisionRequest(String model, String textPrompt, String base64Image, int maxTokens) {
        this.model = model;
        this.maxTokens = maxTokens;
        ContentItem[] content = new ContentItem[]{
                new ContentItem("text", textPrompt, null),
                new ContentItem("image_url", null, new ImageUrl("data:image/jpeg;base64," + base64Image))
        };
        this.messages = new Message[]{new Message("user", content)};
    }

    public String getModel() { return model; }
    public Message[] getMessages() { return messages; }
    public int getMaxTokens() { return maxTokens; }

    // --- Nested POJOs ---

    public static class Message {
        private String role;
        private ContentItem[] content;

        public Message(String role, ContentItem[] content) {
            this.role = role;
            this.content = content;
        }
        public String getRole() { return role; }
        public ContentItem[] getContent() { return content; }
    }

    public static class ContentItem {
        private String type;
        private String text;
        private ImageUrl imageUrl;

        public ContentItem(String type, String text, ImageUrl imageUrl) {
            this.type = type;
            this.text = text;
            this.imageUrl = imageUrl;
        }
        public String getType() { return type; }
        public String getText() { return text; }
        public ImageUrl getImageUrl() { return imageUrl; }
    }

    public static class ImageUrl {
        private String url;

        public ImageUrl(String url) { this.url = url; }
        public String getUrl() { return url; }
    }
}
