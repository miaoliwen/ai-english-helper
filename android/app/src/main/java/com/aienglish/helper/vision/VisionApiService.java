package com.aienglish.helper.vision;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

/**
 * Retrofit interface for OpenAI-compatible vision/OCR API.
 */
public interface VisionApiService {

    /**
     * Send an image with a text prompt for OCR / multimodal analysis.
     * Uses the standard Chat Completions endpoint.
     */
    @POST("v1/chat/completions")
    Call<VisionResponse> ocr(@Body VisionRequest request);
}
