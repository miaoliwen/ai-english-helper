package com.aienglish.helper;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.aienglish.helper.data.SolveRecord;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * 历史记录列表适配器
 */
public class HistoryAdapter extends RecyclerView.Adapter<HistoryAdapter.ViewHolder> {

    private final List<SolveRecord> records = new ArrayList<>();
    private final OnItemClickListener listener;
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("MM/dd HH:mm", Locale.CHINA);

    public interface OnItemClickListener {
        void onItemClick(SolveRecord record);
    }

    public HistoryAdapter(OnItemClickListener listener) {
        this.listener = listener;
    }

    public void submitList(List<SolveRecord> newRecords) {
        records.clear();
        records.addAll(newRecords);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_history, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        SolveRecord record = records.get(position);
        holder.tvQuestion.setText(record.getQuestion() != null
                ? record.getQuestion() : "（无题目）");
        holder.tvAnswer.setText("答案: " + (record.getAnswer() != null ? record.getAnswer() : "—"));
        holder.tvType.setText(record.getQuestionType() != null ? record.getQuestionType() : "未分类");
        holder.tvTime.setText(dateFormat.format(new Date(record.getCreatedAt())));
        holder.itemView.setOnClickListener(v -> listener.onItemClick(record));
    }

    @Override
    public int getItemCount() {
        return records.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView tvQuestion;
        final TextView tvAnswer;
        final TextView tvType;
        final TextView tvTime;

        ViewHolder(View itemView) {
            super(itemView);
            tvQuestion = itemView.findViewById(R.id.tv_item_question);
            tvAnswer = itemView.findViewById(R.id.tv_item_answer);
            tvType = itemView.findViewById(R.id.tv_item_type);
            tvTime = itemView.findViewById(R.id.tv_item_time);
        }
    }
}
