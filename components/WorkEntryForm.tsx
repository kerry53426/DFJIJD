import React, { useState, useEffect } from 'react';
import { Save, Clock, DollarSign, Calendar, Zap, Edit3, CheckCircle, Coffee } from 'lucide-react';
import { WorkLog } from '../types';
import { calculateDurationMinutes, calculatePayBreakdown, formatCurrency, formatDuration } from '../utils';
import ClockInTimer from './ClockInTimer';

interface WorkEntryFormProps {
  onAddLog: (log: WorkLog) => void;
  defaultRate: number;
  pantryId?: string;
}

const WorkEntryForm: React.FC<WorkEntryFormProps> = ({ onAddLog, defaultRate, pantryId }) => {
  const [date, setDate] = useState<string>('2026-02-01');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('18:00');
  
  // Break Time State
  const [breakStartTime, setBreakStartTime] = useState<string>('');
  const [breakEndTime, setBreakEndTime] = useState<string>('');
  const [breakMinutes, setBreakMinutes] = useState<number>(0);

  const [hourlyRate, setHourlyRate] = useState<number>(defaultRate);
  const [note, setNote] = useState<string>('');
  
  // Success Message State
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Real-time calculation for Break
  useEffect(() => {
    if (breakStartTime && breakEndTime) {
      const mins = calculateDurationMinutes(breakStartTime, breakEndTime);
      setBreakMinutes(Math.max(0, mins));
    } else {
      setBreakMinutes(0);
    }
  }, [breakStartTime, breakEndTime]);

  // Real-time calculation for Work
  const rawDuration = calculateDurationMinutes(startTime, endTime);
  const actualWorkMinutes = Math.max(0, rawDuration - breakMinutes);
  
  const { regularMinutes, overtimeLevel1Minutes, overtimeLevel2Minutes, totalPay } = calculatePayBreakdown(actualWorkMinutes, hourlyRate);
  const hasOvertime = overtimeLevel1Minutes > 0 || overtimeLevel2Minutes > 0;

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (actualWorkMinutes <= 0) {
      alert("工作時數必須大於 0 (請檢查結束時間或休息時間)");
      return;
    }

    const newLog: WorkLog = {
      id: crypto.randomUUID(),
      date,
      startTime,
      endTime,
      breakMinutes,
      breakStartTime: breakStartTime || undefined,
      breakEndTime: breakEndTime || undefined,
      hourlyRate,
      totalMinutes: actualWorkMinutes,
      regularMinutes,
      overtimeLevel1Minutes,
      overtimeLevel2Minutes,
      totalPay,
      note
    };

    onAddLog(newLog);
    // Do not clear Date/Rate, users usually add logs for same period/rate
    setNote('');
    setShowSuccess(true);
    // Smooth scroll to top to see message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Wrapper for ClockInTimer to show success message when clocking out
  const handleClockInLog = (log: WorkLog) => {
      onAddLog(log);
      setShowSuccess(true);
  };

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {showSuccess && (
        <div className="bg-emerald-100 border border-emerald-400 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-bounce-short">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="font-bold">儲存成功！紀錄已更新。</span>
        </div>
      )}

      {/* Real-time Clock In Section */}
      <ClockInTimer onAddLog={handleClockInLog} defaultRate={defaultRate} pantryId={pantryId} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-stone-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-stone-100 text-sm text-stone-500 font-medium">或是手動輸入補登</span>
        </div>
      </div>

      {/* Manual Entry Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-emerald-600" />
          補登工時
        </h2>
        
        <form onSubmit={handleManualSubmit} className="space-y-4">
          {/* Date Row */}
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">日期</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-stone-400" />
              <input 
                type="date" 
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition bg-stone-50"
              />
            </div>
          </div>

          {/* Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">開始時間</label>
              <input 
                type="time" 
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-stone-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">結束時間</label>
              <input 
                type="time" 
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-stone-50"
              />
            </div>
          </div>

          {/* Break Section - CHANGED to Time Inputs */}
          <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
             <div className="flex items-center gap-2 mb-2 text-stone-600">
                <Coffee className="w-4 h-4" />
                <span className="text-sm font-medium">中間休息 (選填)</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-stone-500 mb-1">休息開始</label>
                  <input 
                    type="time" 
                    value={breakStartTime}
                    onChange={(e) => setBreakStartTime(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">休息結束</label>
                  <input 
                    type="time" 
                    value={breakEndTime}
                    onChange={(e) => setBreakEndTime(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none bg-white text-sm"
                  />
                </div>
             </div>
             {breakMinutes > 0 && (
                <div className="mt-2 text-xs text-stone-500 text-right">
                   共休息: <span className="font-bold text-stone-700">{formatDuration(breakMinutes)}</span>
                </div>
             )}
          </div>

          <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">時薪 (TWD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-stone-400 font-bold">$</span>
                <input 
                  type="number" 
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-stone-50"
                />
              </div>
            </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">備註 (選填)</label>
            <input 
              type="text" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如: 加班, 專案A..."
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-stone-50"
            />
          </div>

          {/* Preview Box */}
          <div className={`p-4 rounded-lg border grid grid-cols-2 gap-4 text-center transition-colors ${hasOvertime ? 'bg-amber-50 border-amber-200' : 'bg-stone-50 border-stone-200'}`}>
              <div>
                <p className="text-xs text-stone-500 uppercase font-semibold">實際工時</p>
                <p className="text-lg font-bold text-stone-800 flex justify-center items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(actualWorkMinutes)}
                </p>
                {hasOvertime && (
                   <p className="text-xs text-amber-600 mt-1 flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3" />
                      含加班 {formatDuration(overtimeLevel1Minutes + overtimeLevel2Minutes)}
                   </p>
                )}
              </div>
              <div>
                <p className="text-xs text-stone-500 uppercase font-semibold">預估薪資</p>
                <p className="text-lg font-bold text-emerald-700 flex justify-center items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(totalPay)}
                </p>
                {hasOvertime && (
                    <p className="text-xs text-stone-500 mt-1">
                      (已含加班加成)
                    </p>
                )}
              </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-600 border border-emerald-700 text-white hover:bg-emerald-700 font-bold py-3 rounded-xl shadow-sm transition transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            儲存紀錄
          </button>
        </form>
      </div>
    </div>
  );
};

export default WorkEntryForm;