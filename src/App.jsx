import React, { useState, Suspense, useEffect } from 'react';
import { Grid, Loader2 } from 'lucide-react';

import { UI_THEME } from './utils/constants';
import usePersistentState from './hooks/usePersistentState'; 
import { ThemeProvider, useThemeContext } from './context/ThemeContext';
import { OSProvider, useOS } from './context/OSContext';
import { ClassroomProvider } from './context/ClassroomContext';
import { ModalProvider } from './context/ModalContext';
import { useGoogleLogin } from '@react-oauth/google';

// 🌟 Config
import { APPS_CONFIG } from './config/apps';
import { APP_VERSION } from './utils/patchNotesData';

// 🌟 Components
import AppLauncher from './components/OS/AppLauncher'; // 乾淨引入
import PatchNotesModal from './components/common/PatchNotesModal';

// Loading 也可以考慮拆分，但放這裡還行
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

// --- ClassroomOS 核心邏輯 ---
const ClassroomOS = () => {
  const { theme, cycleTheme } = useThemeContext();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const { currentAppId, setCurrentAppId, launcherPosition } = useOS(); 

  const [user, setUser] = usePersistentState('classroom_os_user', null);
  const [shareId, setShareId] = useState(null);
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
  
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const token = tokenResponse.access_token;
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userInfo = await res.json();
        setUser({ 
          accessToken: token,
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture
        });
      } catch (err) {
        setUser({ accessToken: tokenResponse.access_token });
      }
    },
    scope: 'https://www.googleapis.com/auth/drive.file profile email',
    onError: () => alert('登入失敗，請稍後再試'),
  });

  const logout = () => setUser(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('shareId');
    if (code) {
      setShareId(code);
      setCurrentAppId('reader'); 
    }
  }, [setCurrentAppId]);

  // 🌟 從 Config 取得對應的元件
  const CurrentComponent = APPS_CONFIG.find(a => a.id === currentAppId)?.component || APPS_CONFIG[0].component;
  const buttonPosClass = launcherPosition === 'left' ? 'left-4' : 'right-4';

  return (
    <div className={`relative w-full h-full ${UI_THEME.BACKGROUND} overflow-hidden transition-colors duration-500`}>
      
      {/* 啟動器按鈕 */}
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
        `}
        aria-label="開啟系統選單"
        aria-haspopup="dialog"
      >
        <Grid size={24} className="transition-transform group-hover:rotate-90" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap opacity-0 group-hover:opacity-100">
            系統選單
        </span>
      </button>

      {/* 主畫面 */}
      <div className="w-full h-full" aria-hidden={isLauncherOpen}>
         <Suspense fallback={<LoadingScreen />}>
            <CurrentComponent 
                theme={theme} 
                cycleTheme={cycleTheme} 
                user={user}
                setUser={setUser}
                login={login}
                shareId={shareId}
                setShareId={setShareId}
            />
         </Suspense>
      </div>

      {/* 🌟 乾淨的 AppLauncher */}
      <AppLauncher 
        isOpen={isLauncherOpen} 
        onClose={() => setIsLauncherOpen(false)} 
        user={user}
        login={login}
        logout={logout}
        onOpenPatchNotes={() => setShowHistoryNotes(true)}
      />

      <PatchNotesModal 
          isOpen={showLatestNotes} 
          onClose={() => {
            setShowLatestNotes(false);
            localStorage.setItem('last_seen_version', APP_VERSION);
          }} 
          mode="latest" 
        />
      <PatchNotesModal 
        isOpen={showHistoryNotes} 
        onClose={() => setShowHistoryNotes(false)} 
        mode="history" 
      />

    </div>
  );
};

const App = () => (
  <OSProvider>
    <ClassroomProvider>
      <ModalProvider>
        <ThemeProvider>
           <ClassroomOS />
        </ThemeProvider>
      </ModalProvider>
    </ClassroomProvider>
  </OSProvider>
);

export default App;