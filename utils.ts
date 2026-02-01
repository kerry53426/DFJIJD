import { WorkLog } from './types';

// Format currency to TWD
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculate duration in minutes between two HH:mm strings
export const calculateDurationMinutes = (start: string, end: string): number => {
  if (!start || !end) return 0;
  
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const startDate = new Date(0, 0, 0, startH, startM, 0);
  const endDate = new Date(0, 0, 0, endH, endM, 0);

  // Handle overnight shifts (if end time is before start time, assume next day)
  if (endDate < startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / 60000);
};

// Format minutes into Xh Ym
export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}小時 ${m}分鐘`;
};

// Format milliseconds into HH:MM:SS
export const formatElapsedTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

// Get today's date in YYYY-MM-DD
export const getTodayString = (): string => {
  const local = new Date();
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toJSON().slice(0, 10);
};

// Sort logs by date descending
export const sortLogs = (logs: WorkLog[]): WorkLog[] => {
  return [...logs].sort((a, b) => {
    const dateComp = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateComp !== 0) return dateComp;
    return b.startTime.localeCompare(a.startTime);
  });
};

// Calculate Pay breakdown structure
export const calculatePayBreakdown = (totalMinutes: number, hourlyRate: number) => {
  const REGULAR_LIMIT = 480; // 8 hours
  const OT_LEVEL1_LIMIT = 120; // Next 2 hours

  let remaining = totalMinutes;
  
  // 1. Regular Hours (1.0x)
  const regularMinutes = Math.min(remaining, REGULAR_LIMIT);
  remaining = Math.max(0, remaining - regularMinutes);

  // 2. Overtime Level 1 (1.34x) - Standard Taiwan Labor Standards Act approximation
  const overtimeLevel1Minutes = Math.min(remaining, OT_LEVEL1_LIMIT);
  remaining = Math.max(0, remaining - overtimeLevel1Minutes);

  // 3. Overtime Level 2 (1.67x)
  const overtimeLevel2Minutes = remaining;

  // Calculate Pay
  const regularPay = (regularMinutes / 60) * hourlyRate;
  const ot1Pay = (overtimeLevel1Minutes / 60) * hourlyRate * 1.34;
  const ot2Pay = (overtimeLevel2Minutes / 60) * hourlyRate * 1.67;
  
  const totalPay = Math.round(regularPay + ot1Pay + ot2Pay);

  return {
    regularMinutes,
    overtimeLevel1Minutes,
    overtimeLevel2Minutes,
    totalPay
  };
};

// Export to CSV
export const downloadCSV = (logs: WorkLog[]) => {
  // Add BOM for Excel to read Chinese correctly
  const BOM = "\uFEFF";
  const headers = ["日期", "開始時間", "結束時間", "休息時間(分)", "總工時", "正常工時", "加班(前2h)", "加班(2h後)", "時薪", "總薪資", "備註"];
  
  const rows = logs.map(log => {
    return [
      log.date,
      log.startTime,
      log.endTime,
      log.breakMinutes,
      (log.totalMinutes / 60).toFixed(2) + "小時",
      (log.regularMinutes / 60).toFixed(2) + "小時",
      (log.overtimeLevel1Minutes / 60).toFixed(2) + "小時",
      (log.overtimeLevel2Minutes / 60).toFixed(2) + "小時",
      log.hourlyRate,
      log.totalPay,
      `"${log.note || ''}"` // Quote notes to handle commas
    ].join(",");
  });

  const csvContent = BOM + [headers.join(","), ...rows].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `WorkLog_Export_${getTodayString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
