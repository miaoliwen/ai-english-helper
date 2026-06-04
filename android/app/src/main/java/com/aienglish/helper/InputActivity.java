package com.aienglish.helper;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.chip.Chip;
import com.google.android.material.textfield.TextInputEditText;

public class InputActivity extends AppCompatActivity {

    private TextInputEditText etQuestion;
    private MaterialButton btnSubmit;
    private TextView tvCharCount;
    private static final int MAX_CHARS = 2000;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_input);

        etQuestion = findViewById(R.id.et_question);
        btnSubmit = findViewById(R.id.btn_submit);
        tvCharCount = findViewById(R.id.tv_char_count);

        // Toolbar back button
        ((MaterialToolbar) findViewById(R.id.toolbar_input)).setNavigationOnClickListener(v -> finish());

        // Text change listener to enable/disable submit and update char count
        etQuestion.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                int len = s.toString().trim().length();
                btnSubmit.setEnabled(len > 0);
                tvCharCount.setText(len + " / " + MAX_CHARS);
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        // Submit button
        btnSubmit.setOnClickListener(v -> {
            String questionText = etQuestion.getText().toString().trim();
            if (!questionText.isEmpty()) {
                Intent intent = new Intent(InputActivity.this, ResultActivity.class);
                intent.putExtra("question", questionText);
                startActivity(intent);
            }
        });

        // Quick example chips
        findViewById(R.id.chip_example1).setOnClickListener(v ->
                etQuestion.setText("What is the meaning of \"ubiquitous\" in the following sentence? \"Smartphones have become ubiquitous in modern society.\""));
        findViewById(R.id.chip_example2).setOnClickListener(v ->
                etQuestion.setText("Read the passage and answer the question:\n\nThe Internet has revolutionized the way we communicate. From email to social media, people can now connect with each other instantly across the globe. However, this connectivity also brings challenges, such as privacy concerns and information overload.\n\nQuestion: What is the main idea of this passage?"));
        findViewById(R.id.chip_example3).setOnClickListener(v ->
                etQuestion.setText("She was ___ tired that she couldn't keep her eyes open.\n\nA. so\nB. such\nC. too\nD. very"));
    }
}
