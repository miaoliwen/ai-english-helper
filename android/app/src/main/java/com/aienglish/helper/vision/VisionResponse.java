package com.aienglish.helper.vision;

import com.google.gson.annotations.SerializedName;

/**
 * OpenAI-compatible Chat Completion response.
 * { "choices": [ { "message": { "content": "extracted text..." } } ] }
 */
public class VisionResponse {

    private Choice[] choices;

    public Choice[] getChoices() { return choices; }

    /** Extract the text content from the first choice */
    public String getExtractedText() {
        if (choices != null && choices.length > 0 && choices[0].message != null) {
            return choices[0].message.content;
        }
        return null;
    }

    public static class Choice {
        private int index;
        private Message message;

        public int getIndex() { return index; }
        public Message getMessage() { return message; }
    }

    public static class Message {
        private String role;
        private String content;

        public String getRole() { return role; }
        public String getContent() { return content; }
    }
}
