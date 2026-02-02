import React, { useState, useEffect } from 'react';
import { WorkLog } from './types';
import { sortLogs } from './utils';
import WorkEntryForm from './components/WorkEntryForm';
import Dashboard from './components/Dashboard';
import WorkHistory from './components/WorkHistory';
import { Briefcase, LayoutDashboard, List, Settings, Cloud, Link, LogOut, Loader2, TentTree } from 'lucide-react';
import { getRemoteLogs, updateRemoteLogs, validatePantryId } from './pantry';

const STORAGE_KEY = 'worklog_pro_data';
const RATE_KEY = 'worklog_pro_rate';
const PANTRY_ID_KEY = 'worklog_pantry_id';
// 使用者指定的預設 Pantry ID
const DEFAULT_PANTRY_ID = '085e1276-c22a-4c58-9a2b-3b40d8fce6d9';

const App: React.FC = () => {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'add'>('add');
  const [defaultRate, setDefaultRate] = useState<number>(220);
  const [showSettings, setShowSettings] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  
  const [pantryId, setPantryId] = useState<string>('');
  const [inputPantryId, setInputPantryId] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Load Initial Settings
  useEffect(() => {
    const savedRate = localStorage.getItem(RATE_KEY);
    if (savedRate) setDefaultRate(Number(savedRate));

    const savedPantryId = localStorage.getItem(PANTRY_ID_KEY);
    if (savedPantryId) {
      setPantryId(savedPantryId);
      setInputPantryId(savedPantryId);
    } else {
      // 若無儲存紀錄，自動使用預設 ID
      setPantryId(DEFAULT_PANTRY_ID);
      setInputPantryId(DEFAULT_PANTRY_ID);
      localStorage.setItem(PANTRY_ID_KEY, DEFAULT_PANTRY_ID);
    }
    
    // Initial Data Load (Local)
    const savedLogs = localStorage.getItem(STORAGE_KEY);
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Failed to parse local logs", e);
      }
    }
  }, []);

  // Save Settings
  useEffect(() => {
    localStorage.setItem(RATE_KEY, defaultRate.toString());
  }, [defaultRate]);

  // Sync with Pantry when PantryID changes or on mount
  useEffect(() => {
    const syncData = async () => {
      if (!pantryId) return;
      
      setIsSyncing(true);
      const remoteLogs = await getRemoteLogs(pantryId);
      
      if (remoteLogs.length > 0) {
        setLogs(sortLogs(remoteLogs));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sortLogs(remoteLogs)));
      } else if (logs.length > 0) {
        await updateRemoteLogs(pantryId, logs);
      }
      setIsSyncing(false);
    };

    syncData();
  }, [pantryId]);

  // Handler: Connect to Pantry
  const handleConnectPantry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPantryId.trim()) return;

    setIsSyncing(true);
    const isValid = await validatePantryId(inputPantryId.trim());
    setIsSyncing(false);

    if (isValid) {
      setPantryId(inputPantryId.trim());
      localStorage.setItem(PANTRY_ID_KEY, inputPantryId.trim());
      setShowSyncModal(false);
      alert("連線成功！資料將開始同步。");
    } else {
      alert("無效的 Pantry ID，請檢查後再試。");
    }
  };

  const handleDisconnect = () => {
    if(window.confirm("確定要取消連結嗎？這將停止同步功能。")) {
      setPantryId('');
      localStorage.removeItem(PANTRY_ID_KEY);
      setLogs([]); 
      alert("已取消連結。目前為離線模式。");
    }
  };

  // Add Log
  const handleAddLog = async (newLog: WorkLog) => {
    const updatedLogs = sortLogs([newLog, ...logs]);
    setLogs(updatedLogs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    
    if (pantryId) {
      setIsSyncing(true);
      await updateRemoteLogs(pantryId, updatedLogs);
      setIsSyncing(false);
    }
    // Modify: Stay on current tab instead of switching to history
    // setActiveTab('history'); 
  };

  // Delete Log
  const handleDeleteLog = async (id: string) => {
    const updatedLogs = logs.filter(log => log.id !== id);
    setLogs(updatedLogs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));

    if (pantryId) {
      setIsSyncing(true);
      await updateRemoteLogs(pantryId, updatedLogs);
      setIsSyncing(false);
    }
    
    // Alert user after deletion
    setTimeout(() => alert("紀錄已成功刪除。"), 100);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-700 p-2 rounded-lg shadow-sm">
              <TentTree className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-emerald-900 tracking-tight hidden sm:block">WorkLog Pro</h1>
          </div>
          
          <div className="flex items-center gap-2">
             {pantryId ? (
               <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                 <Cloud className="w-4 h-4 text-emerald-600" />
                 <span className="text-xs font-medium text-emerald-700 hidden sm:block">已同步</span>
                 <button onClick={handleDisconnect} className="text-stone-400 hover:text-red-500 ml-1" title="中斷連線">
                   <LogOut className="w-4 h-4" />
                 </button>
               </div>
             ) : (
               <button 
                onClick={() => setShowSyncModal(true)}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full text-sm font-medium transition"
               >
                 <Link className="w-4 h-4" />
                 <span>設定同步</span>
               </button>
             )}

            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-stone-500 hover:bg-stone-100 rounded-full transition"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="max-w-3xl mx-auto px-4 py-4 bg-emerald-50 border-b border-emerald-100 animate-fade-in">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-emerald-900">預設時薪設定:</label>
            <input 
              type="number" 
              value={defaultRate} 
              onChange={(e) => setDefaultRate(Number(e.target.value))}
              className="px-3 py-1 border border-emerald-200 rounded-md w-24 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-sm text-emerald-700">TWD</span>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <Cloud className="w-6 h-6 text-emerald-600" />
              設定 Pantry 同步
            </h2>
            <p className="text-sm text-stone-500 mb-4 leading-relaxed">
              使用 Pantry ID 來跨裝置同步您的工時資料。請至 <a href="https://getpantry.cloud/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">getpantry.cloud</a> 免費取得 ID。
              <br/><span className="text-xs text-amber-600">注意：請妥善保管您的 ID，擁有 ID 者皆可存取資料。</span>
            </p>
            
            <form onSubmit={handleConnectPantry}>
              <label className="block text-sm font-medium text-stone-700 mb-1">您的 Pantry ID</label>
              <input 
                type="text" 
                value={inputPantryId}
                onChange={(e) => setInputPantryId(e.target.value)}
                placeholder="例如: 98765432-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none mb-4"
                required
              />
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowSyncModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg font-medium"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  disabled={isSyncing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  {isSyncing && <Loader2 className="w-4 h-4 animate-spin" />}
                  連線同步
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {!pantryId && logs.length > 0 && (
           <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm mb-4">
             ⚠️ 目前為本機模式。若需跨裝置同步，請點擊右上角「設定同步」。
           </div>
        )}

        {activeTab === 'dashboard' && <Dashboard logs={logs} />}
        {activeTab === 'add' && <WorkEntryForm onAddLog={handleAddLog} defaultRate={defaultRate} pantryId={pantryId} />}
        {activeTab === 'history' && <WorkHistory logs={logs} onDeleteLog={handleDeleteLog} />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 md:hidden z-20">
        <div className="flex justify-around items-center">
          <button 
            onClick={() => setActiveTab('add')}
            className={`p-4 flex flex-col items-center gap-1 ${activeTab === 'add' ? 'text-emerald-700' : 'text-stone-400'}`}
          >
            <div className="relative">
              <Briefcase className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">記帳</span>
          </button>

          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`p-4 flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-emerald-700' : 'text-stone-400'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-xs font-medium">概況</span>
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            className={`p-4 flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-emerald-700' : 'text-stone-400'}`}
          >
            <List className="w-6 h-6" />
            <span className="text-xs font-medium">紀錄</span>
          </button>
        </div>
      </nav>

      {/* Desktop Tabs */}
      <div className="hidden md:flex justify-center gap-4 mb-8 sticky top-20 z-10">
        <button 
          onClick={() => setActiveTab('add')}
          className={`px-6 py-2 rounded-full font-medium transition ${activeTab === 'add' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
        >
          新增紀錄
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-2 rounded-full font-medium transition ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
        >
          統計概況
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-full font-medium transition ${activeTab === 'history' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
        >
          歷史紀錄
        </button>
      </div>
    </div>
  );
};

export default App;