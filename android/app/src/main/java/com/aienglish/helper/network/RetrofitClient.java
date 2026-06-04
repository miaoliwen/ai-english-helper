package com.aienglish.helper.network;

import android.content.Context;
import android.content.SharedPreferences;

import com.aienglish.helper.vision.VisionApiService;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * Singleton Retrofit client for AI API calls.
 * Base URL can be configured at runtime via SharedPreferences.
 * Optionally includes an API key as Bearer token in all requests.
 * Also manages vision/OCR model settings (multimodal).
 */
public class RetrofitClient {

    private static final String PREF_NAME = "ai_english_prefs";

    // Main (solver) API keys
    private static final String KEY_BASE_URL = "api_base_url";
    private static final String KEY_API_KEY = "api_key";
    private static final String DEFAULT_BASE_URL = "https://api.aienglish.example.com/";

    // Vision / OCR model keys
    private static final String KEY_VISION_BASE_URL = "vision_base_url";
    private static final String KEY_VISION_API_KEY = "vision_api_key";
    private static final String KEY_VISION_MODEL = "vision_model";
    private static final String KEY_VISION_ENABLED = "vision_enabled";
    private static final String DEFAULT_VISION_BASE_URL = "https://api.openai.com/v1/";
    private static final String DEFAULT_VISION_MODEL = "gpt-4o";

    // Streaming toggle
    private static final String KEY_STREAMING = "streaming_enabled";

    private static RetrofitClient instance;
    private final Retrofit retrofit;
    private final ApiService apiService;
    private final String currentApiKey;

    private RetrofitClient(String baseUrl, String apiKey) {
        this.currentApiKey = apiKey;
        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
        loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);

        OkHttpClient.Builder clientBuilder = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS);

        clientBuilder.addInterceptor(loggingInterceptor);

        if (apiKey != null && !apiKey.trim().isEmpty()) {
            clientBuilder.addInterceptor(new Interceptor() {
                @Override
                public okhttp3.Response intercept(Chain chain) throws IOException {
                    Request original = chain.request();
                    Request request = original.newBuilder()
                            .header("Authorization", "Bearer " + apiKey.trim())
                            .build();
                    return chain.proceed(request);
                }
            });
        }

        retrofit = new Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(clientBuilder.build())
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        apiService = retrofit.create(ApiService.class);
    }

    // ===================== Main Solver API =====================

    public static synchronized RetrofitClient getInstance(Context context) {
        String baseUrl = getBaseUrl(context);
        String apiKey = getApiKey(context);
        if (instance == null) {
            instance = new RetrofitClient(baseUrl, apiKey);
        } else if (!instance.retrofit.baseUrl().toString().equals(baseUrl)
                || !instance.currentApiKey.equals(apiKey)) {
            instance = new RetrofitClient(baseUrl, apiKey);
        }
        return instance;
    }

    public static String getBaseUrl(Context context) {
        return getPrefs(context).getString(KEY_BASE_URL, DEFAULT_BASE_URL);
    }

    public static void setBaseUrl(Context context, String baseUrl) {
        getPrefs(context).edit().putString(KEY_BASE_URL, baseUrl).apply();
        instance = null;
    }

    public static String getApiKey(Context context) {
        return getPrefs(context).getString(KEY_API_KEY, "");
    }

    public static void setApiKey(Context context, String apiKey) {
        getPrefs(context).edit().putString(KEY_API_KEY, apiKey).apply();
        instance = null;
    }

    // ===================== Vision / OCR API =====================

    /** Create a one-shot VisionApiService for the configured vision model */
    public static VisionApiService createVisionService(Context context) {
        if (!isVisionConfigured(context)) return null;

        String baseUrl = getVisionBaseUrl(context);
        String apiKey = getVisionApiKey(context);

        // Ensure trailing slash
        if (!baseUrl.endsWith("/")) baseUrl = baseUrl + "/";

        HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
        logging.setLevel(HttpLoggingInterceptor.Level.BODY);

        OkHttpClient.Builder builder = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(120, TimeUnit.SECONDS) // OCR may take longer
                .writeTimeout(60, TimeUnit.SECONDS)
                .addInterceptor(logging);

        if (apiKey != null && !apiKey.trim().isEmpty()) {
            String finalApiKey = apiKey.trim();
            builder.addInterceptor(chain -> {
                Request request = chain.request().newBuilder()
                        .header("Authorization", "Bearer " + finalApiKey)
                        .build();
                return chain.proceed(request);
            });
        }

        Retrofit visionRetrofit = new Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(builder.build())
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        return visionRetrofit.create(VisionApiService.class);
    }

    public static String getVisionBaseUrl(Context context) {
        return getPrefs(context).getString(KEY_VISION_BASE_URL, DEFAULT_VISION_BASE_URL);
    }

    public static void setVisionBaseUrl(Context context, String url) {
        getPrefs(context).edit().putString(KEY_VISION_BASE_URL, url).apply();
    }

    public static String getVisionApiKey(Context context) {
        return getPrefs(context).getString(KEY_VISION_API_KEY, "");
    }

    public static void setVisionApiKey(Context context, String apiKey) {
        getPrefs(context).edit().putString(KEY_VISION_API_KEY, apiKey).apply();
    }

    public static String getVisionModel(Context context) {
        return getPrefs(context).getString(KEY_VISION_MODEL, DEFAULT_VISION_MODEL);
    }

    public static void setVisionModel(Context context, String model) {
        getPrefs(context).edit().putString(KEY_VISION_MODEL, model).apply();
    }

    public static boolean isVisionConfigured(Context context) {
        if (!isVisionEnabled(context)) return false;
        String url = getVisionBaseUrl(context);
        // Must be a non-empty URL that differs from the plain default
        return url != null && !url.isEmpty()
                && !url.equals(DEFAULT_VISION_BASE_URL);
    }

    /** Check whether the given URL is still the factory default (i.e. user hasn't customized it). */
    public static boolean isDefaultVisionUrl(String url) {
        return url == null || url.isEmpty() || url.equals(DEFAULT_VISION_BASE_URL);
    }

    // ===================== Vision enabled toggle =====================

    public static boolean isVisionEnabled(Context context) {
        return getPrefs(context).getBoolean(KEY_VISION_ENABLED, false);
    }

    public static void setVisionEnabled(Context context, boolean enabled) {
        getPrefs(context).edit().putBoolean(KEY_VISION_ENABLED, enabled).apply();
    }

    // ===================== Streaming toggle =====================

    public static boolean isStreamingEnabled(Context context) {
        return getPrefs(context).getBoolean(KEY_STREAMING, true); // default ON
    }

    public static void setStreamingEnabled(Context context, boolean enabled) {
        getPrefs(context).edit().putBoolean(KEY_STREAMING, enabled).apply();
    }

    // ===================== Reset =====================

    public static void resetToDefaults(Context context) {
        getPrefs(context).edit()
                .remove(KEY_BASE_URL)
                .remove(KEY_API_KEY)
                .remove(KEY_VISION_BASE_URL)
                .remove(KEY_VISION_API_KEY)
                .remove(KEY_VISION_MODEL)
                .remove(KEY_VISION_ENABLED)
                .remove(KEY_STREAMING)
                .apply();
        instance = null;
    }

    // ===================== Getters =====================

    private static SharedPreferences getPrefs(Context context) {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public ApiService getApiService() {
        return apiService;
    }

    public Retrofit getRetrofit() {
        return retrofit;
    }
}
