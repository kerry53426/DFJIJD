import React, { useState, useEffect } from 'react';
import { Play, Square, Coffee, StepForward, Clock, Cloud, CloudOff, RefreshCw, Tent } from 'lucide-react';
import { WorkLog } from '../types';
import { calculatePayBreakdown, formatElapsedTime, roundTo30Minutes } from '../utils';
import { updateRemoteSession, getRemoteSession, ActiveSession } from '../pantry';

interface ClockInTimerProps {
  onAddLog: (log: WorkLog) => void;
  defaultRate: number;
  pantryId?: string; // Replace userId with pantryId
}

const LOCAL_SESSION_KEY = 'worklog_active_session';

const ClockInTimer: React.FC<ClockInTimerProps> = ({ onAddLog, defaultRate, pantryId }) => {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [currentBreakTime, setCurrentBreakTime] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initial Load & Sync Logic
  useEffect(() => {
    const loadSession = async () => {
      if (pantryId) {
        setIsSyncing(true);
        const remoteSession = await getRemoteSession(pantryId);
        // Check if remote session is valid (not cleared)
        if (remoteSession && remoteSession.startTime > 0) {
            setSession(remoteSession);
            // Also update local storage as backup
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(remoteSession));
        } else {
             // If remote is empty, check local, but if we are in "Sync" mode, remote is truth.
             // Actually, let's keep it simple: Remote > Local. 
             // If remote is explicitly empty/cleared, we clear local.
             setSession(null);
             localStorage.removeItem(LOCAL_SESSION_KEY);
        }
        setIsSyncing(false);
      } else {
        // Local Storage Mode
        const savedSession = localStorage.getItem(LOCAL_SESSION_KEY);
        if (savedSession) {
          setSession(JSON.parse(savedSession));
        }
      }
    };
    loadSession();
    
    // Polling for remote changes
    let pollInterval: number;
    if (pantryId) {
        pollInterval = window.setInterval(async () => {
            const remote = await getRemoteSession(pantryId);
            if (remote && remote.startTime > 0) {
                setSession(prev => {
                    if (!prev || prev.status !== remote.status || prev.accumulatedBreakTime !== remote.accumulatedBreakTime) {
                        return remote;
                    }
                    return prev;
                });
            } else {
                setSession(prev => prev ? null : null);
            }
        }, 10000); 
    }

    return () => clearInterval(pollInterval);
  }, [pantryId]);

  // Save Session Helper
  const saveSession = async (newSession: ActiveSession | null) => {
    setSession(newSession);
    
    if (newSession) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(newSession));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }

    if (pantryId) {
      setIsSyncing(true);
      await updateRemoteSession(pantryId, newSession);
      setIsSyncing(false);
    }
  };

  // Timer Tick Logic
  useEffect(() => {
    let interval: number;

    if (session) {
      interval = window.setInterval(() => {
        const now = Date.now();
        
        if (session.status === 'working') {
          setElapsedTime(now - session.startTime - session.accumulatedBreakTime);
          setCurrentBreakTime(0);
        } else if (session.status === 'break' && session.breakStartTime) {
          setCurrentBreakTime(now - session.breakStartTime);
          setElapsedTime(session.breakStartTime - session.startTime - session.accumulatedBreakTime);
        }
      }, 1000);
    } else {
      setElapsedTime(0);
      setCurrentBreakTime(0);
    }

    return () => clearInterval(interval);
  }, [session]);

  const handleClockIn = () => {
    // Prevent duplicate clock-in
    if (session) return; 

    const now = Date.now();
    saveSession({
      status: 'working',
      startTime: now,
      breakStartTime: null,
      accumulatedBreakTime: 0
    });
  };

  const handleStartBreak = () => {
    if (!session) return;
    const now = Date.now();
    saveSession({
      ...session,
      status: 'break',
      breakStartTime: now
    });
  };

  const handleEndBreak = () => {
    if (!session || !session.breakStartTime) return;
    const now = Date.now();
    const breakDuration = now - session.breakStartTime;
    
    saveSession({
      ...session,
      status: 'working',
      breakStartTime: null,
      accumulatedBreakTime: session.accumulatedBreakTime + breakDuration
    });
  };

  const handleClockOut = () => {
    if (!session) return;
    
    let finalAccumulatedBreak = session.accumulatedBreakTime;
    let endTime = Date.now();

    if (session.status === 'break' && session.breakStartTime) {
      finalAccumulatedBreak += (endTime - session.breakStartTime);
    }

    const totalDurationMs = endTime - session.startTime;
    const workDurationMs = totalDurationMs - finalAccumulatedBreak;
    
    const breakMinutes = Math.floor(finalAccumulatedBreak / 60000);
    const rawWorkMinutes = Math.floor(workDurationMs / 60000);

    // Apply 30-minute rounding
    const actualWorkMinutes = roundTo30Minutes(rawWorkMinutes);

    if (actualWorkMinutes <= 0) {
      if(!window.confirm(`實際工時 ${rawWorkMinutes} 分鐘，未滿 30 分鐘不予計算 (計為0)，確定要儲存嗎?`)) return;
    }

    const formatTimeStr = (ts: number) => {
        const d = new Date(ts);
        return d.toTimeString().slice(0, 5);
    };

    const logDate = new Date(session.startTime);
    logDate.setMinutes(logDate.getMinutes() - logDate.getTimezoneOffset());
    const dateStr = logDate.toJSON().slice(0, 10);

    const { regularMinutes, overtimeLevel1Minutes, overtimeLevel2Minutes, totalPay } = calculatePayBreakdown(actualWorkMinutes, defaultRate);

    const newLog: WorkLog = {
      id: crypto.randomUUID(),
      date: dateStr,
      startTime: formatTimeStr(session.startTime),
      endTime: formatTimeStr(endTime),
      breakMinutes: breakMinutes,
      hourlyRate: defaultRate,
      totalMinutes: actualWorkMinutes,
      regularMinutes,
      overtimeLevel1Minutes,
      overtimeLevel2Minutes,
      totalPay,
      note: '打卡紀錄'
    };

    onAddLog(newLog);
    saveSession(null);
  };

  // Not Clocked In View
  if (!session) {
    return (
      <div className="bg-gradient-to-br from-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
        {/* Camping decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        {pantryId && (
            <div className="absolute top-4 right-4 text-emerald-200 flex items-center gap-1">
                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-5 h-5" />}
            </div>
        )}
        <div className="flex flex-col items-center justify-center text-center relative z-10">
          <Tent className="w-12 h-12 mb-4 text-emerald-100" />
          <h2 className="text-2xl font-bold mb-2 tracking-wide">開始今日的冒險</h2>
          <p className="mb-6 text-emerald-100 font-light">點擊下方按鈕開始計時</p>
          <button
            onClick={handleClockIn}
            className="group relative bg-amber-500 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:bg-amber-400 hover:shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Play className="w-6 h-6 fill-white" />
            <span className="text-xl text-white">上班打卡</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Session View
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-emerald-100 mb-8 relative">
       {pantryId ? (
         <div className="absolute top-4 right-4 text-emerald-600 flex items-center gap-1 text-xs" title="Pantry 同步中">
           {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
           <span>{isSyncing ? '同步中' : '已連線'}</span>
         </div>
       ) : (
         <div className="absolute top-4 right-4 text-stone-300 flex items-center gap-1 text-xs" title="僅儲存於本機">
           <CloudOff className="w-4 h-4" /> 本機
         </div>
       )}

       {/* Timer Display */}
       <div className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-2">
            {session.status === 'working' ? '工作中 - Keep Going' : '休息中 - Take a Break'}
          </p>
          <div className={`text-5xl font-mono font-bold tabular-nums tracking-tight ${session.status === 'working' ? 'text-emerald-700' : 'text-amber-500'}`}>
             {session.status === 'working' ? formatElapsedTime(elapsedTime) : formatElapsedTime(currentBreakTime)}
          </div>
          {session.status === 'break' && (
            <p className="text-sm text-stone-400 mt-2">
               已工作: {formatElapsedTime(elapsedTime)}
            </p>
          )}
       </div>

       {/* Actions */}
       <div className="grid grid-cols-2 gap-4">
          {session.status === 'working' ? (
             <button
                onClick={handleStartBreak}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition"
             >
                <Coffee className="w-6 h-6" />
                <span>休息</span>
             </button>
          ) : (
             <button
                onClick={handleEndBreak}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition"
             >
                <StepForward className="w-6 h-6" />
                <span>繼續工作</span>
             </button>
          )}

          <button
             onClick={handleClockOut}
             className="bg-stone-700 hover:bg-stone-600 text-white font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition"
          >
             <Square className="w-6 h-6 fill-white" />
             <span>下班打卡</span>
          </button>
       </div>
    </div>
  );
};

export default ClockInTimer;