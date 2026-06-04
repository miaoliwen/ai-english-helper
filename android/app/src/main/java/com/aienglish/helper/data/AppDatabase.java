package com.aienglish.helper.data;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

/**
 * 解题记录 Room 数据库
 */
@Database(entities = {SolveRecord.class}, version = 1, exportSchema = false)
public abstract class AppDatabase extends RoomDatabase {

    private static volatile AppDatabase INSTANCE;
    private static final String DB_NAME = "ai_english.db";

    public abstract SolveRecordDao solveRecordDao();

    public static AppDatabase getInstance(Context context) {
        if (INSTANCE == null) {
            synchronized (AppDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(
                            context.getApplicationContext(),
                            AppDatabase.class,
                            DB_NAME
                    ).build();
                }
            }
        }
        return INSTANCE;
    }
}
