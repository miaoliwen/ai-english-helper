package com.aienglish.helper.model;

import com.google.gson.annotations.SerializedName;

/**
 * API response model for the solve endpoint.
 */
public class SolveResponse {

    @SerializedName("code")
    private int code;

    @SerializedName("message")
    private String message;

    @SerializedName("data")
    private SolveData data;

    public int getCode() { return code; }
    public String getMessage() { return message; }
    public SolveData getData() { return data; }

    public boolean isSuccess() {
        return code == 0 || code == 200;
    }

    public static class SolveData {
        @SerializedName("question")
        private String question;

        @SerializedName("answer")
        private String answer;

        @SerializedName("analysis")
        private String analysis;

        @SerializedName("difficulty")
        private String difficulty;

        @SerializedName("questionType")
        private String questionType;

        @SerializedName("timestamp")
        private long timestamp;

        public String getQuestion() { return question; }
        public String getAnswer() { return answer; }
        public String getAnalysis() { return analysis; }
        public String getDifficulty() { return difficulty; }
        public String getQuestionType() { return questionType; }
        public long getTimestamp() { return timestamp; }
    }
}
