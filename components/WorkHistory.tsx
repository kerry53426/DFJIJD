import React, { useState, useEffect, useMemo } from 'react';
import { WorkLog } from '../types';
import { formatCurrency, formatDuration } from '../utils';
import { Trash2, Calendar, Clock, Coffee, Zap, MapPin, ChevronDown, ChevronRight, Filter, Calculator, CheckCircle2 } from 'lucide-react';

interface WorkHistoryProps {
  logs: WorkLog[];
  onDeleteLog: (id: string) => void;
}

const WorkHistory: React.FC<WorkHistoryProps> = ({ logs, onDeleteLog }) => {
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  
  // 1. Extract Years from data
  const availableYears = useMemo(() => {
    const years = new Set(logs.map(log => log.date.substring(0, 4)));
    return Array.from(years).sort((a: string, b: string) => b.localeCompare(a));
  }, [logs]);

  // State for filters
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Initialize default year to the latest one
  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears]);

  // 2. Extract Months available in the selected Year
  const availableMonthsInYear = useMemo(() => {
    if (!selectedYear || selectedYear === 'all') return [];
    const yearLogs = logs.filter(log => log.date.startsWith(selectedYear));
    const months = new Set(yearLogs.map(log => log.date.substring(5, 7))); // "01", "02"
    return Array.from(months).sort((a: string, b: string) => b.localeCompare(a));
  }, [selectedYear, logs]);

  // 3. Filter Logs based on selection
  const filteredLogs = useMemo(() => {
    let result = logs;
    
    if (selectedYear && selectedYear !== 'all') {
      result = result.filter(log => log.date.startsWith(selectedYear));
    }

    if (selectedMonth && selectedMonth !== 'all') {
      result = result.filter(log => log.date.substring(5, 7) === selectedMonth);
    }

    return result;
  }, [logs, selectedYear, selectedMonth]);

  // 4. Calculate Summary for the current view
  const viewSummary = useMemo(() => {
    return filteredLogs.reduce((acc, log) => ({
        pay: acc.pay + log.totalPay,
        minutes: acc.minutes + log.totalMinutes,
        count: acc.count + 1
    }), { pay: 0, minutes: 0, count: 0 });
  }, [filteredLogs]);

  // Group filtered logs by Month for display
  const groupedLogs = useMemo(() => {
    return filteredLogs.reduce((acc, log) => {
      const month = log.date.substring(0, 7); // "2026-02"
      if (!acc[month]) acc[month] = [];
      acc[month].push(log);
      return acc;
    }, {} as Record<string, WorkLog[]>);
  }, [filteredLogs]);

  const sortedGroupKeys = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  // Auto-expand if only one month is showing (user selected a specific month)
  useEffect(() => {
    if (selectedMonth !== 'all' && sortedGroupKeys.length === 1) {
      setExpandedMonths(prev => ({ ...prev, [sortedGroupKeys[0]]: true }));
    }
  }, [selectedMonth, sortedGroupKeys]);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-stone-400 bg-white rounded-xl border border-stone-200 border-dashed">
        <p>目前沒有紀錄，請新增您的第一筆工時。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* --- Filter Section --- */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm sticky top-[72px] z-20 space-y-4">
        
        {/* Year Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-sm font-bold text-stone-500 whitespace-nowrap mr-2">年份:</span>
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => { setSelectedYear(year); setSelectedMonth('all'); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                selectedYear === year 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {year}
            </button>
          ))}
          <button
              onClick={() => { setSelectedYear('all'); setSelectedMonth('all'); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                selectedYear === 'all' 
                  ? 'bg-stone-800 text-white shadow-md' 
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              全部
          </button>
        </div>

        {/* Month Chips (Only if year is selected) */}
        {selectedYear !== 'all' && (
          <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-stone-100">
             <span className="text-sm font-bold text-stone-500 mr-2">月份:</span>
             <button
                onClick={() => setSelectedMonth('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                  selectedMonth === 'all'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
             >
                全部月份
             </button>
             {availableMonthsInYear.map(month => (
               <button
                 key={month}
                 onClick={() => setSelectedMonth(month)}
                 className={`w-10 h-8 flex items-center justify-center rounded-lg text-xs font-bold border transition ${
                   selectedMonth === month
                     ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                     : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                 }`}
               >
                 {parseInt(month)}月
               </button>
             ))}
          </div>
        )}

        {/* Filter Summary Card */}
        <div className="bg-stone-50 rounded-lg p-3 flex justify-between items-center border border-stone-200">
           <div className="text-xs text-stone-500">
              {selectedYear === 'all' ? '歷年總計' : `${selectedYear}年 ${selectedMonth !== 'all' ? `${parseInt(selectedMonth)}月` : '全年度'}`}
              <span className="mx-2">•</span>
              {viewSummary.count} 筆紀錄
           </div>
           <div className="text-right">
              <div className="text-xs text-stone-500">{formatDuration(viewSummary.minutes)}</div>
              <div className="text-sm font-bold text-emerald-700">{formatCurrency(viewSummary.pay)}</div>
           </div>
        </div>
      </div>

      {/* --- List Section --- */}
      <div className="space-y-4">
        {sortedGroupKeys.length === 0 ? (
           <div className="text-center py-10 text-stone-400">
              該區間沒有資料
           </div>
        ) : (
          sortedGroupKeys.map(monthKey => {
            const monthlyLogs = groupedLogs[monthKey];
            const monthlyTotalPay = monthlyLogs.reduce((sum, log) => sum + log.totalPay, 0);
            const monthlyTotalMinutes = monthlyLogs.reduce((sum, log) => sum + log.totalMinutes, 0);
            const isExpanded = expandedMonths[monthKey];

            return (
              <div key={monthKey} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden transition-all duration-300">
                {/* Clickable Header */}
                <button 
                  onClick={() => toggleMonth(monthKey)}
                  className={`w-full flex items-center justify-between p-4 transition-colors ${isExpanded ? 'bg-emerald-50/50' : 'bg-white hover:bg-stone-50'}`}
                >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-stone-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-stone-400" />
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                          {monthKey}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-sm text-stone-500 mb-0.5 font-medium">
                          {formatDuration(monthlyTotalMinutes)}
                      </span>
                      <span className="text-base font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          {formatCurrency(monthlyTotalPay)}
                      </span>
                    </div>
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/30 p-3 space-y-3 animate-fade-in">
                    {monthlyLogs.map((log) => {
                      const overtime = (log.overtimeLevel1Minutes || 0) + (log.overtimeLevel2Minutes || 0);
                      return (
                          <div key={log.id} className="bg-white rounded-lg border border-stone-200 p-3 hover:shadow-md transition duration-200 border-l-4 border-l-stone-300 relative group">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-stone-100 text-stone-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-stone-500" />
                                    {log.date.substring(8)}日
                                  </span>
                                  {log.note && <span className="text-xs text-stone-500 italic truncate max-w-[150px]">- {log.note}</span>}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs sm:text-sm text-stone-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-emerald-500" />
                                    <span>{log.startTime}-{log.endTime}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">工時: {formatDuration(log.totalMinutes)}</span>
                                  </div>
                                  
                                  {/* Break Information Display */}
                                  {(log.breakMinutes > 0) && (
                                    <div className="flex items-center gap-1 text-stone-500">
                                      <Coffee className="w-3 h-3" />
                                      {log.breakStartTime && log.breakEndTime ? (
                                         <span>休 {log.breakStartTime}-{log.breakEndTime} ({log.breakMinutes}m)</span>
                                      ) : (
                                         <span>休 {log.breakMinutes}m</span>
                                      )}
                                    </div>
                                  )}
                                  
                                  {overtime > 0 && (
                                    <div className="flex items-center gap-1 text-amber-600 font-bold">
                                      <Zap className="w-3 h-3" />
                                      <span>+{formatDuration(overtime)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end justify-between gap-3 min-h-[60px]">
                                <span className="text-base font-bold text-stone-700">
                                  {formatCurrency(log.totalPay)}
                                </span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation(); 
                                    if(window.confirm('確定要刪除這筆紀錄嗎?')) onDeleteLog(log.id);
                                  }}
                                  className="opacity-60 hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                                  title="刪除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                      );
                    })}
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

export default WorkHistory;