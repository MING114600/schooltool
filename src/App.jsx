import React, { useState, Suspense, lazy, useEffect } from 'react';
import { 
  Monitor, Layout, Grid, ClipboardCheck, Mail, Link, Users,
  ArrowLeftToLine, ArrowRightToLine,
  Sun, Moon, Laptop, Loader2, Database,
  Type, Download, CheckCircle2, Headphones, LogIn, LogOut
} from 'lucide-react';

import { UI_THEME } from './utils/constants';
import usePersistentState from './hooks/usePersistentState'; 
import { ThemeProvider, useThemeContext } from './context/ThemeContext';
import { OSProvider, useOS } from './context/OSContext';
import { ClassroomProvider } from './context/ClassroomContext';
import { ModalProvider } from './context/ModalContext';

import { useGoogleLogin } from '@react-oauth/google';

// 引入全域備份模組
import GlobalBackupModal from './components/common/GlobalBackupModal';
import ZhuyinSettingsModal from './components/common/ZhuyinSettingsModal'; 
import DialogModal from './components/common/DialogModal';

const ClassroomDashboardV2 = lazy(() => import('./ClassroomDashboardV2.jsx'));
const ExamTool = lazy(() => import('./pages/ExamTool/ExamTool.jsx'));
const ClassroomManager = lazy(() => import('./ClassroomManager.jsx'));
const ExamReader = lazy(() => import('./pages/ExamReader/ExamReader.jsx')); 

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
  { id: 'reader', name: '報讀助理', icon: Headphones, color: 'bg-emerald-500', component: ExamReader },
];

