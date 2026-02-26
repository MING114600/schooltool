// src/config/apps.js
import { lazy } from 'react';
import { Monitor, ClipboardCheck, Users, Headphones } from 'lucide-react';

// Lazy Load 組件
// 請根據您的實際檔案結構確認路徑，這裡假設是在 src/ 下
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard.jsx'));
const ExamTool = lazy(() => import('../pages/ExamTool/ExamTool.jsx'));
const Manager = lazy(() => import('../pages/Manager/Manager.jsx'));
const ExamReader = lazy(() => import('../pages/ExamReader/ExamReader.jsx')); 

export const APPS_CONFIG = [
  { 
    id: 'dashboard', 
    name: '電子看板', 
    description: '課間提醒、公告與功課表',
    icon: Monitor, 
    color: 'bg-blue-500', 
    component: Dashboard 
  },
  { 
    id: 'exam', 
    name: '監考系統', 
    description: '計時、點名、隨堂測驗',
    icon: ClipboardCheck, 
    color: 'bg-rose-500', 
    component: ExamTool 
  },
  { 
    id: 'manager', 
    name: '班級經營', 
    description: '座位表管理、加扣分工具',
    icon: Users, 
    color: 'bg-amber-500', 
    component: Manager 
  },
  { 
    id: 'reader', 
    name: '報讀助理', 
    description: '匯入考卷、語音指讀',
    icon: Headphones, 
    color: 'bg-emerald-500', 
    component: ExamReader 
  },
];