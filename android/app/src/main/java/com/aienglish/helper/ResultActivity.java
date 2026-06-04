package com.aienglish.helper;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.animation.LinearInterpolator;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.aienglish.helper.data.AppDatabase;
import com.aienglish.helper.data.SolveRecord;
import com.aienglish.helper.model.SolveRequest;
import com.aienglish.helper.model.SolveResponse;
import com.aienglish.helper.network.ApiService;
import com.aienglish.helper.network.RetrofitClient;
import com.aienglish.helper.network.StreamParser;
import com.aienglish.helper.utils.AppExecutors;
import com.aienglish.helper.utils.ImageUtil;
import com.aienglish.helper.vision.VisionApiService;
import com.aienglish.helper.vision.VisionRequest;
import com.aienglish.helper.vision.VisionResponse;
import com.bumptech.glide.Glide;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ResultActivity extends AppCompatActivity {

    // Cursor blinking
    private ObjectAnimator cursorAnimator;
    private boolean cursorVisible = true;

    // UI
    private LinearLayout layoutLoading;
    private LinearLayout layoutResult;
    private ImageView ivPreview;
    private TextView tvQuestion;
    private TextView tvQuestionType;
    private TextView tvAnswer;
    private TextView tvAnalysis;
    private TextView tvLoadingText;

    // OCR step indicators
    private LinearLayout layoutOcrProgress;
    private TextView tvStepOcr;
    private TextView tvStepSolve;

    // Streaming indicator
    private LinearLayout layoutStreamingIndicator;
    private TextView tvStreamingCursor;

    private String inputText;
    private String imageUri;
    private String imageBase64;
    private Call<ResponseBody> streamingCall;
    private final StringBuilder analysisBuffer = new StringBuilder();
    private long lastUiUpdateTime = 0;
    private static final long UI_UPDATE_INTERVAL = 150; // 150ms interval

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_result);

        layoutLoading = findViewById(R.id.layout_loading);
        layoutResult = findViewById(R.id.layout_result);
        ivPreview = findViewById(R.id.iv_preview);
        tvQuestion = findViewById(R.id.tv_question);
        tvQuestionType = findViewById(R.id.tv_question_type);
        tvAnswer = findViewById(R.id.tv_answer);
        tvAnalysis = findViewById(R.id.tv_analysis);
        tvLoadingText = findViewById(R.id.tv_loading_text);
        layoutOcrProgress = findViewById(R.id.layout_ocr_progress);
        tvStepOcr = findViewById(R.id.tv_step_ocr);
        tvStepSolve = findViewById(R.id.tv_step_solve);
        layoutStreamingIndicator = findViewById(R.id.layout_streaming_indicator);
        tvStreamingCursor = findViewById(R.id.tv_streaming_cursor);

        findViewById(R.id.toolbar_result).setOnClickListener(v -> finish());

        imageUri = getIntent().getStringExtra("image_uri");
        inputText = getIntent().getStringExtra("question");

        if (imageUri != null) {
            ivPreview.setVisibility(View.VISIBLE);
            Glide.with(this).load(Uri.parse(imageUri)).into(ivPreview);
            startOcrThenSolve();
        } else if (inputText != null && !inputText.isEmpty()) {
            ivPreview.setVisibility(View.GONE);
            callSolveApi(inputText, null);
        } else {
            finish();
        }
    }

    // ======================== OCR + Solve Pipeline ========================

    private void startOcrThenSolve() {
        boolean useOcr = RetrofitClient.isVisionConfigured(this)
                && RetrofitClient.isVisionEnabled(this);

        if (useOcr) {
            // --- OCR path: extract text from image first ---
            setLoadingText("正在 OCR 识别图片中的文字...");
            tvQuestionType.setText("📷 OCR 识别中");
            showStepIndicator(true, false); // OCR step active

            VisionApiService visionService = RetrofitClient.createVisionService(this);
            if (visionService == null) {
                setLoadingText("视觉模型不可用，直接发送图片...");
                showStepIndicator(false, false);
                callSolveApi(null, imageUri);
                return;
            }

            AppExecutors.getInstance().networkIO().execute(() -> {
                imageBase64 = ImageUtil.uriToBase64(this, Uri.parse(imageUri));
                if (imageBase64 == null) {
                    AppExecutors.getInstance().mainThread().execute(() -> {
                        Toast.makeText(this, "图片处理失败", Toast.LENGTH_SHORT).show();
                        showStepIndicator(false, false);
                        callSolveApi(inputText, imageUri);
                    });
                    return;
                }

                String model = RetrofitClient.getVisionModel(this);
                String prompt = getString(R.string.ocr_prompt);
                VisionRequest request = new VisionRequest(model, prompt, imageBase64, 4096);

                visionService.ocr(request).enqueue(new Callback<VisionResponse>() {
                    @Override
                    public void onResponse(Call<VisionResponse> c, Response<VisionResponse> response) {
                        if (response.isSuccessful() && response.body() != null) {
                            String extracted = response.body().getExtractedText();
                            if (extracted != null && !extracted.trim().isEmpty()) {
                                String ocrText = extracted.trim();
                                inputText = ocrText;
                                runOnUiThread(() -> {
                                    tvQuestionType.setText("📷 OCR 完成");
                                    tvQuestion.setText("OCR 提取的题目:\n" + ocrText);
                                    showStepIndicator(false, true); // Solve step active
                                });
                                setLoadingText("AI 正在解析题目...");
                                callSolveApi(ocrText, null);
                            } else {
                                runOnUiThread(() -> {
                                    Toast.makeText(ResultActivity.this, "OCR 未识别到文字", Toast.LENGTH_SHORT).show();
                                    showStepIndicator(false, false);
                                });
                                callSolveApi(inputText, imageUri);
                            }
                        } else {
                            String err = response.body() != null ? "OCR 错误: HTTP " + response.code() : "OCR 请求失败: HTTP " + response.code();
                            runOnUiThread(() -> {
                                Toast.makeText(ResultActivity.this, err, Toast.LENGTH_SHORT).show();
                                showStepIndicator(false, false);
                            });
                            callSolveApi(inputText, imageUri);
                        }
                    }

                    @Override
                    public void onFailure(Call<VisionResponse> c, Throwable t) {
                        runOnUiThread(() -> {
                            Toast.makeText(ResultActivity.this, "OCR 网络失败: " + t.getLocalizedMessage(), Toast.LENGTH_SHORT).show();
                            showStepIndicator(false, false);
                        });
                        callSolveApi(inputText, imageUri);
                    }
                });
            });
        } else {
            // --- Direct image path: skip OCR, send image straight to solver ---
            setLoadingText("正在提交图片给解题引擎...");
            tvQuestionType.setText("📷 图片已附加");
            showStepIndicator(false, false);
            callSolveApi(null, imageUri);
        }
    }

    /** 阶段 2: 调用解题引擎 */
    private void callSolveApi(String text, String imageUriForFallback) {
        String imageForRequest = null;
        if (imageUriForFallback != null) {
            if (imageBase64 != null) {
                imageForRequest = imageBase64;
            } else {
                imageBase64 = ImageUtil.uriToBase64(this, Uri.parse(imageUriForFallback));
                imageForRequest = imageBase64;
            }
        }

        boolean streaming = RetrofitClient.isStreamingEnabled(this);
        if (streaming) {
            callSolveApiStreaming(text, imageForRequest);
        } else {
            callSolveApiBlocking(text, imageForRequest);
        }
    }

    /** 非流式 */
    private void callSolveApiBlocking(String text, String imageForRequest) {
        ApiService api = RetrofitClient.getInstance(this).getApiService();
        SolveRequest request = new SolveRequest(imageForRequest, text, "zh");
        Call<SolveResponse> call = api.solveQuestion(request);

        call.enqueue(new Callback<SolveResponse>() {
            @Override
            public void onResponse(Call<SolveResponse> c, Response<SolveResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    SolveResponse.SolveData data = response.body().getData();
                    if (data != null) {
                        showResult(data);
                        saveToDatabase(data);
                    } else {
                        showError("API 返回数据为空");
                    }
                } else {
                    String err = response.body() != null ? response.body().getMessage() : "HTTP " + response.code();
                    showError("API 错误: " + err);
                }
            }

            @Override
            public void onFailure(Call<SolveResponse> c, Throwable t) {
                showError("网络请求失败: " + t.getLocalizedMessage());
            }
        });
    }

    /** 流式输出 */
    private void callSolveApiStreaming(String text, String imageForRequest) {
        setLoadingText("AI 正在流式输出答案...");
        hideOcrProgress();

        final ApiService api = RetrofitClient.getInstance(this).getApiService();
        final SolveRequest request = new SolveRequest(imageForRequest, text, "zh");

        AppExecutors.getInstance().networkIO().execute(() -> {
            try {
                streamingCall = api.solveQuestionStream(request);
                Response<ResponseBody> response = streamingCall.execute();
                if (!response.isSuccessful() || response.body() == null) {
                    AppExecutors.getInstance().mainThread().execute(() -> {
                        showError("流式请求失败: HTTP " + response.code());
                        callSolveApiBlocking(text, imageForRequest);
                    });
                    return;
                }

                // 流式开始 — 在主线程显示结果区域 + 启动光标
                AppExecutors.getInstance().mainThread().execute(() -> {
                    layoutLoading.setVisibility(View.GONE);
                    layoutResult.setVisibility(View.VISIBLE);
                    layoutStreamingIndicator.setVisibility(View.VISIBLE);
                    startCursorBlinking();
                    if (text != null && !text.isEmpty()) {
                        tvQuestion.setText(text);
                    }
                    tvAnalysis.setText("");
                });

                StreamParser.parse(response.body(), new StreamParser.Callback() {
                    @Override
                    public void onMeta(String answer, String questionType) {
                        AppExecutors.getInstance().mainThread().execute(() -> {
                            if (answer != null && !answer.isEmpty()) tvAnswer.setText(answer);
                            if (questionType != null && !questionType.isEmpty()) tvQuestionType.setText("题型：" + questionType);
                        });
                    }

                    @Override
                    public void onAnalysisToken(String token) {
                        analysisBuffer.append(token);
                        long currentTime = System.currentTimeMillis();
                        if (currentTime - lastUiUpdateTime > UI_UPDATE_INTERVAL) {
                            updateUiWithBuffer();
                            lastUiUpdateTime = currentTime;
                        }
                    }

                    @Override
                    public void onComplete(String fullAnalysis) {
                        AppExecutors.getInstance().mainThread().execute(() -> {
                            updateUiWithBuffer(); // Final flush
                            stopCursorBlinking();
                            layoutStreamingIndicator.setVisibility(View.GONE);
                            tvAnalysis.append("\n\n✅ 解析完成");
                            String answer = tvAnswer.getText().toString();
                            String qType = tvQuestionType.getText().toString().replace("题型：", "");
                            saveToDatabase(text != null ? text : "", qType, answer, fullAnalysis);
                            Toast.makeText(ResultActivity.this, "✅ 解析完成", Toast.LENGTH_SHORT).show();
                        });
                    }

                    @Override
                    public void onError(String message) {
                        AppExecutors.getInstance().mainThread().execute(() -> {
                            stopCursorBlinking();
                            showError(message);
                            tvAnalysis.append("\n\n[⚠️ 流式输出中断]");
                            layoutStreamingIndicator.setVisibility(View.GONE);
                        });
                    }
                });

            } catch (Exception e) {
                AppExecutors.getInstance().mainThread().execute(() -> {
                    showError("流式异常: " + e.getLocalizedMessage());
                    callSolveApiBlocking(text, imageForRequest);
                });
            }
        });
    }

    private void updateUiWithBuffer() {
        if (analysisBuffer.length() == 0) return;
        final String newText = analysisBuffer.toString();
        analysisBuffer.setLength(0);
        AppExecutors.getInstance().mainThread().execute(() -> {
            tvAnalysis.append(newText);
            ScrollView scrollView = findViewById(R.id.scroll_result);
            if (scrollView != null) scrollView.post(() -> scrollView.fullScroll(View.FOCUS_DOWN));
        });
    }

    // ======================== 光标闪烁动画 ========================

    private void startCursorBlinking() {
        stopCursorBlinking();
        cursorAnimator = ObjectAnimator.ofFloat(tvStreamingCursor, "alpha", 1f, 0f, 1f);
        cursorAnimator.setDuration(800);
        cursorAnimator.setRepeatCount(ValueAnimator.INFINITE);
        cursorAnimator.setRepeatMode(ValueAnimator.REVERSE);
        cursorAnimator.setInterpolator(new LinearInterpolator());
        cursorAnimator.start();
    }

    private void stopCursorBlinking() {
        if (cursorAnimator != null) {
            cursorAnimator.cancel();
            cursorAnimator = null;
        }
        if (tvStreamingCursor != null) {
            tvStreamingCursor.setAlpha(1f);
        }
    }

    // ======================== 步骤指示器 ========================

    private void showStepIndicator(boolean ocrActive, boolean solveActive) {
        layoutOcrProgress.setVisibility(View.VISIBLE);
        updateStepText(tvStepOcr, "🔍 OCR 识别图片文字...", ocrActive);
        updateStepText(tvStepSolve, "🤖 AI 解题分析...", solveActive);
    }

    private void hideOcrProgress() {
        if (layoutOcrProgress != null) layoutOcrProgress.setVisibility(View.GONE);
    }

    private void updateStepText(TextView tv, String text, boolean active) {
        if (active) {
            tv.setText("→ " + text);
            tv.setTextColor(ContextCompat.getColor(this, R.color.primary));
            tv.setAlpha(1f);
        } else {
            tv.setText(text);
            tv.setTextColor(ContextCompat.getColor(this, R.color.text_hint));
        }
    }

    // ======================== UI Helpers ========================

    private void setLoadingText(String text) {
        runOnUiThread(() -> { if (tvLoadingText != null) tvLoadingText.setText(text); });
    }

    private void showError(String message) {
        runOnUiThread(() -> Toast.makeText(this, message, Toast.LENGTH_LONG).show());
    }

    private void showResult(SolveResponse.SolveData data) {
        layoutLoading.setVisibility(View.GONE);
        layoutResult.setVisibility(View.VISIBLE);

        String question = data.getQuestion();
        tvQuestion.setText(question != null && !question.isEmpty() ? question : (inputText != null ? inputText : "（图片题目）"));
        tvQuestionType.setText(data.getQuestionType() != null ? "题型：" + data.getQuestionType() : "题型：待识别");
        tvAnswer.setText(data.getAnswer() != null ? data.getAnswer() : "—");
        tvAnalysis.setText(data.getAnalysis() != null ? data.getAnalysis() : "暂无解析");
    }

    // ======================== Database ========================

    private void saveToDatabase(SolveResponse.SolveData data) {
        saveToDatabase(data.getQuestion() != null ? data.getQuestion() : inputText, data.getQuestionType(), data.getAnswer(), data.getAnalysis());
    }

    private void saveToDatabase(String question, String type, String answer, String analysis) {
        String inputType = imageUri != null ? "image" : "text";
        AppExecutors.getInstance().diskIO().execute(() -> {
            try {
                SolveRecord record = new SolveRecord();
                record.setQuestion(question);
                record.setAnswer(answer);
                record.setAnalysis(analysis);
                record.setQuestionType(type);
                record.setInputType(inputType);
                record.setCreatedAt(System.currentTimeMillis());
                AppDatabase.getInstance(getApplicationContext()).solveRecordDao().insertRecord(record);
            } catch (Exception e) { e.printStackTrace(); }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopCursorBlinking();
        if (streamingCall != null) streamingCall.cancel();
    }
}
