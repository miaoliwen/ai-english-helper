package com.aienglish.helper;

import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.SwitchCompat;

import com.aienglish.helper.network.RetrofitClient;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

public class ApiSettingsActivity extends AppCompatActivity {

    private TextView tvCurrentStatus;
    private TextInputEditText etBaseUrl, etApiKey;
    private TextInputEditText etVisionBaseUrl, etVisionApiKey, etVisionModel;
    private SwitchCompat switchStreaming;
    private SwitchCompat switchVisionEnabled;
    private TextView tvVisionToggleHint;
    private MaterialButton btnSave, btnReset;
    private TextView tvMessage;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_api_settings);

        // Main API fields
        tvCurrentStatus = findViewById(R.id.tv_current_status);
        etBaseUrl = findViewById(R.id.et_base_url);
        etApiKey = findViewById(R.id.et_api_key);
        // Vision fields
        etVisionBaseUrl = findViewById(R.id.et_vision_base_url);
        etVisionApiKey = findViewById(R.id.et_vision_api_key);
        etVisionModel = findViewById(R.id.et_vision_model);
        // Streaming toggle
        switchStreaming = findViewById(R.id.switch_streaming);
        // Vision enabled toggle
        switchVisionEnabled = findViewById(R.id.switch_vision_enabled);
        tvVisionToggleHint = findViewById(R.id.tv_vision_toggle_hint);

        // Info button
        findViewById(R.id.tv_vision_info).setOnClickListener(v ->
                new android.app.AlertDialog.Builder(this)
                        .setTitle("关于视觉模型")
                        .setMessage("如果不配置视觉模型，启用「自动从图片提取文字」后，应用会使用视觉 API 从图片中提取文字。\n\n如果不启用，图片将直接发送给解题引擎处理（如解题引擎支持图片）。\n\n大多数情况下可以不配置此项。")
                        .setPositiveButton("我知道了", null)
                        .show()
        );

        // Vision toggle controls
        switchVisionEnabled.setOnCheckedChangeListener((buttonView, isChecked) -> {
            updateVisionToggleHint(isChecked);
        });

        // Buttons
        btnSave = findViewById(R.id.btn_save);
        btnReset = findViewById(R.id.btn_reset);
        tvMessage = findViewById(R.id.tv_settings_message);

        // Toolbar back
        ((MaterialToolbar) findViewById(R.id.toolbar_settings))
                .setNavigationOnClickListener(v -> finish());

        loadCurrentSettings();

        btnSave.setOnClickListener(v -> saveSettings());

        btnReset.setOnClickListener(v -> {
            RetrofitClient.resetToDefaults(this);
            loadCurrentSettings();
            showMessage("已恢复默认设置", false);
            Toast.makeText(this, "已恢复默认地址", Toast.LENGTH_SHORT).show();
        });
    }

    private void loadCurrentSettings() {
        // Main API
        etBaseUrl.setText(RetrofitClient.getBaseUrl(this));
        etApiKey.setText(RetrofitClient.getApiKey(this));
        // Vision
        etVisionBaseUrl.setText(RetrofitClient.getVisionBaseUrl(this));
        etVisionApiKey.setText(RetrofitClient.getVisionApiKey(this));
        etVisionModel.setText(RetrofitClient.getVisionModel(this));
        switchVisionEnabled.setChecked(RetrofitClient.isVisionEnabled(this));
        updateVisionToggleHint(switchVisionEnabled.isChecked());
        // Streaming
        switchStreaming.setChecked(RetrofitClient.isStreamingEnabled(this));
        updateStatus();
    }

    private void updateStatus() {
        String url = RetrofitClient.getBaseUrl(this);

        boolean mainOk = !url.contains("example.com");

        StringBuilder sb = new StringBuilder();
        sb.append("解题引擎: ").append(mainOk ? "✅ 已配置" : "⚠️ 使用默认演示地址").append("\n");
        sb.append("  地址: ").append(url).append("\n");

        boolean visionConfigured = RetrofitClient.isVisionConfigured(this);
        boolean visionEnabled = switchVisionEnabled.isChecked();
        if (visionConfigured && visionEnabled) {
            sb.append("视觉 OCR: ✅ 已启用").append("\n");
            sb.append("  地址: ").append(RetrofitClient.getVisionBaseUrl(this)).append("\n");
            sb.append("  模型: ").append(RetrofitClient.getVisionModel(this));
        } else if (!visionConfigured) {
            sb.append("视觉 OCR: ⏹️ 未配置（可选）");
        } else {
            sb.append("视觉 OCR: ⏹️ 已关闭");
        }
        tvCurrentStatus.setText(sb.toString());
    }

    private void updateVisionToggleHint(boolean isChecked) {
        boolean configured = false;
        String url = etVisionBaseUrl.getText().toString().trim();
        if (!RetrofitClient.isDefaultVisionUrl(url)) {
            configured = true;
        }
        if (isChecked && !configured) {
            tvVisionToggleHint.setText("⚠️ 请先配置下方的视觉模型地址");
            tvVisionToggleHint.setTextColor(getColor(android.R.color.holo_red_dark));
        } else if (isChecked) {
            tvVisionToggleHint.setText("已启用：图片将先经过 OCR 提取文字");
            tvVisionToggleHint.setTextColor(getColor(android.R.color.holo_green_dark));
        } else {
            tvVisionToggleHint.setText("关闭时图片将直接发送给解题引擎");
            tvVisionToggleHint.setTextColor(getColor(android.R.color.darker_gray));
        }
    }

    /** 验证 URL 格式 */
    private boolean isValidUrl(String url) {
        return url != null && (url.startsWith("http://") || url.startsWith("https://"));
    }

    /** 保存设置 */
    private void saveSettings() {
        // Main API
        String url = etBaseUrl.getText().toString().trim();
        String apiKey = etApiKey.getText().toString().trim();
        if (!url.endsWith("/")) url += "/";
        if (!isValidUrl(url)) {
            showMessage("❌ 解题引擎地址必须以 http:// 或 https:// 开头", true);
            return;
        }
        RetrofitClient.setBaseUrl(this, url);
        RetrofitClient.setApiKey(this, apiKey);

        // Vision API (fully optional)
        String vUrl = etVisionBaseUrl.getText().toString().trim();
        String vKey = etVisionApiKey.getText().toString().trim();
        String vModel = etVisionModel.getText().toString().trim();
        if (!vUrl.isEmpty()) {
            if (!vUrl.endsWith("/")) vUrl += "/";
        }
        RetrofitClient.setVisionBaseUrl(this, vUrl);
        RetrofitClient.setVisionApiKey(this, vKey);
        RetrofitClient.setVisionModel(this, vModel);
        RetrofitClient.setVisionEnabled(this, switchVisionEnabled.isChecked());

        // Streaming
        RetrofitClient.setStreamingEnabled(this, switchStreaming.isChecked());

        updateStatus();
        String savedMsg = switchVisionEnabled.isChecked() ?
                "✅ 已保存 — 拍照后将先 OCR 提取文字再解题" :
                "✅ 已保存 — 拍照后将直接发送图片给解题引擎";
        showMessage(savedMsg, false);
        Toast.makeText(this, "设置已保存", Toast.LENGTH_SHORT).show();
    }

    private void showMessage(String msg, boolean isError) {
        tvMessage.setText(msg);
        tvMessage.setTextColor(getColor(isError ? android.R.color.holo_red_dark : android.R.color.holo_green_dark));
        tvMessage.setVisibility(TextView.VISIBLE);
    }
}
