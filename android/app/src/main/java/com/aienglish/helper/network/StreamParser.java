package com.aienglish.helper.network;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

import okhttp3.ResponseBody;

/**
 * Reads an SSE (Server-Sent Events) stream from the solver API and
 * emits parsed events to a callback.
 *
 * Expected SSE format (one event per line, prefixed with "data: "):
 *
 *   data: {"answer":"A","questionType":"阅读理解","streaming":true}
 *   data: {"analysis":"第一步"}
 *   data: {"analysis":"第二步"}
 *   data: {"analysis":"最后一步"}
 *   data: {"done":true}
 */
public class StreamParser {

    public interface Callback {
        /** Called once when the initial metadata arrives (answer, questionType). */
        void onMeta(String answer, String questionType);
        /** Called for each analysis token. Append to the running text. */
        void onAnalysisToken(String token);
        /** Called when the stream is complete. */
        void onComplete(String fullAnalysis);
        /** Called on any error during reading. */
        void onError(String message);
    }

    private static final String TAG = "StreamParser";

    /**
     * Start reading the stream in the current thread (call from a background thread).
     */
    public static void parse(ResponseBody responseBody, Callback callback) {
        try {
            InputStream inputStream = responseBody.byteStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, "UTF-8"));

            String line;
            StringBuilder analysisAccumulator = new StringBuilder();

            while ((line = reader.readLine()) != null) {
                // SSE lines are "data: {json}"
                if (line.startsWith("data: ")) {
                    String jsonStr = line.substring(6).trim();

                    // OpenAI sends "[DONE]" as the last event
                    if ("[DONE]".equals(jsonStr)) {
                        break;
                    }

                    try {
                        JSONObject json = new JSONObject(jsonStr);

                        // First event — metadata
                        if (json.has("streaming")) {
                            String answer = json.optString("answer", "");
                            String questionType = json.optString("questionType", "");
                            callback.onMeta(answer, questionType);
                        }
                        // Analysis tokens
                        else if (json.has("analysis")) {
                            String token = json.optString("analysis", "");
                            analysisAccumulator.append(token);
                            callback.onAnalysisToken(token);
                        }
                        // Done event
                        if (json.optBoolean("done", false)) {
                            break;
                        }
                    } catch (JSONException e) {
                        Log.w(TAG, "Skipping unparseable SSE line: " + jsonStr);
                    }
                }
            }

            reader.close();
            callback.onComplete(analysisAccumulator.toString());

        } catch (IOException e) {
            Log.e(TAG, "Stream read error", e);
            callback.onError("读取流式响应失败: " + e.getLocalizedMessage());
        }
    }
}
