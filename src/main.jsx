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

initDragPolyfill(); // ★ 執行初始化
const GOOGLE_CLIENT_ID = "831574445055-vf0rftv6fnb4aumg6a85fielpm3at1e1.apps.googleusercontent.com";

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