// --- AppLauncher 維持不變 ---
const AppLauncher = ({ isOpen, onClose, onSelect, user, login, logout }) => {	
  const { theme, cycleTheme } = useThemeContext();
  const { 
    currentAppId, setCurrentAppId, 
    launcherPosition, setLauncherPosition,
    isGlobalZhuyin
  } = useOS();

  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isZhuyinSettingsOpen, setIsZhuyinSettingsOpen] = useState(false); 
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

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
      <GlobalBackupModal 
		  isOpen={isBackupOpen} 
		  onClose={() => setIsBackupOpen(false)} 
		  user={user} 
		  login={login} 
		/>      
      <ZhuyinSettingsModal isOpen={isZhuyinSettingsOpen} onClose={() => setIsZhuyinSettingsOpen(false)} />
	  <DialogModal
        isOpen={isLogoutModalOpen}
        title="登出確認"
        message="確定要登出 Google 帳號嗎？登出後將無法使用雲端同步與派送功能。"
        type="confirm"
        variant="warning"
        confirmText="確定登出"
        cancelText="取消"
        onConfirm={() => {
          logout(); // 執行實際登出
          setIsLogoutModalOpen(false); // 關閉視窗
        }}
        onCancel={() => setIsLogoutModalOpen(false)}
        onClose={() => setIsLogoutModalOpen(false)}
      />

      <div className={`${UI_THEME.SURFACE_GLASS} p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-5xl w-full mx-4 border ${UI_THEME.BORDER_LIGHT} relative flex flex-col min-h-[600px] transition-all`} onClick={e => e.stopPropagation()}>
         <div className="flex-1">
             {/* Header 區域 */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <h2 className={`text-2xl md:text-3xl font-bold ${UI_THEME.TEXT_PRIMARY} flex items-center gap-3`}>
                      <Layout className="text-indigo-600 dark:text-indigo-400" /> 智慧教室儀表板
                    </h2>
                    
                    <button 
                        onClick={() => setIsBackupOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 text-sm"
                    >
                        <Database size={16} />
                        <span>資料中樞</span>
                    </button>
                    
                    <button 
                        onClick={() => setIsZhuyinSettingsOpen(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold shadow-lg transition-all hover:scale-105 active:scale-95 text-sm ${
                            isGlobalZhuyin 
                            ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/30' 
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                        title="注音顯示與字型設定"
                    >
                        <Type size={16} />
                        <span className="hidden sm:inline">注音設定</span>
                        {isGlobalZhuyin && <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse ml-0.5" />}
                    </button>
					{/* 登入 / 登出按鈕區塊 */}
                    {user ? (
                      // ✅ 登入後的 UI：顯示大頭貼與姓名
                      <div className="flex items-center gap-1 pl-1 pr-1.5 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800 shadow-sm transition-all" title={user.email}>
                        
                        {/* 大頭貼 */}
                        {user.picture ? (
                          <img src={user.picture} alt="User" className="w-7 h-7 rounded-full shadow-sm" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-200 shadow-sm">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'T'}
                          </div>
                        )}
                        
                        {/* 姓名 (限制最大寬度，過長自動變成 ...) */}
                        <span className="hidden sm:inline text-sm font-bold text-blue-700 dark:text-blue-300 max-w-[100px] truncate px-1.5">
                          {user.name || '已登入'}
                        </span>
                        
                        {/* 獨立的登出按鈕 */}
                        <button 
                          onClick={() => setIsLogoutModalOpen(true)} 
                          className="p-1.5 text-blue-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all"
                          title="登出 Google 帳號"
                        >
                          <LogOut size={16} />
                        </button>
                      </div>
                    ) : (
                      // 未登入的 UI (維持原樣)
                      <button onClick={() => login()} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm border border-slate-200 dark:border-slate-700">
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
                        <span className="hidden sm:inline">登入</span>
                        <LogIn size={14} className="ml-1 text-slate-400" />
                      </button>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={cycleTheme}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs md:text-sm ${UI_THEME.BTN_SECONDARY}`}
                    >
                        {getThemeIcon()}
                        <span className="hidden sm:inline">{getThemeLabel()}</span>
                    </button>

                    <div className={`flex items-center gap-1 ${UI_THEME.SURFACE_CARD} border ${UI_THEME.BORDER_LIGHT} p-1 rounded-lg`}>
                        <button onClick={() => setLauncherPosition('left')} className={`p-1.5 rounded-md transition-all ${launcherPosition === 'left' ? 'bg-slate-200 dark:bg-slate-700 shadow-sm ' + UI_THEME.TEXT_PRIMARY : UI_THEME.BTN_GHOST}`}><ArrowLeftToLine size={14}/></button>
                        <button onClick={() => setLauncherPosition('right')} className={`p-1.5 rounded-md transition-all ${launcherPosition === 'right' ? 'bg-slate-200 dark:bg-slate-700 shadow-sm ' + UI_THEME.TEXT_PRIMARY : UI_THEME.BTN_GHOST}`}><ArrowRightToLine size={14}/></button>
                    </div>
                </div>
             </div>

             {/* APP Grid 區域 */}
             <h3 className={`text-sm font-bold ${UI_THEME.TEXT_SECONDARY} mb-4 ml-1 uppercase tracking-wider`}>應用程式</h3>
             <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {APPS.map(app => (
                 <button 
                   key={app.id} 
                   onClick={() => { setCurrentAppId(app.id); onClose(); }}
                   className="group flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95 p-4 rounded-[2rem] hover:bg-white/50 dark:hover:bg-white/5"
                 >
                   <div className={`w-24 h-24 rounded-3xl shadow-lg flex items-center justify-center text-white transition-all group-hover:shadow-xl group-hover:-translate-y-1 ${app.color}`}>
                     <app.icon size={40} />
                   </div>
                   <div className="text-center">
                       <div className={`text-base font-bold ${UI_THEME.TEXT_PRIMARY} mb-0.5`}>{app.name}</div>
                   </div>
                 </button>
               ))}
               
               <div className="flex flex-col items-center gap-3 opacity-30 grayscale pointer-events-none p-4">
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

const ClassroomOS = () => {
  const { theme, cycleTheme } = useThemeContext();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const { currentAppId, setCurrentAppId, launcherPosition } = useOS();

  // 🌟 1. 新增：全域的老師登入狀態與學生派送碼狀態
  const [user, setUser] = usePersistentState('classroom_os_user', null);
  const [shareId, setShareId] = useState(null);
  
  // 🌟 2. 定義全域的 Google 登入 Hook
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const token = tokenResponse.access_token;
        
        // 🚀 拿到 Token 後，立刻去跟 Google 要大頭貼和姓名
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userInfo = await res.json();

        console.log("登入成功，使用者資訊:", userInfo);
        
        // 將完整的資訊存入 user state
        setUser({ 
          accessToken: token,
          name: userInfo.name,     // 例如: "Liao Yu-Chuan" 或 "阿保老師"
          email: userInfo.email,   // 完整信箱
          picture: userInfo.picture // 大頭貼網址
        });
      } catch (err) {
        console.error("取得使用者資訊失敗", err);
        // 如果抓取失敗，至少保留 token 以維持系統運作
        setUser({ accessToken: tokenResponse.access_token });
      }
    },
    // ✅ 新增 profile 與 email 權限，以利抓取使用者資訊
    scope: 'https://www.googleapis.com/auth/drive.file profile email',
    onError: () => alert('登入失敗，請稍後再試'),
  });

  const logout = () => setUser(null);

  // 🌟 2. 新增：攔截網址參數 (學生掃碼模式)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('shareId');
    
    if (code) {
      console.log("📥 偵測到學生派送模式，代碼：", code);
      setShareId(code);
      // 🚀 神奇魔法：如果偵測到派送碼，自動切換到「報讀助理」APP，學生不用手動選！
      setCurrentAppId('reader'); 
    }
  }, [setCurrentAppId]);

  const CurrentComponent = APPS.find(a => a.id === currentAppId)?.component || ClassroomDashboardV2;
  const buttonPositionClass = launcherPosition === 'left' ? 'left-4' : 'right-4';

  return (
    <div className={`relative w-full h-screen ${UI_THEME.BACKGROUND} overflow-hidden transition-colors duration-500`}>
      
      <button 
        onClick={() => setIsLauncherOpen(true)}
        className={`fixed bottom-4 ${buttonPositionClass} z-[90] p-3 bg-black/5 dark:bg-white/10 hover:bg-black/80 dark:hover:bg-white/20 hover:text-white text-transparent rounded-full transition-all duration-300 group backdrop-blur-sm shadow-sm hover:shadow-xl`}
      >
        <Grid size={24} className="text-slate-400 dark:text-slate-500 group-hover:text-white" />
      </button>

      <div className="w-full h-full">
         <Suspense fallback={<LoadingScreen />}>
            <CurrentComponent 
                theme={theme} 
                cycleTheme={cycleTheme} 
                // 🌟 3. 將狀態往下傳遞給所有 APP (目前主要是 ExamReader 會用到)
                user={user}
                setUser={setUser}
				login={login}
                shareId={shareId}
                setShareId={setShareId}
            />
         </Suspense>
      </div>

      <AppLauncher 
        isOpen={isLauncherOpen} 
        onClose={() => setIsLauncherOpen(false)} 
		user={user}       // 🌟 傳給 Launcher 顯示狀態
        login={login}     // 🌟 傳給 Launcher 綁定按鈕
        logout={logout}
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