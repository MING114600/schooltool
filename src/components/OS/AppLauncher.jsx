import React, { useState, useEffect, useRef } from 'react';
import {
  Layout, Database, Type, LogIn,
  ArrowLeftToLine, ArrowRightToLine,
  Sun, Moon, Laptop, Users, PanelBottom
} from 'lucide-react';

// Contexts
import { useThemeContext } from '../../context/ThemeContext'; // 注意路徑回退
import { useOS } from '../../context/OSContext';
import { useModalContext } from '../../context/ModalContext';

// Config
import { APPS_CONFIG } from '../../config/apps';
import { APP_VERSION } from '../../data/patchNotesData';

// Common Components
// Common Components
import ZhuyinSettingsModal from '../common/ZhuyinSettingsModal';
import AboutDevModal from '../common/AboutDevModal';

// --- 子元件 1: Header ---
const LauncherHeader = ({ user, login, onLogoutClick, currentAppId }) => {
  const currentAppName = APPS_CONFIG.find(app => app.id === currentAppId)?.name || '首頁';

  return (
    <div className="px-8 py-6 bg-gradient-to-b from-stone-50/80 to-transparent dark:from-zinc-900/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-stone-100/50 dark:border-zinc-800/30">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-500/90 rounded-2xl text-white shadow-sm">
          <Layout size={28} />
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
            智慧教室儀表板
          </h2>
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <span>目前執行：{currentAppName}</span>
          </div>
        </div>
      </div>

      <div className="self-end md:self-auto">
        {user ? (
          <button
            onClick={(e) => { e.stopPropagation(); onLogoutClick(); }}
            className="group flex items-center gap-3 pl-1 pr-4 py-1.5 bg-white/60 dark:bg-zinc-800/60 rounded-full border border-stone-200/50 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.98] outline-none"
          >
            <img src={user.profileObj?.picture} alt="" className="w-10 h-10 rounded-full border border-stone-100 dark:border-zinc-700 pointer-events-none" />
            <div className="flex flex-col items-start text-left pointer-events-none">
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 leading-none group-hover:text-rose-500 transition-colors pointer-events-none">
                {user.profileObj?.name}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono mt-0.5 group-hover:hidden pointer-events-none">
                {user.profileObj?.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-rose-500/80 font-bold mt-0.5 hidden group-hover:block animate-in fade-in pointer-events-none">
                點擊登出
              </span>
            </div>
          </button>
        ) : (
          <button
            onClick={() => login()}
            className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-700 dark:hover:bg-white text-white dark:text-zinc-900 rounded-full font-bold shadow-sm transition-all duration-300 active:scale-[0.98] outline-none"
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
      <h3 className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-widest pl-1">
        應用程式
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {APPS_CONFIG.map(app => (
          <button
            key={app.id}
            onClick={() => onSelectApp(app.id)}
            className="
              group relative flex flex-col items-start gap-3 p-5 rounded-3xl 
              bg-stone-50/80 dark:bg-zinc-800/40 
              border border-stone-100 dark:border-zinc-800/50 hover:border-indigo-100 dark:hover:border-zinc-700 
              hover:bg-white dark:hover:bg-zinc-800 
              hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] 
              active:scale-[0.98]
              transition-all duration-300 ease-out
              outline-none
            "
          >
            <div className="flex items-center justify-between w-full">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-300 ${app.color}`}>
                <app.icon size={24} />
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300 dark:text-zinc-500 group-hover:translate-x-1 duration-300">
                <ArrowRightToLine size={16} />
              </div>
            </div>

            <div className="flex flex-col items-start mt-2">
              <span className="text-base font-bold text-zinc-700 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {app.name}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1 text-left">
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
  const actionBtnClass = "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 font-bold text-sm hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 outline-none";

  return (
    <div className="p-4 px-8 bg-stone-50/50 dark:bg-zinc-900/40 border-t border-stone-100/50 dark:border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
      {/* 快速設定 */}
      <div className="flex items-center gap-1 p-1 bg-white/80 dark:bg-zinc-800/50 rounded-2xl border border-stone-100 dark:border-zinc-700/50 shadow-sm">
        <button onClick={actions.openBackup} className={`${actionBtnClass} hover:text-emerald-600`} title="資料庫">
          <Database size={18} className="text-emerald-500/80" />
          <span className="hidden md:inline">備份</span>
        </button>
        <div className="w-px h-5 bg-stone-200 dark:bg-zinc-700 mx-1"></div>
        <button onClick={actions.openZhuyin} className={`${actionBtnClass} ${settings.isGlobalZhuyin ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600' : 'hover:text-indigo-600'}`} title="注音設定">
          <Type size={18} className={settings.isGlobalZhuyin ? 'text-indigo-500' : ''} />
          <span className="hidden md:inline">注音</span>
        </button>
        <div className="w-px h-5 bg-stone-200 dark:bg-zinc-700 mx-1"></div>
        <button onClick={actions.cycleTheme} className={`${actionBtnClass} hover:text-amber-500`} title="切換主題">
          <span className="text-zinc-400 group-hover:text-amber-500 transition-colors">{getThemeIcon()}</span>
          <span className="hidden md:inline">主題</span>
        </button>
      </div>

      {/* 位置切換 */}
      <div className="flex bg-stone-100/80 dark:bg-zinc-800/80 rounded-xl p-1 gap-1" role="group" aria-label="啟動按鈕位置">
        <div className="px-2 flex items-center justify-center text-zinc-400">
          <PanelBottom size={14} />
        </div>
        <button
          onClick={() => actions.setLauncherPosition('left')}
          className={`p-1.5 rounded-lg transition-all duration-300 outline-none ${settings.launcherPosition === 'left' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
          title="將啟動鈕移至左側"
        >
          <ArrowLeftToLine size={16} />
        </button>
        <button
          onClick={() => actions.setLauncherPosition('right')}
          className={`p-1.5 rounded-lg transition-all duration-300 outline-none ${settings.launcherPosition === 'right' ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
          title="將啟動鈕移至右側"
        >
          <ArrowRightToLine size={16} />
        </button>
      </div>

      {/* 版本與名片 */}
      <div className="flex items-center gap-4 text-xs text-zinc-400">
        <button
          onClick={onOpenPatchNotes}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-full border border-stone-200/50 dark:border-zinc-700/50 shadow-sm transition-all duration-300 outline-none"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>
          <span className="font-mono font-bold">v{version}</span>
        </button>

        <button
          onClick={onOpenAbout}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-indigo-500 transition-colors duration-300 font-medium outline-none rounded-md px-1 py-1"
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
  const { openModal, openDialog } = useModalContext();

  const [isZhuyinSettingsOpen, setIsZhuyinSettingsOpen] = useState(false);
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
      className="fixed inset-0 z-[100] bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <ZhuyinSettingsModal isOpen={isZhuyinSettingsOpen} onClose={() => setIsZhuyinSettingsOpen(false)} />

      <AboutDevModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      <div
        ref={containerRef}
        className={`
            relative w-full max-w-4xl max-h-[90vh] flex flex-col
            bg-white/90 dark:bg-zinc-900/80 backdrop-blur-2xl 
            rounded-[2.5rem] shadow-2xl ring-1 ring-white/40 dark:ring-white/5 
            overflow-hidden 
            transition-all animate-in zoom-in-[0.98] duration-300 outline-none
        `}
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
      >
        <LauncherHeader
          user={user}
          login={login}
          onLogoutClick={() => {
            openDialog({
              title: '登出確認',
              message: '確定要登出 Google 帳號嗎？',
              type: 'confirm', variant: 'warning', confirmText: '確定登出', cancelText: '取消',
              onConfirm: () => { logout(); }
            });
          }}
          currentAppId={currentAppId}
        />

        <AppGrid
          onSelectApp={(id) => { setCurrentAppId(id); onClose(); }}
        />

        <LauncherFooter
          actions={{
            openBackup: () => openModal('global_backup'),
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