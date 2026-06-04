package com.aienglish.helper;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.LinearLayout;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.aienglish.helper.data.AppDatabase;
import com.aienglish.helper.data.SolveRecord;
import com.aienglish.helper.data.SolveRecordDao;
import com.aienglish.helper.utils.AppExecutors;
import com.google.android.material.appbar.MaterialToolbar;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class HistoryActivity extends AppCompatActivity {

    private RecyclerView recyclerView;
    private View tvEmpty;
    private HistoryAdapter adapter;
    private SolveRecordDao dao;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_history);

        recyclerView = findViewById(R.id.recycler_history);
        tvEmpty = findViewById(R.id.tv_empty);

        // Toolbar back button
        ((MaterialToolbar) findViewById(R.id.toolbar_history)).setNavigationOnClickListener(v -> finish());

        dao = AppDatabase.getInstance(this).solveRecordDao();
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new HistoryAdapter(record -> {
            Intent intent = new Intent(HistoryActivity.this, HistoryDetailActivity.class);
            intent.putExtra("record_id", record.getId());
            startActivity(intent);
        });
        recyclerView.setAdapter(adapter);
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadRecordsAsync();
    }

    /** 在后台线程查询数据库，避免 Room 主线程异常 */
    private void loadRecordsAsync() {
        AppExecutors.getInstance().diskIO().execute(() -> {
            List<SolveRecord> records = dao.getAllRecords();
            AppExecutors.getInstance().mainThread().execute(() -> {
                if (records.isEmpty()) {
                    tvEmpty.setVisibility(View.VISIBLE);
                    recyclerView.setVisibility(RecyclerView.GONE);
                } else {
                    tvEmpty.setVisibility(View.GONE);
                    recyclerView.setVisibility(RecyclerView.VISIBLE);
                    adapter.submitList(records);
                }
            });
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }
}
