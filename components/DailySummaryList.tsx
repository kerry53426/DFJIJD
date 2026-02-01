import React from 'react';
import { WorkLog, DailySummary } from '../types';
import { formatCurrency, formatDuration } from '../utils';
import { Calendar, Clock, DollarSign } from 'lucide-react';

interface DailySummaryListProps {
  logs: WorkLog[];
}

const DailySummaryList: React.FC<DailySummaryListProps> = ({ logs }) => {
  // Group by date
  const dailyStatsMap = logs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = { date: log.date, minutes: 0, pay: 0 };
    }
    acc[log.date].minutes += log.totalMinutes;
    acc[log.date].pay += log.totalPay;
    return acc;
  }, {} as Record<string, DailySummary>);

  // Explicitly cast Object.values result to ensure correct typing
  const dailyStats = (Object.values(dailyStatsMap) as DailySummary[]).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="p-6 border-b border-stone-100">
        <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          每日統計
        </h3>
      </div>
      
      {dailyStats.length > 0 ? (
        <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
          {dailyStats.map((stat) => (
            <div key={stat.date} className="p-4 flex items-center justify-between hover:bg-stone-50 transition">
              <div className="flex items-center gap-4">
                <div className="bg-stone-100 text-stone-600 text-sm font-semibold px-3 py-1.5 rounded-lg">
                  {stat.date}
                </div>
                <div className="flex items-center gap-1.5 text-stone-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(stat.minutes)}</span>
                </div>
              </div>
              <div className="font-bold text-emerald-700 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>{formatCurrency(stat.pay)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-stone-400">
           尚無資料
        </div>
      )}
    </div>
  );
};

export default DailySummaryList;