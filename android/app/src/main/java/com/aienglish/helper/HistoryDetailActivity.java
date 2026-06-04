package com.aienglish.helper;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.aienglish.helper.data.AppDatabase;
import com.aienglish.helper.data.SolveRecord;
import com.google.android.material.appbar.MaterialToolbar;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class HistoryDetailActivity extends AppCompatActivity {

    private final ExecutorService dbExecutor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private TextView tvQuestion, tvType, tvAnswer, tvAnalysis, tvTime;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_history_detail);

        tvQuestion = findViewById(R.id.tv_detail_question);
        tvType = findViewById(R.id.tv_detail_type);
        tvAnswer = findViewById(R.id.tv_detail_answer);
        tvAnalysis = findViewById(R.id.tv_detail_analysis);
        tvTime = findViewById(R.id.tv_detail_time);

        ((MaterialToolbar) findViewById(R.id.toolbar_detail))
                .setNavigationOnClickListener(v -> finish());

        long recordId = getIntent().getLongExtra("record_id", -1);
        if (recordId != -1) {
            loadRecordAsync(recordId);
        }
    }

    /** 在后台线程查询数据库，避免 Room 主线程异常 */
    private void loadRecordAsync(long recordId) {
        dbExecutor.execute(() -> {
            SolveRecord record = AppDatabase.getInstance(getApplicationContext())
                    .solveRecordDao().getRecordById(recordId);
            mainHandler.post(() -> {
                if (record != null) {
                    tvQuestion.setText(record.getQuestion());
                    tvType.setText(record.getQuestionType());
                    tvAnswer.setText(record.getAnswer());
                    tvAnalysis.setText(record.getAnalysis());
                    tvTime.setText(new SimpleDateFormat("yyyy/MM/dd HH:mm", Locale.CHINA)
                            .format(new Date(record.getCreatedAt())));
                }
            });
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        dbExecutor.shutdown();
    }
}
