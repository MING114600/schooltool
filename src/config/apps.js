// src/config/apps.js
import { lazy } from 'react';
import { Monitor, ClipboardCheck, Users, Headphones, Clipboard, BookOpen, Image as ImageIcon } from 'lucide-react';

// Lazy Load 組件
// 請根據您的實際檔案結構確認路徑，這裡假設是在 src/ 下
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard.jsx'));
const ExamTool = lazy(() => import('../pages/ExamTool/ExamTool.jsx'));
const Manager = lazy(() => import('../pages/Manager/Manager.jsx'));
const ExamReader = lazy(() => import('../pages/ExamReader/ExamReader.jsx'));
const CaseLog = lazy(() => import('../pages/CaseLog/CaseLog.jsx'));
const ContactBook = lazy(() => import('../pages/ContactBook/ContactBook.jsx'));
const Photos = lazy(() => import('../pages/Photos/index.jsx'));

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
    id: 'contactbook',
    name: '聯絡簿',
    icon: BookOpen,
    path: '/contactbook',
    description: '班級作業聯絡簿發布與存檔',
    color: 'bg-indigo-500',
    component: ContactBook
  },
  {
    id: 'photos',
    name: '班級相簿',
    icon: ImageIcon,
    path: '/photos',
    description: '建立與分享班級活動照片庫',
    color: 'bg-sky-500',
    component: Photos
  },
  {
    id: 'reader',
    name: '報讀助理',
    description: '匯入考卷、語音指讀',
    icon: Headphones,
    color: 'bg-emerald-500',
    component: ExamReader
  },
  {
    id: 'caselog',
    name: '學生日誌',
    icon: Clipboard, // 或使用 lucide-react 的 Clipboard
    path: '/caselog',
    description: '可共編的學生動態日誌',
    color: 'bg-orange-500',
    component: CaseLog
  }
];