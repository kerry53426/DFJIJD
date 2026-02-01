import React from 'react';
import { WorkLog } from '../types';
import { formatCurrency, formatDuration } from '../utils';
import { Trash2, Calendar, Clock, Coffee, Zap, MapPin } from 'lucide-react';

interface WorkHistoryProps {
  logs: WorkLog[];
  onDeleteLog: (id: string) => void;
}

const WorkHistory: React.FC<WorkHistoryProps> = ({ logs, onDeleteLog }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-stone-400">
        <p>目前沒有紀錄，請新增您的第一筆工時。</p>
      </div>
    );
  }

  // Group logs by Month (YYYY-MM)
  const groupedLogs = logs.reduce((acc, log) => {
    const month = log.date.substring(0, 7); // "2026-02"
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(log);
    return acc;
  }, {} as Record<string, WorkLog[]>);

  // Sort months descending
  const sortedMonths = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8">
      {sortedMonths.map(month => {
        const monthlyLogs = groupedLogs[month];
        const monthlyTotalPay = monthlyLogs.reduce((sum, log) => sum + log.totalPay, 0);

        return (
          <div key={month} className="space-y-3">
             {/* Month Header */}
             <div className="flex items-center justify-between sticky top-16 bg-stone-100/90 backdrop-blur-sm p-2 rounded-lg z-10">
                <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                   <Calendar className="w-5 h-5 text-amber-600" />
                   {month}
                </h3>
                <span className="text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                   月收: {formatCurrency(monthlyTotalPay)}
                </span>
             </div>

             {/* Logs List */}
             {monthlyLogs.map((log) => {
               const overtime = (log.overtimeLevel1Minutes || 0) + (log.overtimeLevel2Minutes || 0);
               return (
                  <div key={log.id} className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 hover:shadow-md transition duration-200 border-l-4 border-l-emerald-500 relative group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-stone-100 text-stone-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                             <MapPin className="w-3 h-3 text-stone-500" />
                             {log.date}
                          </span>
                          {log.note && <span className="text-sm text-stone-500 italic">- {log.note}</span>}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 text-sm">
                          <div className="flex items-center gap-1.5 text-stone-600">
                            <Clock className="w-4 h-4 text-emerald-500" />
                            <span>{log.startTime} - {log.endTime}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-stone-600">
                            <Coffee className="w-4 h-4 text-amber-500" />
                            <span>休 {log.breakMinutes} 分</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-stone-600 font-medium">
                            <span>工時: {formatDuration(log.totalMinutes)}</span>
                          </div>
                          {overtime > 0 && (
                            <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                               <Zap className="w-4 h-4" />
                               <span>加班 {formatDuration(overtime)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between gap-4">
                         <span className="text-lg font-bold text-emerald-700">
                          {formatCurrency(log.totalPay)}
                         </span>
                         <button 
                           onClick={() => {
                             if(window.confirm('確定要刪除這筆紀錄嗎? 此動作無法復原。')) onDeleteLog(log.id);
                           }}
                           className="flex items-center gap-1 text-stone-400 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded transition"
                           title="刪除"
                         >
                           <Trash2 className="w-4 h-4" />
                           <span className="text-xs font-medium">刪除</span>
                         </button>
                      </div>
                    </div>
                  </div>
               );
             })}
          </div>
        );
      })}
    </div>
  );
};

export default WorkHistory;