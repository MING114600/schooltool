import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'
// 🌟 1. 引入剛剛建立的 AuthProvider
import { AuthProvider } from './context/AuthContext.jsx' 
import { initDragPolyfill } from './utils/dragPolyfill';
import "mobile-drag-drop/default.css";
// 🌟 3. 引入 PWA 自動更新驅動機制
import { registerSW } from 'virtual:pwa-register';

initDragPolyfill(); // ★ 執行初始化
const GOOGLE_CLIENT_ID = "831574445055-vf0rftv6fnb4aumg6a85fielpm3at1e1.apps.googleusercontent.com";

// 🌟 4. 註冊 Service Worker 並封裝更新檢查機制
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('偵測到新版本，準備自動更新...');
    updateSW(true); // 強制更新並重新整理
  },
  onOfflineReady() {
    console.log('ClassroomOS PWA 已為離線使用準備就緒');
  },
});

// 🌟 5. 智慧檢查更新函式 (Startup / Focus / Periodic)
const checkUpdate = async () => {
  if (!navigator.onLine) return; // 沒網路就不檢查，省電
  console.log('正在檢查系統更新...');
  try {
    await updateSW(false); // 觸發背景檢查而不強制重整 (除非真的有新版且觸發 onNeedRefresh)
  } catch (err) {
    console.error('更新檢查失敗:', err);
  }
};

// 啟動即檢查 (Startup Check)
checkUpdate();

// 聚焦即偵測 (Focus Check) - 當使用者切換回分頁時觸發
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkUpdate();
  }
});

// 節流定時檢查 (Throttled Check) - 每 20 分鐘檢查一次
setInterval(() => {
  if (document.visibilityState === 'visible') {
    checkUpdate();
  }
}, 20 * 60 * 1000);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        {/* 🌟 2. 將 AuthProvider 包在這裡 */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)