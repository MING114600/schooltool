import React, { useState, Suspense, useEffect } from 'react';
import { Grid, Loader2 } from 'lucide-react';

import { UI_THEME } from './constants';
import { ThemeProvider, useThemeContext } from './context/ThemeContext';
import { OSProvider, useOS } from './context/OSContext';
import { useClassroomStore } from './store/useClassroomStore';
import { ModalProvider } from './context/ModalContext';
// 🌟 1. 引入剛剛做好的 AuthContext
import { useAuth } from './context/AuthContext';

// 🌟 Config
import { APPS_CONFIG } from './config/apps';
import { APP_VERSION } from './data/patchNotesData';

// 🌟 Components
import AppLauncher from './components/OS/AppLauncher';
import PatchNotesModal from './components/common/PatchNotesModal';
import ModalRoot from './components/common/ModalRoot';

const LoadingScreen = () => (
  <div className={`w-full h-full flex flex-col items-center justify-center ${UI_THEME.BACKGROUND}`}>
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <div className="p-4 rounded-2xl bg-white/10 shadow-xl backdrop-blur-md border border-white/20">
        <Loader2 size={48} className="text-blue-500 animate-spin" />
      </div>
      <div className={`font-bold text-lg ${UI_THEME.TEXT_SECONDARY}`}>
        系統載入中...
      </div>
    </div>
  </div>
);

const DataLoader = ({ children }) => {
  const isLoading = useClassroomStore(state => state.isLoading);
  const initStore = useClassroomStore(state => state.initStore);

  useEffect(() => {
    initStore();
  }, [initStore]);

  if (isLoading) return <LoadingScreen />;

  return children;
};

// --- ClassroomOS 核心邏輯 ---
const ClassroomOS = () => {
  const { theme, cycleTheme } = useThemeContext();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const { currentAppId, setCurrentAppId, launcherPosition } = useOS();

  // 🌟 2. 一行程式碼，取代原本幾十行的登入狀態與邏輯！
  const { user, login, logout } = useAuth();

  // 🌟 初始化 shareId (URL 優先)
  const [shareId, setShareId] = useState(() => new URLSearchParams(window.location.search).get('shareId'));
  const [showLatestNotes, setShowLatestNotes] = useState(false);
  const [showHistoryNotes, setShowHistoryNotes] = useState(false);

  useEffect(() => {
    const checkVersion = () => {
      const lastSeenVersion = localStorage.getItem('last_seen_version');
      if (lastSeenVersion !== APP_VERSION) {
        setTimeout(() => setShowLatestNotes(true), 1500);
      }
    };
    checkVersion();
  }, []);

  const isGuestView = 
    window.location.pathname.includes('/parent/view') ||
    window.location.search.includes('token=') ||
    window.location.search.includes('album=') || 
    window.location.search.includes('albums=') ||
    window.location.search.includes('shareId='); // 統一：所有分享模式皆隱藏系統導覽

  // 🌟 從 Config 取得對應的元件
  const CurrentComponent = APPS_CONFIG.find(a => a.id === currentAppId)?.component || APPS_CONFIG[0].component;
  const buttonPosClass = launcherPosition === 'left' ? 'left-4' : 'right-4';

  return (
    <div className={`relative w-full h-full ${UI_THEME.BACKGROUND} overflow-hidden transition-colors duration-500`}>

      {/* 🌟 3. 只有「不是」家長模式時，才顯示啟動器按鈕 */}
      {!isGuestView && (
        <button
          onClick={() => setIsLauncherOpen(true)}
          className={`
            fixed bottom-4 ${buttonPosClass} z-[10000]
            flex items-center justify-center gap-2
            p-3 pr-4 rounded-[1.2rem]
            bg-slate-900/10 dark:bg-white/10 backdrop-blur-sm
            hover:bg-slate-900/80 dark:hover:bg-white/90
            text-slate-500 dark:text-slate-400 hover:text-white dark:hover:text-slate-900
            border border-transparent hover:border-white/20
            transition-all duration-300 ease-out
            group hover:scale-105 hover:shadow-xl
            focus-visible:ring-4 focus-visible:ring-indigo-500/50 focus-visible:outline-none 
            print:hidden
        `}
          aria-label="開啟系統選單"
          aria-haspopup="dialog"
        >
          <Grid size={24} className="transition-transform group-hover:rotate-90" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap opacity-0 group-hover:opacity-100">
            系統選單
          </span>
        </button>
      )}

      {/* 主畫面 */}
      <div className="w-full h-full" aria-hidden={isLauncherOpen}>
        <Suspense fallback={<LoadingScreen />}>
          <CurrentComponent
            theme={theme}
            cycleTheme={cycleTheme}
            user={user}
            login={login}
            shareId={shareId}
            setShareId={setShareId}
          />
        </Suspense>
      </div>

      {/* 🌟 4. 只有「不是」家長模式時，才掛載 AppLauncher */}
      {!isGuestView && (
        <AppLauncher
          isOpen={isLauncherOpen}
          onClose={() => setIsLauncherOpen(false)}
          user={user}
          login={login}
          logout={logout}
          onOpenPatchNotes={() => setShowHistoryNotes(true)}
        />
      )}
      {!isGuestView && (
        <PatchNotesModal
          isOpen={showHistoryNotes}
          onClose={() => setShowHistoryNotes(false)}
          mode="history"
        />
      )}
      {/* 🌟 新增：自動跳出的最新版本更新日誌 */}
      {!isGuestView && (
        <PatchNotesModal
          isOpen={showLatestNotes}
          mode="latest"
          onClose={() => {
            setShowLatestNotes(false);
            // 🌟 關鍵：使用者關閉後，將當前版本號寫入 localStorage，下次就不會再跳出了
            localStorage.setItem('last_seen_version', APP_VERSION);
          }}
        />
      )}

      <ModalRoot />
    </div>
  );
};

const App = () => (
  // 注意：AuthProvider 已經在 main.jsx 裡包在最外層，所以這裡不需要再寫一次
  <OSProvider>
    <DataLoader>
      <ModalProvider>
        <ThemeProvider>
          <ClassroomOS />
        </ThemeProvider>
      </ModalProvider>
    </DataLoader>
  </OSProvider>
);

export default App;