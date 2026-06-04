package com.aienglish.helper.data;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;

import java.util.List;

/**
 * 解题记录数据访问对象
 */
@Dao
public interface SolveRecordDao {

    @Query("SELECT * FROM solve_records ORDER BY created_at DESC")
    List<SolveRecord> getAllRecords();

    @Query("SELECT * FROM solve_records WHERE id = :id")
    SolveRecord getRecordById(long id);

    @Insert
    long insertRecord(SolveRecord record);

    @Delete
    void deleteRecord(SolveRecord record);

    @Query("DELETE FROM solve_records")
    void deleteAll();
}
