export interface WorkLog {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakMinutes: number;
  hourlyRate: number;
  totalMinutes: number; // Total worked minutes (excluding break)
  
  // Overtime breakdown
  regularMinutes: number; // First 8 hours (480 mins)
  overtimeLevel1Minutes: number; // Next 2 hours (1.34x)
  overtimeLevel2Minutes: number; // Beyond 10 hours (1.67x)
  
  totalPay: number;
  note?: string;
}

export interface DailySummary {
  date: string;
  minutes: number;
  pay: number;
}
