package com.aienglish.helper.network;

import com.aienglish.helper.model.SolveRequest;
import com.aienglish.helper.model.SolveResponse;

import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.Multipart;
import retrofit2.http.POST;
import retrofit2.http.Part;
import retrofit2.http.Streaming;

public interface ApiService {

    /**
     * Submit a question (text + optional image) to the AI engine.
     * Non‑streaming: returns the complete response.
     */
    @POST("api/solve")
    Call<SolveResponse> solveQuestion(@Body SolveRequest request);

    /**
     * Submit a question and receive the answer as a streaming SSE response.
     * Returns raw ResponseBody — caller must read the byte stream line by line.
     */
    @Streaming
    @POST("api/solve/stream")
    Call<ResponseBody> solveQuestionStream(@Body SolveRequest request);

    /**
     * Upload an image for OCR and solving.
     */
    @Multipart
    @POST("api/solve/image")
    Call<SolveResponse> solveByImage(@Part MultipartBody.Part image,
                                     @Part("language") RequestBody language);
}
