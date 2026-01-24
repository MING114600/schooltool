import React, { useState } from 'react';
import { 
  Monitor, Layout, Grid, ClipboardCheck, Mail, Link, Users,
  ArrowLeftToLine, ArrowRightToLine,
  Sun, Moon, Laptop
} from 'lucide-react';

import { useTheme } from './hooks/useTheme'; 
// 1. 引入常數設定
import { UI_THEME } from './utils/constants';

import ClassroomDashboardV2 from './ClassroomDashboardV2.jsx';
import ExamTool from './ExamTool.jsx';
import ClassroomManager from './ClassroomManager.jsx';

const APPS = [
  { id: 'dashboard', name: '電子看板', icon: Monitor, color: 'bg-blue-500', component: ClassroomDashboardV2 },
  { id: 'exam', name: '監考系統', icon: ClipboardCheck, color: 'bg-rose-500', component: ExamTool },
  { id: 'manager', name: '班級經營', icon: Users, color: 'bg-amber-500', component: ClassroomManager },
];

const AppLauncher = ({ 
  isOpen, onClose, onSelect, 
  launcherPosition, setLauncherPosition,
  theme, cycleTheme 
}) => {
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
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
      {/* 2. 使用 SURFACE_GLASS 統一彈窗風格 (含深色模式支援) */}
      <div className={`${UI_THEME.SURFACE_GLASS} p-12 rounded-[3rem] shadow-2xl max-w-4xl w-full mx-4 border ${UI_THEME.BORDER_LIGHT} relative flex flex-col min-h-[600px] transition-all`} onClick={e => e.stopPropagation()}>
          
         <div className="flex-1">
             <div className="flex justify-between items-center mb-8">
                {/* 3. 使用 TEXT_PRIMARY 統一部分文字 */}
                <h2 className={`text-3xl font-bold ${UI_THEME.TEXT_PRIMARY} flex items-center gap-3`}>
                  <Layout className="text-indigo-600 dark:text-indigo-400" /> 應用程式
                </h2>
                
                <div className="flex items-center gap-4">
                    {/* 主題切換按鈕：套用 BTN_SECONDARY */}
                    <button 
                        onClick={cycleTheme}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${UI_THEME.BTN_SECONDARY}`}
                        title={`目前：${getThemeLabel()}`}
                    >
                        {getThemeIcon()}
                        <span>{getThemeLabel()}</span>
                    </button>

                    {/* 位置切換：使用 SURFACE_CARD 做底 */}
                    <div className={`flex items-center gap-2 ${UI_THEME.SURFACE_CARD} border ${UI_THEME.BORDER_LIGHT} p-1 rounded-lg`}>
                        <button 
                            onClick={() => setLauncherPosition('left')}
                            className={`p-2 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${launcherPosition === 'left' ? 'bg-slate-200 dark:bg-slate-700 shadow-sm ' + UI_THEME.TEXT_PRIMARY : UI_THEME.BTN_GHOST}`}
                        >
                            <ArrowLeftToLine size={16}/> <span className="hidden sm:inline">左下</span>
                        </button>
                        <button 
                            onClick={() => setLauncherPosition('right')}
                            className={`p-2 rounded-md transition-all flex items-center gap-2 text-xs font-bold ${launcherPosition === 'right' ? 'bg-slate-200 dark:bg-slate-700 shadow-sm ' + UI_THEME.TEXT_PRIMARY : UI_THEME.BTN_GHOST}`}
                        >
                            <span className="hidden sm:inline">右下</span> <ArrowRightToLine size={16}/>
                        </button>
                    </div>
                </div>
             </div>

             {/* Apps Grid */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               {APPS.map(app => (
                 <button 
                   key={app.id} 
                   onClick={() => { onSelect(app.id); onClose(); }}
                   className="group flex flex-col items-center gap-4 transition-all hover:scale-105 active:scale-95"
                 >
                   {/* Icon 容器保持鮮豔色彩，不需要改為 Theme 變數 */}
                   <div className={`w-32 h-32 rounded-[2rem] shadow-lg flex items-center justify-center text-white text-5xl transition-shadow group-hover:shadow-2xl ${app.color}`}>
                     <app.icon size={64} />
                   </div>
                   {/* App 名稱跟隨主題文字 */}
                   <span className={`text-lg font-bold ${UI_THEME.TEXT_SECONDARY} group-hover:${UI_THEME.TEXT_LIGHT} transition-colors`}>{app.name}</span>
                 </button>
               ))}
             </div>
         </div>

         {/* Footer */}
         <div className={`mt-12 pt-8 border-t ${UI_THEME.BORDER_DEFAULT} text-center ${UI_THEME.TEXT_MUTED}`}>
             <div className={`font-bold text-lg ${UI_THEME.TEXT_PRIMARY} mb-2`}>Developed by 阿保老師</div>
             <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
                <a href="mailto:apaul@g.lnps.tp.edu.tw" className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Mail size={16} /> apaul@g.lnps.tp.edu.tw
                </a>
                <span className="hidden md:inline opacity-30">|</span>
                <a href="https://sites.google.com/g.lnps.tp.edu.tw/apaul-classroom/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Link size={16} /> 阿保老師的教室
                </a>
             </div>
         </div>
         
      </div>
    </div>
  );
};

const App = () => {
  const { theme, cycleTheme } = useTheme();

  const [currentAppId, setCurrentAppId] = useState('dashboard');
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [launcherPosition, setLauncherPosition] = useState('left');

  const CurrentComponent = APPS.find(a => a.id === currentAppId)?.component || ClassroomDashboardV2;
  const buttonPositionClass = launcherPosition === 'left' ? 'left-4' : 'right-4';

  return (
    // 4. 使用 UI_THEME.BACKGROUND 確保全域背景一致
    <div className={`relative w-full h-screen ${UI_THEME.BACKGROUND} overflow-hidden transition-colors duration-500`}>
      
      {/* 隱藏式按鈕：使用 semi-transparent dark/light 自動適應 */}
      <button 
        onClick={() => setIsLauncherOpen(true)}
        className={`fixed bottom-4 ${buttonPositionClass} z-[90] p-3 bg-black/5 dark:bg-white/10 hover:bg-black/80 dark:hover:bg-white/20 hover:text-white text-transparent rounded-full transition-all duration-300 group backdrop-blur-sm shadow-sm hover:shadow-xl`}
        title="切換應用程式"
      >
        <Grid size={24} className="text-slate-400 dark:text-slate-500 group-hover:text-white" />
      </button>

      <div className="w-full h-full">
         <CurrentComponent theme={theme} cycleTheme={cycleTheme} />
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