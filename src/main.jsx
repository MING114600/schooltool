import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { initDragPolyfill } from './utils/dragPolyfill';
import "mobile-drag-drop/default.css";

initDragPolyfill(); // ★ 執行初始化
const GOOGLE_CLIENT_ID = "831574445055-vf0rftv6fnb4aumg6a85fielpm3at1e1.apps.googleusercontent.com";


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
   <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
   </GoogleOAuthProvider>
  </React.StrictMode>,
)
