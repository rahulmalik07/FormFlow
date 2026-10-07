import React from 'react';
import { FormStats, QuestionStat } from '@/lib/types';

interface StatsViewProps {
  stats: FormStats;
}

export function StatsView({ stats }: StatsViewProps) {
  if (!stats.questions || stats.questions.length === 0) {
    return (
      <div className="text-center py-12 text-[#717171]">
        No statistics available yet.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[#717171] uppercase tracking-wider mb-2">Total Responses</h3>
        <p className="text-4xl font-bold text-[#191919]">{stats.total_responses}</p>
      </div>

      <div className="space-y-4">
        {stats.questions.map((question) => (
          <QuestionStatCard key={question.question_id} stat={question} />
        ))}
      </div>
    </div>
  );
}

function QuestionStatCard({ stat }: { stat: QuestionStat }) {
  const isCategorical = ['multiple_choice', 'dropdown', 'yes_no', 'rating'].includes(stat.question_type);
  const totalAnswers = stat.total_answers;

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
      <div className="mb-4">
        <h4 className="text-lg font-bold text-[#191919]">{stat.question_title}</h4>
        <p className="text-sm text-[#717171] mt-1">
          {totalAnswers} {totalAnswers === 1 ? 'answer' : 'answers'} • {stat.question_type.replace('_', ' ')}
        </p>
      </div>

      {isCategorical && stat.answer_distribution ? (
        <div className="space-y-3 mt-6">
          {Object.entries(stat.answer_distribution).map(([label, count]) => {
            const percentage = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
            return (
              <div key={label} className="relative">
                <div className="flex justify-between text-sm mb-1 z-10 relative">
                  <span className="font-medium text-[#191919] truncate pr-4">{label}</span>
                  <span className="text-[#717171] font-medium whitespace-nowrap">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#4F46E5] rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-[#E5E5E5] text-sm text-[#717171]">
          Individual answers can be viewed in the Responses tab.
        </div>
      )}
    </div>
  );
}
