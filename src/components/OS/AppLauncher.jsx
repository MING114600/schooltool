import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, Database, Type, LogIn, 
  ArrowLeftToLine, ArrowRightToLine, 
  Sun, Moon, Laptop, Users, PanelBottom 
} from 'lucide-react';

// Contexts
import { useThemeContext } from '../../context/ThemeContext'; // 注意路徑回退
import { useOS } from '../../context/OSContext';

// Config
import { APPS_CONFIG } from '../../config/apps';
import { APP_VERSION } from '../../utils/patchNotesData';

// Common Components
import GlobalBackupModal from '../common/GlobalBackupModal';
import ZhuyinSettingsModal from '../common/ZhuyinSettingsModal';
import DialogModal from '../common/DialogModal';
import AboutDevModal from '../common/AboutDevModal';

// --- 子元件 1: Header ---
const LauncherHeader = ({ user, login, setIsLogoutModalOpen, currentAppId }) => {
  const currentAppName = APPS_CONFIG.find(app => app.id === currentAppId)?.name || '首頁';

  return (
    <div className="px-8 py-6 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
          <Layout size={28} />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            智慧教室儀表板
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>目前執行：{currentAppName}</span>
          </div>
        </div>
      </div>

      <div className="self-end md:self-auto">
        {user ? (
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="group flex items-center gap-3 pl-1 pr-4 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-rose-200 dark:hover:border-rose-900 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <img src={user.picture} alt="" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600" />
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none group-hover:text-rose-500 transition-colors">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 group-hover:hidden">
                {user.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-rose-500 font-bold mt-0.5 hidden group-hover:block animate-in slide-in-from-bottom-1">
                點擊登出
              </span>
            </div>
          </button>
        ) : (
          <button 
            onClick={() => login()} 
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
          >
            <LogIn size={18} />
            <span>Google 登入</span>
          </button>
        )}
      </div>
    </div>
  );
};

// --- 子元件 2: Grid ---
const AppGrid = ({ onSelectApp }) => {
  return (
    <div className="flex-1 px-8 py-6 overflow-y-auto custom-scrollbar">
      <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest pl-1">
        應用程式
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {APPS_CONFIG.map(app => (
          <button 
            key={app.id} 
            onClick={() => onSelectApp(app.id)}
            className="
              group relative flex flex-col items-start gap-3 p-5 rounded-3xl 
              bg-slate-50 dark:bg-slate-800/50 
              border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800 
              hover:bg-white dark:hover:bg-slate-800 
              hover:shadow-xl hover:shadow-indigo-500/10 
              active:scale-[0.98]
              transition-all duration-200 ease-out
              focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none
            "
          >
            <div className="flex items-center justify-between w-full">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300 ${app.color}`}>
                 <app.icon size={24} />
               </div>
               <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 dark:text-slate-500">
                  <ArrowRightToLine size={16} />
               </div>
            </div>
            
            <div className="flex flex-col items-start mt-1">
                <span className="text-base font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
                  {app.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 text-left">
                  {app.description}
                </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// --- 子元件 3: Footer ---
const LauncherFooter = ({ 
  actions, settings, version, onOpenPatchNotes, onOpenAbout 
}) => {
  const { getThemeIcon } = settings;
  const actionBtnClass = "flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none";

  return (
    <div className="p-4 px-8 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
      {/* 快速設定 */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <button onClick={actions.openBackup} className={`${actionBtnClass} hover:text-emerald-600`} title="資料庫">
              <Database size={18} className="text-emerald-500" />
              <span className="hidden md:inline">備份</span>
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <button onClick={actions.openZhuyin} className={`${actionBtnClass} ${settings.isGlobalZhuyin ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'hover:text-indigo-600'}`} title="注音設定">
              <Type size={18} className={settings.isGlobalZhuyin ? 'text-indigo-600' : ''} />
              <span className="hidden md:inline">注音</span>
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <button onClick={actions.cycleTheme} className={`${actionBtnClass} hover:text-amber-500`} title="切換主題">
              {getThemeIcon()}
              <span className="hidden md:inline">主題</span>
          </button>
      </div>

      {/* 位置切換 */}
      <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1 gap-1" role="group" aria-label="啟動按鈕位置">
          <div className="px-2 flex items-center justify-center text-slate-400">
             <PanelBottom size={14} />
          </div>
          <button 
              onClick={() => actions.setLauncherPosition('left')}
              className={`p-1.5 rounded-md transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${settings.launcherPosition === 'left' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="將啟動鈕移至左側"
          >
              <ArrowLeftToLine size={16} />
          </button>
          <button 
              onClick={() => actions.setLauncherPosition('right')}
              className={`p-1.5 rounded-md transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${settings.launcherPosition === 'right' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="將啟動鈕移至右側"
          >
              <ArrowRightToLine size={16} />
          </button>
      </div>

      {/* 版本與名片 */}
      <div className="flex items-center gap-3 text-xs text-slate-400">
          <button 
            onClick={onOpenPatchNotes} 
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-500 hover:text-indigo-600 rounded-full border border-slate-200 dark:border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="font-mono font-bold">v{version}</span>
          </button>
          
          <button
            onClick={onOpenAbout}
            className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors font-bold focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-md px-1 py-1"
          >
              <Users size={12} /> 
              <span>Developed by 阿保老師</span>
          </button>
      </div>
    </div>
  );
};

// --- 主元件: AppLauncher ---
const AppLauncher = ({ 
  isOpen, onClose, user, login, logout, onOpenPatchNotes 
}) => {	
  const { theme, cycleTheme } = useThemeContext();
  const { 
    currentAppId, setCurrentAppId, 
    launcherPosition, setLauncherPosition,
    isGlobalZhuyin
  } = useOS();

  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isZhuyinSettingsOpen, setIsZhuyinSettingsOpen] = useState(false); 
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape') {
        if (isAboutOpen) setIsAboutOpen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isAboutOpen]);

  const containerRef = useRef(null);
  useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getThemeIcon = () => {
    if (theme === 'system') return <Laptop size={18} />;
    if (theme === 'light') return <Sun size={18} />;
    return <Moon size={18} />;
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200 p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <GlobalBackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} user={user} login={login} />      
      <ZhuyinSettingsModal isOpen={isZhuyinSettingsOpen} onClose={() => setIsZhuyinSettingsOpen(false)} />
      <DialogModal
        isOpen={isLogoutModalOpen}
        title="登出確認"
        message="確定要登出 Google 帳號嗎？"
        type="confirm" variant="warning" confirmText="確定登出" cancelText="取消"
        onConfirm={() => { logout(); setIsLogoutModalOpen(false); }}
        onCancel={() => setIsLogoutModalOpen(false)} onClose={() => setIsLogoutModalOpen(false)}
      />
      
      <AboutDevModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <div 
        ref={containerRef}
        className={`
            relative w-full max-w-4xl max-h-[90vh] flex flex-col
            bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl 
            rounded-[2rem] shadow-2xl ring-1 ring-white/20 dark:ring-slate-700/50 
            overflow-hidden 
            transition-all animate-in zoom-in-95 duration-200 outline-none
        `}
        onClick={e => e.stopPropagation()}
        tabIndex={-1} 
      >
         <LauncherHeader 
            user={user} 
            login={login} 
            setIsLogoutModalOpen={setIsLogoutModalOpen} 
            currentAppId={currentAppId}
         />

         <AppGrid 
            onSelectApp={(id) => { setCurrentAppId(id); onClose(); }} 
         />

         <LauncherFooter 
            actions={{
                openBackup: () => setIsBackupOpen(true),
                openZhuyin: () => setIsZhuyinSettingsOpen(true),
                cycleTheme: cycleTheme,
                setLauncherPosition: setLauncherPosition
            }}
            settings={{
                getThemeIcon,
                isGlobalZhuyin,
                launcherPosition
            }}
            version={APP_VERSION}
            onOpenPatchNotes={onOpenPatchNotes}
            onOpenAbout={() => setIsAboutOpen(true)} 
         />
      </div>
    </div>
  );
};

export default AppLauncher;