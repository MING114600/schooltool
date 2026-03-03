// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // 1. 初始化：網頁載入時檢查 localStorage 是否已有 Token 並驗證是否過期
  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem('google_access_token');
      const profile = localStorage.getItem('google_user_profile');

      if (token) {
        try {
          // 呼叫 Google TokenInfo API 驗證 Token 是否有效
          const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);

          if (!res.ok) {
            // Token 已過期或無效，清除本地紀錄，強制跳轉重新登入
            console.warn('Google 登入權杖已過期或無效，已清除本地登入狀態。');
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_user_profile');
            setUser(null);
          } else {
            // Token 有效，恢復使用者狀態
            setUser({
              accessToken: token,
              profileObj: profile ? JSON.parse(profile) : null
            });
          }
        } catch (err) {
          // 網路斷線等問題，保守假設 Token 仍然有效
          console.error('無法驗證 Token 有效性，預設放行:', err);
          setUser({
            accessToken: token,
            profileObj: profile ? JSON.parse(profile) : null
          });
        }
      }
      setIsAuthLoading(false);
    };

    checkTokenValidity();
  }, []);

  // 2. 實作 Google 登入 (請求 Drive 與 Sheets 權限)
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const token = tokenResponse.access_token;
      localStorage.setItem('google_access_token', token);

      try {
        // 取得使用者基本資料 (姓名、大頭貼)，讓日誌知道是誰紀錄的
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = await res.json();
        localStorage.setItem('google_user_profile', JSON.stringify(profile));

        // 更新狀態
        setUser({ accessToken: token, profileObj: profile });
      } catch (error) {
        console.error('無法獲取使用者資料', error);
        setUser({ accessToken: token, profileObj: null });
      }
    },
    onError: (error) => console.error('Google 登入失敗:', error),
    // 🌟 確保包含 ClassroomOS 所有的雲端權限需求
    scope: 'https://www.googleapis.com/auth/drive.file',
  });

  // 包裝 login 函式以供外部呼叫
  const login = useCallback(() => {
    googleLogin();
  }, [googleLogin]);

  // 3. 實作登出
  const logout = useCallback(() => {
    googleLogout();
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_user_profile');
    setUser(null);
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必須在 AuthProvider 內部使用');
  }
  return context;
};