import React, { useState, Suspense, lazy } from 'react';
import { 
  Monitor, Layout, Grid, ClipboardCheck, Mail, Link, Users,
  ArrowLeftToLine, ArrowRightToLine,
  Sun, Moon, Laptop, Loader2, Database
} from 'lucide-react';

import { UI_THEME } from './utils/constants';
import { useThemeContext } from './context/ThemeContext';

// 引入全域備份模組
import GlobalBackupModal from './components/common/GlobalBackupModal';

const ClassroomDashboardV2 = lazy(() => import('./ClassroomDashboardV2.jsx'));
const ExamTool = lazy(() => import('./ExamTool.jsx'));
const ClassroomManager = lazy(() => import('./ClassroomManager.jsx'));

const LoadingScreen = () => (
  <div className={`w-full h-full flex flex-col items-center justify-center ${UI_THEME.BACKGROUND}`}>
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <div className="p-4 rounded-2xl bg-white/10 shadow-xl backdrop-blur-md border border-white/20">
        <Loader2 size={48} className="text-blue-500 animate-spin" />
      </div>
      <div className={`font-bold text-lg ${UI_THEME.TEXT_SECONDARY}`}>
        應用程式載入中...
      </div>
    </div>
  </div>
);

const APPS = [
  { id: 'dashboard', name: '電子看板', icon: Monitor, color: 'bg-blue-500', component: ClassroomDashboardV2 },
  { id: 'exam', name: '監考系統', icon: ClipboardCheck, color: 'bg-rose-500', component: ExamTool },
  { id: 'manager', name: '班級經營', icon: Users, color: 'bg-amber-500', component: ClassroomManager },
    // 未來可以在這裡輕鬆加入更多 APP
];

