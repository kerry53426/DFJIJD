import React, { useState } from 'react';
import { WorkLog } from '../types';
import { formatCurrency, formatDuration, downloadCSV, generateTextReport } from '../utils';
import { TrendingUp, Clock, CalendarDays, Download, Copy, ChevronDown, ChevronUp, Zap, Calendar, DollarSign, Wallet, FileText } from 'lucide-react';

interface DashboardProps {
  logs: WorkLog[];
}

interface MonthlyStats {
  month: string; // YYYY-MM
  totalPay: number;
  totalMinutes: number;
  overtimeMinutes: number;
  daysWorked: number;
}

const Dashboard: React.FC<DashboardProps> = ({ logs }) => {
  // Global Stats
  const totalPay = logs.reduce((acc, log) => acc + log.totalPay, 0);
  const totalMinutes = logs.reduce((acc, log) => acc + log.totalMinutes, 0);
  const daysWorked = new Set(logs.map(log => log.date)).size;

  // State for expanding monthly details
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  // Calculate Monthly Statistics
  const monthlyStatsMap = logs.reduce((acc, log) => {
    const month = log.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { 
        month, 
        totalPay: 0, 
        totalMinutes: 0, 
        overtimeMinutes: 0, 
        daysWorked: 0,
        tempDays: new Set() 
      };
    }
    acc[month].totalPay += log.totalPay;
    acc[month].totalMinutes += log.totalMinutes;
    acc[month].overtimeMinutes += ((log.overtimeLevel1Minutes || 0) + (log.overtimeLevel2Minutes || 0));
    acc[month].tempDays.add(log.date);
    return acc;
  }, {} as Record<string, MonthlyStats & { tempDays: Set<string> }>);

  const monthlyStats = Object.values(monthlyStatsMap)
    .map((stats: MonthlyStats & { tempDays: Set<string> }) => ({...stats, daysWorked: stats.tempDays.size}))
    .sort((a, b) => b.month.localeCompare(a.month));

  // Global Handlers
  const handleCopyReportAll = async () => {
    const text = generateTextReport(logs);
    try {
      await navigator.clipboard.writeText(text);
      alert("所有紀錄的報表內容已複製！");
    } catch (err) {
      console.error("Copy failed", err);
      alert("複製失敗，請檢查瀏覽器權限。");
    }
  };

  const toggleMonth = (month: string) => {
    setExpandedMonth(expandedMonth === month ? null : month);
  };

  // Monthly Handlers
  const handleDownloadMonth = (e: React.MouseEvent, monthLogs: WorkLog[]) => {
    e.stopPropagation(); // Prevent card toggle
    downloadCSV(monthLogs);
  };

  const handleCopyMonth = async (e: React.MouseEvent, monthLogs: WorkLog[]) => {
    e.stopPropagation(); // Prevent card toggle
    const text = generateTextReport(monthLogs);
    try {
      await navigator.clipboard.writeText(text);
      alert("該月報表已複製！");
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* --- Top Action Bar --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h2 className="text-2xl font-bold text-stone-800">概況總覽</h2>
            <p className="text-stone-500 text-sm mt-1">追蹤您的收入與工時效率</p>
         </div>
         {logs.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto bg-white p-1.5 rounded-xl shadow-sm border border-stone-200">
              <span className="text-xs text-stone-400 font-medium px-2 hidden sm:block">所有紀錄:</span>
              <button 
                onClick={handleCopyReportAll}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-stone-50 text-stone-600 hover:bg-stone-100 text-xs font-bold rounded-lg transition"
                title="複製所有紀錄文字"
              >
                <Copy className="w-3.5 h-3.5" />
                全複製
              </button>
              <button 
                onClick={() => downloadCSV(logs)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-stone-50 text-stone-600 hover:bg-stone-100 text-xs font-bold rounded-lg transition"
                title="下載所有紀錄 CSV"
              >
                <Download className="w-3.5 h-3.5" />
                全下載
              </button>
            </div>
          )}
      </div>

      {/* --- Hero Stats Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Income Card - Highlighted */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 shadow-lg text-white group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-3 opacity-90">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                   <Wallet className="w-5 h-5 text-emerald-50" />
                </div>
                <span className="text-sm font-medium tracking-wide">總收入</span>
             </div>
             <div className="text-3xl font-bold tracking-tight">{formatCurrency(totalPay)}</div>
             <div className="mt-4 pt-4 border-t border-white/20 text-xs text-emerald-100 flex justify-between">
                <span>平均時薪</span>
                <span className="font-mono">
                  {totalMinutes > 0 ? formatCurrency(Math.round(totalPay / (totalMinutes / 60))) : '$0'} / hr
                </span>
             </div>
          </div>
        </div>

        {/* Total Hours Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-bold text-stone-500">總工時</span>
            </div>
            <div className="text-3xl font-bold text-stone-800">{formatDuration(totalMinutes)}</div>
          </div>
        </div>

        {/* Days Worked Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-sky-100 rounded-lg">
                <CalendarDays className="w-5 h-5 text-sky-600" />
              </div>
              <span className="text-sm font-bold text-stone-500">工作天數</span>
            </div>
            <div className="text-3xl font-bold text-stone-800">{daysWorked} <span className="text-lg font-medium text-stone-400">天</span></div>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-200 my-4"></div>

      {/* --- Monthly Breakdown Cards --- */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
           <TrendingUp className="w-5 h-5 text-emerald-600" />
           月度統計
        </h3>

        {monthlyStats.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 border-dashed text-stone-400">
             尚無資料，請先開始記錄您的工時。
          </div>
        ) : (
          monthlyStats.map((stat) => {
            const isExpanded = expandedMonth === stat.month;
            // Get logs for this month
            const monthLogs = logs.filter(log => log.date.startsWith(stat.month)).sort((a, b) => b.date.localeCompare(a.date));
            const [year, month] = stat.month.split('-');

            return (
              <div key={stat.month} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden transition-all duration-300">
                {/* Header Section (Always Visible) */}
                <div 
                  onClick={() => toggleMonth(stat.month)}
                  className="p-5 cursor-pointer hover:bg-stone-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Month Identity */}
                    <div className="flex items-center gap-4">
                       <div className="bg-emerald-100 text-emerald-800 w-14 h-14 rounded-xl flex flex-col items-center justify-center border border-emerald-200 flex-shrink-0">
                          <span className="text-xs font-semibold opacity-70">{year}</span>
                          <span className="text-xl font-bold leading-none">{parseInt(month)}月</span>
                       </div>
                       <div>
                          <div className="text-2xl font-bold text-stone-800">{formatCurrency(stat.totalPay)}</div>
                          <div className="text-sm text-stone-500 flex items-center gap-2">
                             <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(stat.totalMinutes)}</span>
                             <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                             <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {stat.daysWorked} 天</span>
                          </div>
                       </div>
                    </div>

                    {/* Stats Pill & Actions */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                       
                       {/* Overtime Pill */}
                       {stat.overtimeMinutes > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-100">
                             <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                             OT {formatDuration(stat.overtimeMinutes)}
                          </div>
                       )}

                       {/* Monthly Actions */}
                       <div className="flex items-center bg-stone-100 rounded-lg p-1 gap-1" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={(e) => handleCopyMonth(e, monthLogs)}
                            className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-white rounded-md transition shadow-sm"
                            title="複製此月報表"
                          >
                             <Copy className="w-4 h-4" />
                          </button>
                          <div className="w-px h-4 bg-stone-300"></div>
                          <button 
                            onClick={(e) => handleDownloadMonth(e, monthLogs)}
                            className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-white rounded-md transition shadow-sm"
                            title="下載此月 CSV"
                          >
                             <Download className="w-4 h-4" />
                          </button>
                       </div>

                       <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                       </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/50">
                    <div className="p-4">
                       <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 ml-1">當月每日明細</h4>
                       <div className="grid grid-cols-1 gap-2">
                          {monthLogs.map(log => {
                             const overtime = (log.overtimeLevel1Minutes || 0) + (log.overtimeLevel2Minutes || 0);
                             return (
                                <div key={log.id} className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between hover:border-emerald-200 transition-colors">
                                   <div className="flex items-center gap-3">
                                      <div className="text-stone-500 font-mono text-sm bg-stone-100 px-2 py-1 rounded">
                                         {log.date.substring(5)}
                                      </div>
                                      <div>
                                         <div className="text-sm font-medium text-stone-800 flex items-center gap-2">
                                            {formatDuration(log.totalMinutes)}
                                            {overtime > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded-sm">OT</span>}
                                         </div>
                                         <div className="text-xs text-stone-400">
                                            {log.startTime}-{log.endTime}
                                         </div>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <div className="font-bold text-emerald-700">{formatCurrency(log.totalPay)}</div>
                                      {log.note && <div className="text-xs text-stone-400 max-w-[100px] truncate">{log.note}</div>}
                                   </div>
                                </div>
                             )
                          })}
                       </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Dashboard;