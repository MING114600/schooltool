// src/pages/CaseLog/CaseLog.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext'; // 🌟 引入新的 Hook
import { useModalContext } from '../../context/ModalContext';
import { CaseLogDataLoader } from './context/CaseLogContext';
import TeacherDashboard from './views/TeacherDashboard';
import ParentView from './views/ParentView';
import { Cloud, Loader2 } from 'lucide-react';

// 🌟 移除了 props (user, login)
export default function CaseLog() {
  const isParentView = window.location.pathname.includes('/parent/view') ||
    window.location.search.includes('token=');

  if (isParentView) {
    return <ParentView />;
  }

  // --- 教師端邏輯 ---
  const { setAlertDialog } = useModalContext();

  // 🌟 直接從 AuthContext 取得登入狀態與方法
  const { user, login, isAuthLoading } = useAuth();

  // 如果系統還在讀取 localStorage 的 token，先顯示載入中避免畫面閃爍
  if (isAuthLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
  }

  // 擋下未登入狀態
  if (!user || !user.accessToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-100 dark:bg-slate-950">
        <Cloud size={64} className="text-slate-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">需要授權 Google 雲端硬碟</h2>
        <p className="text-slate-500 mb-6">學生日誌採用「單生單檔」設計，資料將安全地儲存在您的個人雲端中。</p>
        <button
          onClick={login}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all active:scale-95"
        >
          點此登入 Google 帳號
        </button>
      </div>
    );
  }

  return (
    // 🌟 這裡也不用再把 user 和 login 傳進 Provider 了，
    // 因為在 CaseLogContext.jsx 裡面，我們也可以直接呼叫 useAuth()！
    <CaseLogDataLoader setAlertDialog={setAlertDialog}>
      <TeacherDashboard />
    </CaseLogDataLoader>
  );
}