const AppLauncher = ({ 
  isOpen, onClose, onSelect, 
  launcherPosition, setLauncherPosition
}) => {
  const { theme, cycleTheme } = useThemeContext();
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  if (!isOpen) return null;

  const getThemeIcon = () => {
    if (theme === 'system') return <Laptop size={20} />;
    if (theme === 'light') return <Sun size={20} />;
    return <Moon size={20} />;
  };

  const getThemeLabel = () => {
    if (theme === 'system') return '系統設定';
    if (theme === 'light') return '淺色模式';
    return '深色模式';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
      
      <GlobalBackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />

      <div className={`${UI_THEME.SURFACE_GLASS} p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-5xl w-full mx-4 border ${UI_THEME.BORDER_LIGHT} relative flex flex-col min-h-[500px] transition-all`} onClick={e => e.stopPropagation()}>
          
         <div className="flex-1">
             {/* Header 區域 */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <h2 className={`text-2xl md:text-3xl font-bold ${UI_THEME.TEXT_PRIMARY} flex items-center gap-3`}>
                      <Layout className="text-indigo-600 dark:text-indigo-400" /> 智慧教室儀表板
                    </h2>
                    
                    {/* 系統資料中樞按鈕 */}
                    <button 
                        onClick={() => setIsBackupOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 text-sm"
                    >
                        <Database size={16} />
                        <span>資料中樞</span>
                    </button>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={cycleTheme}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs md:text-sm ${UI_THEME.BTN_SECONDARY}`}
                        title={`目前：${getThemeLabel()}`}
                    >
                        {getThemeIcon()}
                        <span className="hidden sm:inline">{getThemeLabel()}</span>
                    </button>

                    <div className={`flex items-center gap-1 ${UI_THEME.SURFACE_CARD} border ${UI_THEME.BORDER_LIGHT} p-1 rounded-lg`}>
                        <button 
                            onClick={() => setLauncherPosition('left')}
                            className={`p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${launcherPosition === 'left' ? 'bg-slate-200 dark:bg-slate-700 shadow-sm ' + UI_THEME.TEXT_PRIMARY : UI_THEME.BTN_GHOST}`}
                        >
                            <ArrowLeftToLine size={14}/>
                        </button>
                        <button 
                            onClick={() => setLauncherPosition('right')}
                            className={`p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${launcherPosition === 'right' ? 'bg-slate-200 dark:bg-slate-700 shadow-sm ' + UI_THEME.TEXT_PRIMARY : UI_THEME.BTN_GHOST}`}
                        >
                            <ArrowRightToLine size={14}/>
                        </button>
                    </div>
                </div>
             </div>

             {/* APP Grid 區域 (修改重點) */}
             <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-8">
               {APPS.map(app => (
                 <button 
                   key={app.id} 
                   onClick={() => { onSelect(app.id); onClose(); }}
                   className="group flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95 p-2 rounded-3xl "
                 >
                   {/* 圖示容器：縮小為 w-24 h-24 (96px)，圓角改為 3xl */}
                   <div className={`w-24 h-24 rounded-3xl shadow-lg flex items-center justify-center text-white transition-all group-hover:shadow-xl group-hover:-translate-y-1 ${app.color}`}>
                     {/* 圖示大小：縮小為 40 */}
                     <app.icon size={40} />
                   </div>
                   
                   <div className="text-center">
                       {/* 文字大小：調整為 base (16px) */}
                       <div className={`text-base font-bold ${UI_THEME.TEXT_PRIMARY} mb-0.5`}>{app.name}</div>
                   </div>
                 </button>
               ))}
               
               {/* 虛擬的新增按鈕 (預覽用，您可以隨時拿掉) */}
               <div className="flex flex-col items-center gap-3 opacity-30 grayscale pointer-events-none">
                   <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400">
                     <span className="text-4xl font-thin">+</span>
                   </div>
                   <span className={`text-sm font-bold ${UI_THEME.TEXT_MUTED}`}>Coming Soon</span>
               </div>
             </div>
         </div>

         {/* Footer */}
         <div className={`mt-8 pt-6 border-t ${UI_THEME.BORDER_DEFAULT} text-center ${UI_THEME.TEXT_MUTED}`}>
             <div className={`font-bold ${UI_THEME.TEXT_PRIMARY} mb-2`}>Developed by 阿保老師</div>
             <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-xs md:text-sm">
                <a href="mailto:apaul@g.lnps.tp.edu.tw" className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Mail size={14} /> apaul@g.lnps.tp.edu.tw
                </a>
                <span className="hidden md:inline opacity-30">|</span>
                <a href="https://sites.google.com/g.lnps.tp.edu.tw/apaul-classroom/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Link size={14} /> 阿保老師的教室
                </a>
             </div>
         </div>
         
      </div>
    </div>
  );
};

const App = () => {
  const { theme, cycleTheme } = useThemeContext();

  const [currentAppId, setCurrentAppId] = useState('dashboard');
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [launcherPosition, setLauncherPosition] = useState('left');

  const CurrentComponent = APPS.find(a => a.id === currentAppId)?.component || ClassroomDashboardV2;
  const buttonPositionClass = launcherPosition === 'left' ? 'left-4' : 'right-4';

  return (
    <div className={`relative w-full h-screen ${UI_THEME.BACKGROUND} overflow-hidden transition-colors duration-500`}>
      
      <button 
        onClick={() => setIsLauncherOpen(true)}
        className={`fixed bottom-4 ${buttonPositionClass} z-[90] p-3 bg-black/5 dark:bg-white/10 hover:bg-black/80 dark:hover:bg-white/20 hover:text-white text-transparent rounded-full transition-all duration-300 group backdrop-blur-sm shadow-sm hover:shadow-xl`}
        title="切換應用程式"
      >
        <Grid size={24} className="text-slate-400 dark:text-slate-500 group-hover:text-white" />
      </button>

      <div className="w-full h-full">
         <Suspense fallback={<LoadingScreen />}>
            <CurrentComponent theme={theme} cycleTheme={cycleTheme} />
         </Suspense>
      </div>

      <AppLauncher 
        isOpen={isLauncherOpen} 
        onClose={() => setIsLauncherOpen(false)} 
        onSelect={setCurrentAppId} 
        launcherPosition={launcherPosition}
        setLauncherPosition={setLauncherPosition}
        theme={theme}
        cycleTheme={cycleTheme}
      />
    </div>
  );
};

export default App;