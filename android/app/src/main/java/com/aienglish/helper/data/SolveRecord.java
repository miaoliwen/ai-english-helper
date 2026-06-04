package com.aienglish.helper.data;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

/**
 * 解题记录数据模型
 */
@Entity(tableName = "solve_records")
public class SolveRecord {

    @PrimaryKey(autoGenerate = true)
    private long id;

    /** 用户输入的题目文本 */
    @ColumnInfo(name = "question")
    private String question;

    /** AI 给出的答案 */
    @ColumnInfo(name = "answer")
    private String answer;

    /** AI 给出的解析 */
    @ColumnInfo(name = "analysis")
    private String analysis;

    /** 题型 */
    @ColumnInfo(name = "question_type")
    private String questionType;

    /** 难度 */
    @ColumnInfo(name = "difficulty")
    private String difficulty;

    /** 输入方式：text / image */
    @ColumnInfo(name = "input_type")
    private String inputType;

    /** 创建时间戳（毫秒） */
    @ColumnInfo(name = "created_at")
    private long createdAt;

    public SolveRecord() {}

    // Getters & Setters
    public long getId() { return id; }
    public void setId(long id) { this.id = id; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getAnalysis() { return analysis; }
    public void setAnalysis(String analysis) { this.analysis = analysis; }

    public String getQuestionType() { return questionType; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getInputType() { return inputType; }
    public void setInputType(String inputType) { this.inputType = inputType; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}
