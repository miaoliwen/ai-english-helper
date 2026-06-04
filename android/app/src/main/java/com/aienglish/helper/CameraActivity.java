package com.aienglish.helper;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;

import com.aienglish.helper.utils.AppExecutors;
import com.google.android.material.button.MaterialButton;
import com.google.common.util.concurrent.ListenableFuture;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CameraActivity extends AppCompatActivity {

    private PreviewView previewView;
    private MaterialButton btnCapture;
    private MaterialButton btnGallery;
    private ImageCapture imageCapture;

    private final ActivityResultLauncher<String> requestPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
                if (isGranted) {
                    startCamera();
                } else {
                    Toast.makeText(this, "需要相机权限才能拍照", Toast.LENGTH_SHORT).show();
                    finish();
                }
            });

    /** 从相册选取图片 */
    private final ActivityResultLauncher<String> pickImageLauncher =
            registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
                if (uri != null) {
                    navigateToResult(uri);
                }
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_camera);

        previewView = findViewById(R.id.previewView);
        btnCapture = findViewById(R.id.btn_capture);
        btnGallery = findViewById(R.id.btn_gallery);

        // Close button
        findViewById(R.id.toolbar_camera).setOnClickListener(v -> finish());

        // Capture button — 拍照
        btnCapture.setOnClickListener(v -> takePhoto());

        // Gallery button — 从相册选取
        btnGallery.setOnClickListener(v -> pickImageLauncher.launch("image/*"));

        // Request camera permission and start
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            startCamera();
        } else {
            requestPermissionLauncher.launch(Manifest.permission.CAMERA);
        }
    }

    /** 携带图片 URI 跳转到结果页 */
    private void navigateToResult(Uri imageUri) {
        Intent intent = new Intent(CameraActivity.this, ResultActivity.class);
        intent.putExtra("image_uri", imageUri.toString());
        startActivity(intent);
        finish();
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture =
                ProcessCameraProvider.getInstance(this);

        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                bindPreview(cameraProvider);
            } catch (ExecutionException | InterruptedException e) {
                Toast.makeText(this, "无法启动相机", Toast.LENGTH_SHORT).show();
                finish();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void bindPreview(@NonNull ProcessCameraProvider cameraProvider) {
        Preview preview = new Preview.Builder().build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        CameraSelector cameraSelector = new CameraSelector.Builder()
                .requireLensFacing(CameraSelector.LENS_FACING_BACK)
                .build();

        imageCapture = new ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                .build();

        cameraProvider.unbindAll();
        cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageCapture);
    }

    private void takePhoto() {
        if (imageCapture == null) return;

        // Create content values for the photo
        ContentValues contentValues = new ContentValues();
        contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, "AI_English_" + System.currentTimeMillis());
        contentValues.put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            contentValues.put(MediaStore.MediaColumns.RELATIVE_PATH, "Pictures/AIEnglish");
        }

        ImageCapture.OutputFileOptions outputOptions = new ImageCapture.OutputFileOptions.Builder(
                getContentResolver(),
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                contentValues
        ).build();

        imageCapture.takePicture(outputOptions, AppExecutors.getInstance().diskIO(), new ImageCapture.OnImageSavedCallback() {
            @Override
            public void onImageSaved(@NonNull ImageCapture.OutputFileResults outputFileResults) {
                AppExecutors.getInstance().mainThread().execute(() -> {
                    Toast.makeText(CameraActivity.this, "拍照成功", Toast.LENGTH_SHORT).show();
                    Uri savedUri = outputFileResults.getSavedUri();
                    if (savedUri != null) {
                        navigateToResult(savedUri);
                    } else {
                        finish();
                    }
                });
            }

            @Override
            public void onError(@NonNull ImageCaptureException exception) {
                AppExecutors.getInstance().mainThread().execute(() ->
                        Toast.makeText(CameraActivity.this, "拍照失败", Toast.LENGTH_SHORT).show());
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }
}
