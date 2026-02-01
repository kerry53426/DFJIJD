import React from 'react';
import { WorkLog } from '../types';
import { formatCurrency, formatDuration, downloadCSV } from '../utils';
import { TrendingUp, Clock, CalendarDays, Download, Table as TableIcon, Tent } from 'lucide-react';
import DailySummaryList from './DailySummaryList';

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
  const totalPay = logs.reduce((acc, log) => acc + log.totalPay, 0);
  const totalMinutes = logs.reduce((acc, log) => acc + log.totalMinutes, 0);
  const daysWorked = new Set(logs.map(log => log.date)).size;

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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-stone-500">總收入</p>
          </div>
          <p className="text-2xl font-bold text-stone-800">{formatCurrency(totalPay)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-stone-500">總工時</p>
          </div>
          <p className="text-2xl font-bold text-stone-800">{formatDuration(totalMinutes)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sky-100 rounded-lg">
              <CalendarDays className="w-5 h-5 text-sky-600" />
            </div>
            <p className="text-sm font-medium text-stone-500">工作天數</p>
          </div>
          <p className="text-2xl font-bold text-stone-800">{daysWorked} 天</p>
        </div>
      </div>

      {/* Monthly Statistics Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center flex-wrap gap-4">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Tent className="w-5 h-5 text-emerald-600" />
            月度統計報表
          </h3>
          {logs.length > 0 && (
            <button 
              onClick={() => downloadCSV(logs)}
              className="flex items-center gap-2 px-4 py-2 bg-stone-700 text-white text-sm font-medium rounded-lg hover:bg-stone-600 transition"
            >
              <Download className="w-4 h-4" />
              下載 Excel (CSV)
            </button>
          )}
        </div>
        
        {monthlyStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-stone-600">
              <thead className="text-xs text-stone-700 uppercase bg-stone-50">
                <tr>
                  <th className="px-6 py-3">月份</th>
                  <th className="px-6 py-3">工作天數</th>
                  <th className="px-6 py-3">總工時</th>
                  <th className="px-6 py-3">加班時數</th>
                  <th className="px-6 py-3 text-right">當月總薪資</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map((stat) => (
                  <tr key={stat.month} className="bg-white border-b border-stone-100 last:border-0 hover:bg-stone-50">
                    <td className="px-6 py-4 font-medium text-stone-900">{stat.month}</td>
                    <td className="px-6 py-4">{stat.daysWorked} 天</td>
                    <td className="px-6 py-4">{formatDuration(stat.totalMinutes)}</td>
                    <td className="px-6 py-4 text-amber-600 font-medium">
                      {stat.overtimeMinutes > 0 ? formatDuration(stat.overtimeMinutes) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-700 text-lg">
                      {formatCurrency(stat.totalPay)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-emerald-50 font-bold text-emerald-900 border-t-2 border-emerald-100">
                <tr>
                  <td className="px-6 py-4">總計</td>
                  <td className="px-6 py-4">{daysWorked} 天</td>
                  <td className="px-6 py-4">{formatDuration(totalMinutes)}</td>
                  <td className="px-6 py-4">-</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(totalPay)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-stone-400">
            目前沒有資料，請先新增工時紀錄。
          </div>
        )}
      </div>

      {/* Daily Summary */}
      <DailySummaryList logs={logs} />
    </div>
  );
};

export default Dashboard;