import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Settings, Clock, MapPin, Coffee, BookOpen, Volume2, Edit3, X, Save, RefreshCw, Bell, Wrench, Calendar, Sun, Sunset, ChevronDown, ChevronRight, Moon, Star, Download, Upload, Monitor, Maximize, Minimize, Plus, Trash2, AlertCircle, BedDouble, Box, Play, Pause, RotateCcw, Shuffle, Megaphone, Home } from 'lucide-react';

// --- 預設資料 ---
const DEFAULT_TIME_SLOTS = [
  { id: 'arrival', name: '上學時間', start: '07:20', end: '07:50', type: 'break' },
  { id: 'morning', name: '晨光時間', start: '07:50', end: '08:25', type: 'class' },
  { id: 'break1', name: '下課', start: '08:25', end: '08:30', type: 'break' },
  { id: 'p1', name: '第一節', start: '08:30', end: '09:10', type: 'class' },
  { id: 'break2', name: '下課', start: '09:10', end: '09:20', type: 'break' },
  { id: 'p2', name: '第二節', start: '09:20', end: '10:00', type: 'class' },
  { id: 'break3', name: '大下課', start: '10:00', end: '10:20', type: 'break' }, 
  { id: 'p3', name: '第三節', start: '10:20', end: '11:00', type: 'class' },
  { id: 'break4', name: '下課', start: '11:00', end: '11:10', type: 'break' },
  { id: 'p4', name: '第四節', start: '11:10', end: '11:50', type: 'class' },
  { id: 'lunch_prep', name: '準備午餐', start: '11:50', end: '12:00', type: 'break' }, 
  { id: 'lunch', name: '午餐時間', start: '12:00', end: '12:40', type: 'break' },
  { id: 'nap', name: '午休時間', start: '12:40', end: '13:15', type: 'break' }, 
  { id: 'break_noon', name: '準備上課', start: '13:15', end: '13:20', type: 'break' }, 
  { id: 'p5', name: '第五節', start: '13:20', end: '14:00', type: 'class' },
  { id: 'break6', name: '下課', start: '14:00', end: '14:10', type: 'break' },
  { id: 'p6', name: '第六節', start: '14:10', end: '14:50', type: 'class' },
  { id: 'cleaning', name: '打掃時間', start: '14:50', end: '15:10', type: 'break' },
  { id: 'p7', name: '第七節', start: '15:10', end: '15:50', type: 'class' },
  { id: 'after', name: '放學', start: '15:50', end: '16:10', type: 'break' },
];

const DEFAULT_SCHEDULE = {
  1: { p1: '國語', p2: '數學', p3: '生活(視覺)', p4: '生活(視覺)', p5: '綜合', p6: '綜合', p7: '' },
  2: { p1: '數學', p2: '國語', p3: '體育', p4: '英語', p5: '國語', p6: '有品麗山幸福悅讀', p7: '' },
  3: { p1: '國語', p2: '數學', p3: '本土語', p4: '生活(音樂)', p5: '', p6: '', p7: '' },
  4: { p1: 'Reading Fun', p2: '國語', p3: '數學', p4: '生活', p5: '視覺藝術', p6: '視覺藝術', p7: '' },
  5: { p1: '數學', p2: '國語', p3: '理財悠遊趣', p4: '健康', p5: 'STEAM手創館', p6: 'STEAM手創館', p7: '' },
};

const DEFAULT_DAY_TYPES = {
  1: 'full', 2: 'full', 3: 'half', 4: 'full', 5: 'full', 6: 'full', 0: 'full'
};

const DEFAULT_SUBJECT_HINTS = {
  '晨光時間': '抄寫聯絡簿以及準備交作業',
  '全天打掃': '請拿起掃具，認真打掃環境，保持整潔', 
  '打掃時間': '請拿起掃具，認真打掃環境，保持整潔', 
  '準備午餐': '請洗手，拿出餐具，準備用餐',
  '午餐時間': '請細嚼慢嚥，保持桌面整潔，安靜用餐',
  '午休時間': '請趴下休息，保持安靜，不隨意走動',
  '準備上課': '午休結束，請起床洗臉，準備上課',
  '晨間閱讀': '請安靜閱讀，享受書本的樂趣',
  '國語': '準備國語課本、習作、鉛筆盒',
  '數學': '準備數學課本、附件、圓規、直尺',
  '自然': '準備自然課本、習作、觀察紀錄本',
  '社會': '準備社會課本、習作',
  '英語': '準備英語課本、習作、點讀筆',
  '本土語': '準備本土語課本、相關教材',
  '生活': '準備生活課本、習作',
  '生活(視覺)': '攜帶彩色筆、水彩、圍裙，保持整潔', 
  '生活(音樂)': '攜帶直笛/樂器、課本，至音樂教室', 
  '視覺藝術': '攜帶水彩、畫筆、調色盤，至美勞教室', 
  '音樂': '攜帶直笛/樂器、課本，至音樂教室', 
  '視覺/音樂': '攜帶相關藝文用具(畫具或樂器)',
  '體育': '穿著運動服，攜帶水壺、毛巾，至操場集合',
  '健康': '準備健康課本、習作',
  '游泳': '攜帶泳衣、泳帽、蛙鏡、浴巾，至游泳池集合',
  '綜合': '準備綜合活動課本或小組討論資料',
  'STEAM手創館': '請至電腦教室集合，攜帶筆記本',
  'Reading Fun': '準備英語讀本，保持愉快心情',
  '有品麗山幸福悅讀': '準備喜歡的書，靜心閱讀',
  '理財悠遊趣': '準備理財學習單或相關教具',
  '閱讀': '攜帶借閱證，安靜排隊至圖書館',
  'default': '準備下節課本，喝水上廁所',
  '放學': '請收拾好書包，拿好餐袋及個人物品到走廊排隊'
};

const DEFAULT_SPECIAL_BUTTONS = [
  { id: 1, label: '圖書館', message: '全班在圖書館', sub: '預計下課前回教室', color: 'from-blue-500 to-cyan-400' },
  { id: 2, label: '操場', message: '全班在操場', sub: '體育課/戶外活動', color: 'from-green-500 to-emerald-400' },
  { id: 3, label: '活動中心', message: '至活動中心集合', sub: '週會/宣導活動', color: 'from-purple-500 to-violet-400' },
  { id: 4, label: '電腦教室', message: '全班在電腦教室', sub: '資訊課程', color: 'from-indigo-500 to-blue-500' },
  { id: 5, label: '晨間閱讀', message: '晨間閱讀', sub: '請安靜閱讀', color: 'from-amber-900 to-orange-950', type: 'dark', icon: 'book' },
  { id: 6, label: '午休', message: '午休時間', sub: '請趴下休息', color: 'from-indigo-950 to-slate-900', type: 'dark', icon: 'moon' },
  { id: 99, label: '自訂廣播', message: '', sub: '', color: 'from-pink-500 to-rose-500', type: 'input', icon: 'megaphone' },
];

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const getSecondsFromTime = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 3600 + m * 60;
};

// --- 共用元件 ---

const SettingsSection = ({ title, icon: Icon, isOpen, onToggle, children, colorClass = "text-slate-600" }) => (
  <div className="border rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300">
    <button 
      onClick={onToggle}
      className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-left"
    >
      <div className="flex items-center gap-3 text-lg font-bold text-slate-800">
        <Icon className={colorClass} size={24} />
        {title}
      </div>
      <div className="text-slate-400">
        {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </div>
    </button>
    {isOpen && (
      <div className="p-6 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
        {children}
      </div>
    )}
  </div>
);

// 安靜/深色模式視圖
const QuietModeView = ({ title, subtext, icon: IconComponent, centerContent, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse pointer-events-none"></div>
      <Star className="absolute top-10 right-20 text-yellow-100 opacity-40 w-4 h-4 animate-ping pointer-events-none" />
      <Star className="absolute bottom-10 left-20 text-yellow-100 opacity-30 w-6 h-6 animate-pulse pointer-events-none" />
      <Star className="absolute top-1/3 left-10 text-blue-200 opacity-20 w-3 h-3 animate-pulse delay-700 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center p-8 w-full h-full">
         <div className="mb-12 flex flex-col items-center">
            {IconComponent && <IconComponent size={80} className="text-indigo-200 mb-6 drop-shadow-[0_0_15px_rgba(199,210,254,0.5)]" />}
            <h2 className="text-6xl font-bold text-indigo-100 tracking-wider mb-4">{title}</h2>
            <p className="text-2xl text-indigo-300 font-light">{subtext}</p>
         </div>
         {centerContent}
         {onClose && (
           <button onClick={onClose} className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 group" title="回到主畫面 (Esc)">
             <X size={32} className="group-hover:scale-110 transition-transform"/>
           </button>
         )}
      </div>
    </div>
  );
};

// --- 工具箱 Modal ---
const ToolsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('timer'); // timer | random
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(''); // 自訂時間狀態
  
  // Random Picker State
  const [studentCount, setStudentCount] = useState(30);
  const [pickedNumber, setPickedNumber] = useState(null);
  const [isRolling, setIsRolling] = useState(false);

  // Timer Logic
  useEffect(() => {
    let interval;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startTimer = (mins) => {
    setTimeLeft(Math.floor(mins * 60));
    setIsTimerRunning(true);
  };

  // Random Picker Logic
  const handlePick = () => {
    if (isRolling) return;
    setIsRolling(true);
    setPickedNumber(null);
    let count = 0;
    const maxCount = 20;
    const interval = setInterval(() => {
      setPickedNumber(Math.floor(Math.random() * studentCount) + 1);
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2"><Box size={24}/> 教室百寶箱</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full"><X size={20}/></button>
        </div>
        
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('timer')}
            className={`flex-1 py-4 font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'timer' ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Clock size={20}/> 倒數計時
          </button>
          <button 
            onClick={() => setActiveTab('random')}
            className={`flex-1 py-4 font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'random' ? 'text-purple-600 bg-purple-50 border-b-2 border-purple-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Shuffle size={20}/> 幸運抽籤
          </button>
        </div>

        <div className="p-8 min-h-[300px] flex flex-col items-center justify-center">
          {activeTab === 'timer' && (
            <div className="w-full flex flex-col items-center">
               <div className={`text-8xl font-mono font-bold mb-8 ${timeLeft < 10 && timeLeft > 0 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                 {formatTime(timeLeft)}
               </div>
               
               <div className="flex gap-4 mb-4 w-full justify-center">
                 <button onClick={() => startTimer(1)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold">1分鐘</button>
                 <button onClick={() => startTimer(3)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold">3分鐘</button>
                 <button onClick={() => startTimer(5)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold">5分鐘</button>
                 <button onClick={() => startTimer(10)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold">10分鐘</button>
               </div>

                {/* 自訂時間 */}
               <div className="flex gap-2 mb-8 items-center bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-slate-500 font-bold text-sm pl-2">自訂：</span>
                  <input 
                    type="number" 
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="分鐘"
                    className="w-24 p-2 border rounded-lg text-center font-bold text-slate-700 focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && customMinutes) {
                            startTimer(Number(customMinutes));
                            setCustomMinutes('');
                        }
                    }}
                  />
                  <button 
                    onClick={() => {
                        if(customMinutes) {
                            startTimer(Number(customMinutes));
                            setCustomMinutes('');
                        }
                    }}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-bold transition-colors text-sm"
                  >
                    設定
                  </button>
               </div>

               <div className="flex gap-4">
                 <button 
                   onClick={() => setIsTimerRunning(!isTimerRunning)}
                   className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${isTimerRunning ? 'bg-amber-500' : 'bg-green-500'}`}
                 >
                   {isTimerRunning ? <Pause size={32}/> : <Play size={32}/>}
                 </button>
                 <button 
                   onClick={() => { setIsTimerRunning(false); setTimeLeft(0); }}
                   className="w-16 h-16 rounded-full flex items-center justify-center text-slate-500 bg-slate-200 shadow-lg transition-transform hover:scale-105 active:scale-95 hover:bg-slate-300"
                 >
                   <RotateCcw size={32}/>
                 </button>
               </div>
            </div>
          )}

          {activeTab === 'random' && (
            <div className="w-full flex flex-col items-center">
               <div className="mb-4 flex items-center gap-2">
                 <span className="text-slate-500 font-bold">班級人數：</span>
                 <input 
                   type="number" 
                   value={studentCount} 
                   onChange={(e) => setStudentCount(Number(e.target.value))}
                   className="w-20 p-2 border rounded-lg text-center font-bold text-slate-700 focus:ring-2 focus:ring-purple-400 outline-none"
                 />
               </div>

               <div className="w-48 h-48 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center border-4 border-white shadow-inner mb-8">
                  <span className={`text-8xl font-bold text-purple-600 ${isRolling ? 'blur-sm' : ''}`}>
                    {pickedNumber !== null ? pickedNumber : '?'}
                  </span>
               </div>

               <button 
                 onClick={handlePick}
                 disabled={isRolling}
                 className="px-8 py-4 bg-purple-600 text-white text-xl font-bold rounded-2xl shadow-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
               >
                 <Shuffle/> {isRolling ? '抽選中...' : '開始抽籤'}
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 廣播輸入 Modal (記憶功能) ---
const BroadcastInputModal = ({ isOpen, onClose, onConfirm }) => {
  const [title, setTitle] = useState(() => localStorage.getItem('lastBroadcastTitle') || '');
  const [sub, setSub] = useState(() => localStorage.getItem('lastBroadcastSub') || '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
          <Megaphone className="text-pink-500" />
          發布自訂廣播
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">主標題</label>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none text-lg font-bold"
              placeholder="例如：全班集合"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">副標題 (選填)</label>
            <input 
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:outline-none"
              placeholder="例如：請帶水壺至走廊"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button 
            onClick={onClose} 
            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
          >
            取消
          </button>
          <button 
            onClick={() => {
              if (title) {
                onConfirm(title, sub);
                localStorage.setItem('lastBroadcastTitle', title);
                localStorage.setItem('lastBroadcastSub', sub);
                onClose();
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            發布廣播
          </button>
        </div>
      </div>
    </div>
  );
};

// ... SettingsModal ... (需修改 Reset 邏輯, 使用 React.memo 包裹以避免不必要的重新渲染)
const SettingsModal = React.memo(({ 
  isOpen, onClose, 
  timeSlots, setTimeSlots, 
  schedule, setSchedule, 
  subjectHints, setSubjectHints,
  dayTypes, setDayTypes, 
  timeOffset, setTimeOffset,
  setIsManualEco,
  setIsAutoEcoOverride, 
  setNow, 
  is24Hour, setIs24Hour,
  setSpecialButtons,
  now // 需要傳入 current now 用來取得當前日期
}) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [newSubjectName, setNewSubjectName] = useState('');
  const [tempTime, setTempTime] = useState(''); // 暫存時間狀態
  const [selectedDay, setSelectedDay] = useState(''); // 暫存星期狀態
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && now) {
      // 預設為當前星期
      setSelectedDay(now.getDay().toString());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 修改：僅更新暫存狀態，不立即觸發重渲染
  const handleTimeInputChange = (e) => {
    e.stopPropagation();
    setTempTime(e.target.value);
  };

  const handleDaySelectChange = (e) => {
    e.stopPropagation();
    setSelectedDay(e.target.value);
  }

  // 新增：按下按鈕後才正式更新系統時間
  const applyTimeChange = () => {
    const nowReal = new Date();
    let targetDate = new Date(nowReal);

    // 如果有輸入時間，則解析時間
    if (tempTime) {
      // 驗證格式 HH:mm
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(tempTime)) {
          alert("請輸入正確的時間格式 (HH:mm)，例如 14:30");
          return;
      }
      const [h, m] = tempTime.split(':').map(Number);
      targetDate.setHours(h);
      targetDate.setMinutes(m);
      targetDate.setSeconds(0);
    }

    // 如果有選擇星期，則計算日期偏移
    if (selectedDay !== '') {
      const currentDay = nowReal.getDay();
      const targetDay = parseInt(selectedDay, 10);
      const dayDiff = targetDay - currentDay;
      targetDate.setDate(nowReal.getDate() + dayDiff);
    }
    
    const offset = targetDate.getTime() - nowReal.getTime();
    setTimeOffset(offset);
    setNow(new Date(Date.now() + offset)); 
    
    setIsManualEco(false);
    setIsAutoEcoOverride(true);
    // 清空暫存，或者保留讓使用者知道當前設定
    // setTempTime(''); 
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    if (subjectHints[newSubjectName.trim()]) {
      alert('該科目已存在！');
      return;
    }
    setSubjectHints(prev => ({
      ...prev,
      [newSubjectName.trim()]: '請設定準備事項...'
    }));
    setNewSubjectName('');
  };

  const handleDeleteSubject = (subject) => {
    if (subject === 'default') {
      alert('預設科目無法刪除');
      return;
    }
    if (confirm(`確定要刪除「${subject}」嗎？這將會從您的科目列表中移除，且無法復原。`)) {
       const newHints = { ...subjectHints };
       delete newHints[subject];
       setSubjectHints(newHints);
       
       const newSchedule = { ...schedule };
       Object.keys(newSchedule).forEach(day => {
         Object.keys(newSchedule[day]).forEach(period => {
           if (newSchedule[day][period] === subject) {
             newSchedule[day][period] = '';
           }
         });
       });
       setSchedule(newSchedule);
    }
  };

  const handleRenameSubject = (oldName, newName) => {
    const trimmedNew = newName.trim();
    if (oldName === trimmedNew || !trimmedNew) return;
    
    if (subjectHints[trimmedNew]) {
      alert(`科目「${trimmedNew}」已存在，無法重新命名。`);
      return;
    }

    const newHints = { ...subjectHints };
    newHints[trimmedNew] = newHints[oldName];
    delete newHints[oldName];
    setSubjectHints(newHints);

    const newSchedule = { ...schedule };
    Object.keys(newSchedule).forEach(day => {
      Object.keys(newSchedule[day]).forEach(period => {
        if (newSchedule[day][period] === oldName) {
          newSchedule[day][period] = trimmedNew;
        }
      });
    });
    setSchedule(newSchedule);
  };

  const handleExport = () => {
    const data = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      config: {
        timeSlots,
        schedule,
        subjectHints,
        dayTypes,
        is24Hour
      }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Classroom_Config_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.config) {
          if (confirm('確定要從檔案還原設定嗎？目前的設定將被覆蓋。')) {
            if(data.config.timeSlots) setTimeSlots(data.config.timeSlots);
            if(data.config.schedule) setSchedule(data.config.schedule);
            if(data.config.subjectHints) setSubjectHints(data.config.subjectHints);
            if(data.config.dayTypes) setDayTypes(data.config.dayTypes);
            if(data.config.is24Hour !== undefined) setIs24Hour(data.config.is24Hour);
            alert('設定還原成功！');
          }
        } else {
          alert('無效的設定檔格式。');
        }
      } catch (err) {
        alert('讀取檔案失敗，請確認檔案格式正確。');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-bold flex items-center gap-3"><Settings /> 設定控制台</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full"><X /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          <SettingsSection 
            title="一般設定" 
            icon={Wrench} 
            isOpen={expandedSections['general']} 
            onToggle={() => toggleSection('general')}
          >
             <div className="flex flex-col gap-6">
               <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-700 w-24">時間格式：</span>
                  <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                     <button 
                       onClick={() => setIs24Hour(false)}
                       className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${!is24Hour ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}
                     >
                       12H (下午 1:00)
                     </button>
                     <button 
                       onClick={() => setIs24Hour(true)}
                       className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${is24Hour ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}
                     >
                       24H (13:00)
                     </button>
                  </div>
               </div>
             </div>
          </SettingsSection>

          <SettingsSection 
            title="全天/半天設定" 
            icon={Calendar} 
            isOpen={expandedSections['dayTypes']} 
            onToggle={() => toggleSection('dayTypes')}
            colorClass="text-orange-600"
          >
             <div className="bg-orange-50 p-4 rounded-xl grid grid-cols-5 gap-3 border border-orange-100">
                {[1,2,3,4,5].map(day => (
                  <div key={day} className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-500 mb-2">週{WEEKDAYS[day]}</span>
                    <button
                      onClick={() => setDayTypes(prev => ({...prev, [day]: prev[day] === 'full' ? 'half' : 'full'}))}
                      className={`w-full py-3 rounded-lg text-sm font-bold transition-all border shadow-sm ${
                        dayTypes[day] === 'full' 
                          ? 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600' 
                          : 'bg-yellow-400 border-yellow-500 text-yellow-900 hover:bg-yellow-500'
                      }`}
                    >
                      {dayTypes[day] === 'full' ? '全天課' : '半天課'}
                    </button>
                  </div>
                ))}
             </div>
             <p className="text-sm text-slate-500 mt-3 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>
               半天課模式：第五節後放學，大下課自動改為打掃時間。
             </p>
          </SettingsSection>

          <SettingsSection 
            title="課表設定 (使用已建立的科目)" 
            icon={BookOpen} 
            isOpen={expandedSections['schedule']} 
            onToggle={() => toggleSection('schedule')}
            colorClass="text-blue-600"
          >
            <div className="mb-4 bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-start gap-2 text-sm text-blue-700">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">操作提示：</span>
                請使用下拉選單選擇科目。若選單中沒有您要的科目，請先至下方的「科目提示詞與管理」新增該科目。
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 text-sm text-center mb-2 font-bold bg-slate-100 p-3 rounded-xl text-slate-600">
              <div>節次</div>
              {Object.keys(schedule).map(day => <div key={day}>週{WEEKDAYS[day]}</div>)}
            </div>
            {timeSlots.filter(s => s.type === 'class').map(slot => (
              <div key={slot.id} className="grid grid-cols-6 gap-2 mb-2">
                <div className="flex items-center justify-center font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  {slot.name}
                </div>
                {Object.keys(schedule).map(day => (
                  <select
                    key={`${day}-${slot.id}`}
                    value={schedule[day][slot.id] || ''}
                    onChange={(e) => {
                      const newSchedule = { ...schedule };
                      newSchedule[day] = { ...newSchedule[day], [slot.id]: e.target.value };
                      setSchedule(newSchedule);
                    }}
                    className={`border rounded-lg p-2 text-center text-sm focus:ring-2 focus:ring-blue-400 outline-none hover:bg-white transition-colors appearance-none cursor-pointer
                      ${dayTypes[day] === 'half' && getSecondsFromTime(slot.start) >= getSecondsFromTime('13:20') ? 'opacity-30 bg-slate-100 cursor-not-allowed' : 'bg-white'}
                    `}
                    disabled={dayTypes[day] === 'half' && getSecondsFromTime(slot.start) >= getSecondsFromTime('13:20')}
                  >
                    <option value="">(空堂)</option>
                    {Object.keys(subjectHints).filter(k => k !== 'default').map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                ))}
              </div>
            ))}
          </SettingsSection>

          <SettingsSection 
            title="科目提示詞與管理" 
            icon={Coffee} 
            isOpen={expandedSections['hints']} 
            onToggle={() => toggleSection('hints')}
            colorClass="text-emerald-600"
          >
             <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-6 flex gap-3 items-center">
                <div className="font-bold text-emerald-800 whitespace-nowrap">新增科目：</div>
                <input 
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="輸入新科目名稱 (例如: 程式設計)"
                  className="flex-1 p-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                />
                <button 
                  onClick={handleAddSubject}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                >
                  <Plus size={18} /> 新增
                </button>
             </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 px-2 uppercase tracking-wider">
                <div className="col-span-3">科目名稱 (可編輯)</div>
                <div className="col-span-8">準備事項 / 提醒詞</div>
                <div className="col-span-1 text-center">刪除</div>
              </div>
              
              {Object.keys(subjectHints).map(subject => (
                <div key={subject} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="col-span-3 relative">
                     {subject === 'default' ? (
                       <div className="px-3 py-2 font-bold text-slate-500 bg-slate-100 rounded-lg text-sm border border-transparent">預設 (通用)</div>
                     ) : (
                       <input 
                        defaultValue={subject}
                        onBlur={(e) => handleRenameSubject(subject, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.target.blur();
                          }
                        }}
                        className="w-full px-3 py-2 font-bold text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-blue-50 rounded-lg text-sm outline-none transition-all"
                        title="點擊編輯科目名稱"
                       />
                     )}
                     {subject !== 'default' && <Edit3 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none" />}
                  </div>

                  <div className="col-span-8">
                    <input 
                      value={subjectHints[subject]}
                      onChange={(e) => setSubjectHints({...subjectHints, [subject]: e.target.value})}
                      className="w-full border-b border-slate-200 focus:border-emerald-500 outline-none px-2 py-1 text-sm bg-transparent"
                      placeholder="請輸入準備事項..."
                    />
                  </div>
                  
                  <div className="col-span-1 flex justify-center">
                    {subject !== 'default' && (
                      <button 
                        onClick={() => handleDeleteSubject(subject)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="刪除此科目"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">
              💡 提示：直接點擊「科目名稱」即可修改。修改後，課表中的相關課程會自動更新名稱。
            </p>
          </SettingsSection>

          <SettingsSection 
            title="系統維護 (備份/還原/測試)" 
            icon={Save} 
            isOpen={expandedSections['maintenance']} 
            onToggle={() => toggleSection('maintenance')}
            colorClass="text-slate-500"
          >
             <div className="space-y-6">
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-4">
                     <span className="font-bold text-slate-700">模擬設定：</span>
                     
                     {/* 星期選擇器 */}
                     <select
                        value={selectedDay}
                        onChange={handleDaySelectChange}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded border border-slate-300"
                     >
                       <option value="">(不變更星期)</option>
                       {WEEKDAYS.map((day, idx) => (
                         <option key={idx} value={idx}>週{day}</option>
                       ))}
                     </select>

                     {/* 時間輸入框 */}
                     <input 
                       type="text" 
                       value={tempTime}
                       onChange={handleTimeInputChange}
                       onClick={(e) => e.stopPropagation()} // 防止點擊觸發摺疊
                       placeholder="HH:mm (不變更留空)"
                       className="p-2 rounded border border-slate-300 w-40 text-center"
                       maxLength={5}
                     />
                     
                     <button 
                       onClick={applyTimeChange}
                       className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold shadow-sm"
                     >
                       套用
                     </button>

                     <button 
                       onClick={() => {
                         setTimeOffset(0);
                         setIsManualEco(false);
                         setIsAutoEcoOverride(true);
                         setTempTime('');
                         setSelectedDay('');
                       }}
                       className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 text-sm font-bold shadow-sm"
                     >
                       重置為現在
                     </button>
                     <span className="text-xs text-slate-400 font-mono">
                       (Offset: {timeOffset}ms)
                     </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    可單獨或同時設定「星期」與「時間」，請點擊「套用」來預覽效果。
                  </p>
               </div>

               <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={handleExport}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-colors font-bold shadow-sm"
                  >
                    <Download size={20} /> 匯出設定檔 (備份)
                  </button>
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors font-bold shadow-sm"
                  >
                    <Upload size={20} /> 匯入設定檔 (還原)
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImport} 
                    className="hidden" 
                    accept=".json"
                  />
               </div>
             </div>
          </SettingsSection>
        </div>

        <div className="p-4 border-t bg-white flex justify-end gap-3 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => {
              if(confirm('確定要重置所有設定回預設值嗎？')) {
                 setTimeSlots(DEFAULT_TIME_SLOTS);
                 setSchedule(DEFAULT_SCHEDULE);
                 setSubjectHints(DEFAULT_SUBJECT_HINTS);
                 setDayTypes(DEFAULT_DAY_TYPES);
                 setTimeOffset(0);
                 setIsManualEco(false);
                 setIsAutoEcoOverride(false);
                 setIs24Hour(true);
                 setSpecialButtons(DEFAULT_SPECIAL_BUTTONS); // 加入了重置按鈕的邏輯
              }
            }}
            className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-2 font-bold transition-colors"
          >
            <RefreshCw size={18}/> 重置預設
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-bold"
          >
            <Save size={18} /> 完成設定
          </button>
        </div>
      </div>
    </div>
  );
});

// ... CircularProgress ...
const CircularProgress = ({ progress, size = 300, strokeWidth = 15, children, colorClass }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          className="text-slate-200/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`transition-all duration-1000 ease-linear ${colorClass}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        {children}
      </div>
    </div>
  );
};

// ... MessageInput ...
const MessageInput = ({ isOpen, onClose, message, setMessage }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
       <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all scale-100">
          <h3 className="text-2xl font-bold mb-4 text-slate-700">新增臨時提醒</h3>
          <input 
             autoFocus
             value={message}
             onChange={e => setMessage(e.target.value)}
             className="w-full text-3xl font-bold p-4 border-2 border-blue-100 rounded-xl focus:border-blue-500 focus:outline-none mb-6"
             placeholder="例如：請將聯絡簿交到講桌"
             onKeyDown={e => {
               if (e.key === 'Enter') onClose();
             }}
          />
          <div className="flex justify-end gap-3">
             <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">完成</button>
             <button onClick={() => { setMessage(''); onClose(); }} className="px-6 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50">清除</button>
          </div>
       </div>
    </div>
  );
};

// --- ControlDock (Extracted Component) ---
const ControlDock = ({ 
  statusMode, 
  specialButtons, 
  setSpecialStatus, 
  setIsManualEco, 
  isFullscreen, 
  toggleFullScreen, 
  setShowSettings,
  isAutoNapActive,
  onBroadcastClick // New prop to open broadcast modal
}) => {
  if (statusMode === 'eco' || statusMode === 'special' || isAutoNapActive) return null;
  const isDark = statusMode === 'off-hours';
  
  return (
    <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-2 rounded-2xl shadow-2xl border flex items-center gap-2 whitespace-nowrap z-50 transition-all hover:scale-105 backdrop-blur-md max-w-[95vw] overflow-x-auto no-scrollbar ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-white/50'}`}>
      {specialButtons.map(btn => (
        <button 
          key={btn.id} 
          onClick={() => {
            // Check for custom broadcast type
            if (btn.type === 'input') {
              onBroadcastClick();
            } else {
              setSpecialStatus(btn);
            }
          }} 
          className={`px-3 py-2 rounded-xl font-bold text-white text-sm shadow-sm transition-all hover:-translate-y-1 bg-gradient-to-br shrink-0 ${btn.color}`}
        >
          {btn.label}
        </button>
      ))}
      <div className={`w-px h-6 mx-1 shrink-0 ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
      <button onClick={(e) => { e.stopPropagation(); setIsManualEco(true); }} className={`p-2 rounded-xl transition-colors shrink-0 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`} title="時鐘模式 (省電)"><Clock size={20} /></button>
      <button 
        onClick={toggleFullScreen}
        className={`p-2 rounded-xl transition-colors shrink-0 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
        title={isFullscreen ? "退出全螢幕" : "全螢幕模式"}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
      <button onClick={() => setShowSettings(true)} className={`p-2 rounded-xl shadow-lg transition-colors shrink-0 ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-800 text-white hover:bg-slate-700'}`}><Settings size={20} /></button>
    </div>
  );
};

// --- TimelineSidebar (Extracted Component - Memoized) ---
const SidebarHeader = ({ now, is24Hour, dayTypes }) => {
  const rocYear = now.getFullYear() - 1911;
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const dateNum = now.getDate().toString().padStart(2, '0');
  const week = WEEKDAYS[now.getDay()];
  
  // 新增假日判斷邏輯
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  const dayTypeLabel = isWeekend ? '假日' : (dayTypes[day] === 'full' ? '全天課' : '半天課');

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-lg shrink-0">
      <div className="text-4xl font-mono font-bold tracking-tight">
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !is24Hour })}
      </div>
      <div className="text-blue-100 mt-2 text-sm font-medium flex flex-col gap-1">
        <span>民國{rocYear}年{month}月{dateNum}日</span>
        <div className="flex justify-between items-center">
           <span>星期{week}</span>
           <span className={`px-2 py-0.5 bg-white/20 rounded-md text-xs border border-white/10 shadow-sm ${isWeekend ? 'bg-red-500/30 border-red-400/50' : ''}`}>{dayTypeLabel}</span>
        </div>
      </div>
    </div>
  );
};

const SidebarList = React.memo(({ displaySlots, daySchedule, currentSlotId }) => {
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSlotId]); 

  return (
    // Added 'no-scrollbar' class (style injected below in App)
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth no-scrollbar">
      {displaySlots.map((slot) => {
        const subject = daySchedule[slot.id] || slot.name;
        const isCurrent = currentSlotId === slot.id;
        const isActive = isCurrent; 
        return (
          <div 
            key={slot.id} 
            ref={isActive ? activeRef : null}
            className={`relative p-4 rounded-xl transition-all duration-500 ${isActive ? 'bg-blue-50 border-l-4 border-blue-600 shadow-md transform scale-105' : 'bg-slate-50 border-l-4 border-slate-200 opacity-60 grayscale'}`}
          >
            <div className="flex justify-between items-center text-xs text-slate-400 font-mono mb-1">
              <span>{slot.start}</span><span>{slot.end}</span>
            </div>
            <div className={`text-lg font-bold truncate ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{subject || slot.name}</div>
          </div>
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.currentSlotId === nextProps.currentSlotId &&
    prevProps.daySchedule === nextProps.daySchedule &&
    prevProps.displaySlots === nextProps.displaySlots
  );
});

const TimelineSidebar = ({ 
  now, 
  schedule, 
  activeTimeSlots, 
  currentSlot, 
  is24Hour, 
  dayTypes 
}) => {
  const daySchedule = schedule[now.getDay()] || {};
  const currentSlotId = currentSlot?.id;

  const displaySlots = useMemo(() => activeTimeSlots.filter(s => 
    (s.type === 'class' || ['morning', 'lunch', 'nap', 'cleaning'].includes(s.id)) && 
    s.id !== 'lunch_prep'
  ), [activeTimeSlots]);

  return (
    <div className="w-64 h-full bg-white/80 backdrop-blur-md border-r border-white/20 flex flex-col shadow-xl z-20">
      <SidebarHeader now={now} is24Hour={is24Hour} dayTypes={dayTypes} />
      <SidebarList 
        displaySlots={displaySlots} 
        daySchedule={daySchedule} 
        currentSlotId={currentSlotId} 
      />
    </div>
  );
};

// --- App ---
const App = () => {
  const [timeSlots, setTimeSlots] = useState(() => JSON.parse(localStorage.getItem('timeSlots')) || DEFAULT_TIME_SLOTS);
  const [schedule, setSchedule] = useState(() => JSON.parse(localStorage.getItem('schedule')) || DEFAULT_SCHEDULE);
  const [subjectHints, setSubjectHints] = useState(() => JSON.parse(localStorage.getItem('subjectHints')) || DEFAULT_SUBJECT_HINTS);
  const [specialButtons, setSpecialButtons] = useState(() => JSON.parse(localStorage.getItem('specialButtons')) || DEFAULT_SPECIAL_BUTTONS);
  
  const [is24Hour, setIs24Hour] = useState(() => {
    const saved = localStorage.getItem('is24Hour');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [dayTypes, setDayTypes] = useState(() => JSON.parse(localStorage.getItem('dayTypes')) || DEFAULT_DAY_TYPES);

  const [teacherMessage, setTeacherMessage] = useState('');
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTools, setShowTools] = useState(false); 
  const [showBroadcastInput, setShowBroadcastInput] = useState(false); // New state for broadcast modal
  const [isFullscreen, setIsFullscreen] = useState(false); 
  
  const [now, setNow] = useState(new Date());
  const [timeOffset, setTimeOffset] = useState(0); 
  
  const [statusMode, setStatusMode] = useState('loading'); 
  const [specialStatus, setSpecialStatus] = useState(null);
  const [isManualEco, setIsManualEco] = useState(false); 
  const [isAutoEcoOverride, setIsAutoEcoOverride] = useState(false);

  const [dismissedNap, setDismissedNap] = useState(false);

  const [currentSlot, setCurrentSlot] = useState(null);
  const [nextSlot, setNextSlot] = useState(null);
  const [progress, setProgress] = useState(100);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const [saverPos, setSaverPos] = useState({ x: 0, y: 0 });

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 如果正在編輯訊息，或者打開了設定/廣播，就不攔截鍵盤
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (showSettings || showBroadcastInput || isEditingMessage) return;

      if (e.key === 'f' || e.key === 'F') {
        toggleFullScreen();
      }
      if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false);
        if (showTools) setShowTools(false);
        if (showBroadcastInput) setShowBroadcastInput(false);
        if (specialStatus) setSpecialStatus(null);
        if (isEditingMessage) setIsEditingMessage(false);
        if (statusMode === 'break' && !dismissedNap) setDismissedNap(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings, showTools, showBroadcastInput, specialStatus, isEditingMessage, dismissedNap, statusMode]);

  const activeTimeSlots = useMemo(() => {
    const day = now.getDay();
    // 檢查是否為週末
    if (day === 0 || day === 6) return [];

    const isHalfDay = dayTypes[day] === 'half';

    if (!isHalfDay) return timeSlots;

    const halfDaySlots = [];
    let isDismissed = false;
    const p5Start = timeSlots.find(s => s.id === 'p5')?.start || '13:20';

    for (let slot of timeSlots) {
       if (isDismissed) continue;

       if (slot.id === 'break3') {
          halfDaySlots.push({ ...slot, name: '打掃時間' }); 
          continue;
       }

       if (getSecondsFromTime(slot.start) >= getSecondsFromTime(p5Start)) {
          halfDaySlots.push({ 
            id: 'after', 
            name: '放學', 
            start: slot.start, 
            end: '17:00', 
            type: 'break' 
          });
          isDismissed = true;
          continue;
       }
       halfDaySlots.push(slot);
    }
    return halfDaySlots;

  }, [timeSlots, dayTypes, now.getDay()]);

  const isNapTime = currentSlot?.name.includes('午休') || currentSlot?.id === 'nap';
  const isDismissal = currentSlot?.name.includes('放學') || currentSlot?.id === 'after';
  const isAutoNapActive = (isNapTime || isDismissal) && !dismissedNap && statusMode === 'break';

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.log(e));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date(Date.now() + timeOffset));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeOffset]);

  useEffect(() => {
    if (statusMode === 'eco') {
      const interval = setInterval(() => {
        setSaverPos({
          x: Math.floor(Math.random() * 100 - 50),
          y: Math.floor(Math.random() * 100 - 50)
        });
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [statusMode]);

  useEffect(() => {
    localStorage.setItem('timeSlots', JSON.stringify(timeSlots));
    localStorage.setItem('schedule', JSON.stringify(schedule));
    localStorage.setItem('subjectHints', JSON.stringify(subjectHints));
    localStorage.setItem('specialButtons', JSON.stringify(specialButtons));
    localStorage.setItem('is24Hour', JSON.stringify(is24Hour));
    localStorage.setItem('dayTypes', JSON.stringify(dayTypes));
  }, [timeSlots, schedule, subjectHints, specialButtons, is24Hour, dayTypes]);

  useEffect(() => {
    // 只有在【沒有打開設定視窗】的時候，才允許自動切換模式
    // 這樣可以防止調整時間時，系統自動跳轉到其他畫面干擾操作
    if (!showSettings) {
      setIsAutoEcoOverride(false);
      setDismissedNap(false);
    }
  }, [currentSlot?.id, showSettings]);

  useEffect(() => {
    if (specialStatus) {
      setStatusMode('special');
      return;
    }

    if (isManualEco) {
      setStatusMode('eco');
      return;
    }

    const currentTimeSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    
    let foundSlot = null;
    let nextClass = null;
    const sortedSlots = [...activeTimeSlots].sort((a, b) => getSecondsFromTime(a.start) - getSecondsFromTime(b.start));

    // 如果 activeTimeSlots 為空（例如週末），則直接視為 Off-hours
    if (activeTimeSlots.length === 0) {
      setStatusMode('off-hours');
      setCurrentSlot(null);
      setNextSlot(null);
      return;
    }

    for (let i = 0; i < sortedSlots.length; i++) {
      const slot = sortedSlots[i];
      const startSec = getSecondsFromTime(slot.start);
      const endSec = getSecondsFromTime(slot.end);

      if (currentTimeSec >= startSec && currentTimeSec < endSec) {
        foundSlot = slot;
        for (let j = i + 1; j < sortedSlots.length; j++) {
           if (sortedSlots[j].type === 'class') {
             nextClass = sortedSlots[j];
             break;
           }
        }
        break;
      }
    }

    setCurrentSlot(foundSlot);
    setNextSlot(nextClass);

    if (!foundSlot) {
      setStatusMode('off-hours');
      return;
    }

    if (foundSlot.type === 'class') {
      const startSec = getSecondsFromTime(foundSlot.start);
      const elapsed = currentTimeSec - startSec;
      
      if (elapsed > 180 && !isAutoEcoOverride) {
        setStatusMode('eco');
      } else {
        setStatusMode('class');
      }
    } else {
      const startSec = getSecondsFromTime(foundSlot.start);
      const endSec = getSecondsFromTime(foundSlot.end);
      const total = endSec - startSec;
      const remain = endSec - currentTimeSec;
      
      setSecondsRemaining(remain);
      setProgress(Math.max(0, Math.min(100, (remain / total) * 100)));

      if (remain <= 60 && remain > 0) {
        setStatusMode('pre-bell');
      } else {
        setStatusMode('break');
      }
    }
  }, [now, activeTimeSlots, specialStatus, isManualEco]);

  const getNextSubjectName = () => {
    if (currentSlot && (currentSlot.name.includes('打掃') || currentSlot.id === 'cleaning')) {
       return currentSlot.name;
    }
    if (!nextSlot) return '放學';
    const daySchedule = schedule[now.getDay()];
    if (!daySchedule) return '無課表';
    return daySchedule[nextSlot.id] || nextSlot.name;
  };

  const getSystemHint = () => {
    if (currentSlot && (currentSlot.name.includes('打掃') || currentSlot.id === 'cleaning')) {
       return subjectHints['全天打掃'] || subjectHints['打掃時間'] || '請拿起掃具，認真打掃環境，保持整潔';
    }
    if (currentSlot && (currentSlot.name.includes('午餐') || currentSlot.name.includes('午休') || currentSlot.name.includes('放學'))) {
       return subjectHints[currentSlot.name] || '請保持安靜';
    }
    const subject = getNextSubjectName();
    return subjectHints[subject] || subjectHints['default'];
  };

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatROCDate = (date) => {
    const rocYear = date.getFullYear() - 1911;
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const week = WEEKDAYS[date.getDay()];
    // 判斷是否為假日
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const dayType = isWeekend ? '假日' : (dayTypes[date.getDay()] === 'full' ? '全天' : '半天');
    return `民國${rocYear}年${month}月${day}日 星期${week} (${dayType})`;
  };

  const BreakView = () => {
    const isPreBell = statusMode === 'pre-bell';
    const isNap = currentSlot?.name.includes('午休'); 
    const isDismissal = currentSlot?.name.includes('放學');
    const progressColor = (isNap || isDismissal) ? 'text-indigo-400' : (isPreBell ? 'text-red-500' : (progress > 50 ? 'text-emerald-500' : 'text-amber-400'));
    const isCleaning = currentSlot && (currentSlot.name.includes('打掃') || currentSlot.id === 'cleaning');
    const isLunch = currentSlot && currentSlot.name.includes('午餐');
    
    // 自動排程的午休或放學模式：如果沒有被手動關閉，顯示全螢幕覆蓋
    if ((isNap || isDismissal) && !dismissedNap) {
      const title = isNap ? "午休時間" : "放學時間";
      const subtext = isNap ? "Shhh... 請保持安靜，好好休息" : "請收拾書包，準備回家";
      const icon = isNap ? Moon : Home;

      return (
        <QuietModeView 
          title={title}
          subtext={subtext}
          icon={icon}
          onClose={() => setDismissedNap(true)} // 點擊關閉，暫時解除全螢幕，回到主畫面
          centerContent={
             <div className="flex flex-col items-center">
                 <div className="text-8xl font-mono font-bold text-slate-200 drop-shadow-2xl">
                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}
                 </div>
                 <div className="mt-8 bg-white/10 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 text-indigo-200">
                     <span className="mr-4">{isNap ? '💤' : '🏠'}</span>{getSystemHint()}
                 </div>
             </div>
          }
        />
      );
    }

    return (
      <div className={`flex-1 relative overflow-hidden transition-colors duration-1000 ${isPreBell ? 'bg-red-50' : 'bg-slate-100'}`}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-start p-8">
            <div className="bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-sm border border-white/50">
              <span className="text-slate-500 font-bold mr-2">
                {isCleaning ? '目前時段' : (isLunch ? '目前時段' : (isNap ? '目前時段' : (isDismissal ? '目前時段' : '下一節準備')))}
              </span>
              <span className="text-2xl font-bold text-slate-800">
                {isLunch ? '午餐時間' : (isNap ? '午休時間' : (isDismissal ? '放學時間' : getNextSubjectName()))}
              </span>
            </div>
            {timeOffset !== 0 && <div className="bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-bold animate-pulse border border-red-200">⚠️ 時間模擬模式中</div>}
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 px-8 pb-8">
            <div className={`relative transition-all duration-500 ${isPreBell ? 'scale-110' : ''}`}>
              <CircularProgress progress={progress} size={400} strokeWidth={24} colorClass={progressColor}>
                <div className="text-center flex flex-col items-center">
                   <div className={`text-[7rem] font-bold font-mono tracking-tighter leading-none ${isPreBell ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>{formatCountdown(secondsRemaining)}</div>
                   <div className="text-slate-400 font-medium mt-2 tracking-widest uppercase">{isPreBell ? '預備鐘響' : 'REMAINING'}</div>
                </div>
              </CircularProgress>
            </div>
            <div className="max-w-xl w-full flex flex-col gap-6">
              {teacherMessage ? (
                <div onClick={() => setIsEditingMessage(true)} className="bg-yellow-200 p-6 shadow-lg transform rotate-1 hover:rotate-0 transition-transform cursor-pointer relative group" style={{ fontFamily: 'cursive, sans-serif' }}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-300/50 backdrop-blur-sm rotate-1"></div>
                  <div className="flex justify-between items-start mb-2 opacity-50">
                    <span className="text-xs font-bold uppercase tracking-widest text-yellow-800">MEMO</span>
                    <Edit3 size={16} className="text-yellow-700 opacity-0 group-hover:opacity-100 transition-opacity"/>
                  </div>
                  <p className="text-3xl font-bold text-slate-800 leading-snug break-words">{teacherMessage}</p>
                </div>
              ) : (!isPreBell && (
                  <button onClick={() => setIsEditingMessage(true)} className="group flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-yellow-400 hover:bg-yellow-50 transition-all">
                    <Edit3 className="text-slate-400 group-hover:text-yellow-600" /><span className="text-slate-400 font-bold group-hover:text-yellow-700">新增便利貼留言</span>
                  </button>
              ))}
              <div className={`bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50 transform transition-all duration-500 ${isPreBell ? 'opacity-50 blur-[2px] scale-95' : 'opacity-100 scale-100'}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-2xl text-blue-600"><BookOpen size={32} /></div>
                  <div className="text-lg text-slate-500 font-bold">
                    {isCleaning ? '打掃提醒' : (isLunch ? '用餐提醒' : (isNap ? '午休提醒' : (isDismissal ? '放學提醒' : '請準備')))}
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-800 leading-normal">{getSystemHint()}</div>
              </div>
              {isPreBell && (
                <div className="bg-red-600 text-white p-8 rounded-3xl shadow-2xl border-4 border-red-400 animate-bounce-subtle flex items-center justify-center text-center">
                   <div><h3 className="text-4xl font-bold mb-2">請回座位</h3><p className="text-xl opacity-90">靜候老師上課</p></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ClassView = () => (
    <div className="flex-1 bg-slate-50 flex items-center justify-center p-8">
      <div className="max-w-5xl w-full bg-white rounded-[3rem] shadow-2xl p-16 text-center border-4 border-slate-100 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
         <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-50 text-indigo-600 mb-6"><Bell size={48} /></div>
         <h1 className="text-7xl font-bold text-slate-800 mb-8 tracking-tight">上課了</h1>
         <div className="text-3xl text-slate-500 mb-12 font-medium">現在是 <span className="text-indigo-600 font-bold mx-2">{schedule[now.getDay()]?.[currentSlot?.id] || currentSlot?.name}</span> 時間</div>
         <div className="bg-slate-50 rounded-2xl p-8 max-w-2xl mx-auto"><p className="text-2xl text-slate-700 leading-relaxed">請拿出課本與學用品<br/>保持安靜，專心聽講</p></div>
      </div>
    </div>
  );

  const OffHoursView = () => (
    <div className="flex-1 bg-slate-900 relative overflow-hidden flex flex-col items-center justify-center p-8 transition-colors duration-1000">
      <div className="absolute top-10 left-20 w-2 h-2 bg-white rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-white rounded-full opacity-40 animate-pulse delay-700"></div>
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white rounded-full opacity-30 animate-pulse delay-300"></div>
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-slate-800 to-transparent opacity-50 pointer-events-none"></div>
      <div className="text-center z-10">
         <div className="mb-8"><div className="text-xl text-blue-300 font-medium mb-2 tracking-widest uppercase">Off-Hours</div><h2 className="text-6xl font-bold text-white tracking-tight drop-shadow-lg">非上課時段</h2></div>
         <div className="font-mono text-[8rem] leading-none text-slate-200 font-bold drop-shadow-2xl">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !is24Hour })}</div>
         <div className="text-2xl text-slate-400 mt-4 font-light">{formatROCDate(now)}</div>
         <div className="mt-12 flex items-center justify-center gap-4">
            <div className="px-6 py-3 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 backdrop-blur-sm flex items-center gap-2"><Moon size={18} /><span>系統待機中</span></div>
            <div className="px-6 py-3 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-300 backdrop-blur-sm flex items-center gap-2"><Sun size={18} /><span>預計下次啟動：明天 07:20</span></div>
         </div>
      </div>
    </div>
  );

  const EcoView = () => (
    <div 
      className="flex-1 bg-black relative overflow-hidden cursor-pointer w-full h-full" 
      onClick={() => {
        setIsManualEco(false);
        setIsAutoEcoOverride(true);
      }} 
    >
       <div 
         className="absolute transition-all duration-[2000ms] flex flex-col items-center"
         style={{ transform: `translate(${saverPos.x}px, ${saverPos.y}px)`, top: '50%', left: '50%', marginTop: '-150px', marginLeft: '-300px', width: '600px' }}
       >
          <div className="text-[12rem] font-mono font-bold text-slate-800 leading-none select-none">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}</div>
          <div className="mt-4 text-2xl text-slate-900 font-medium border px-4 py-1 rounded-full border-slate-900">{schedule[now.getDay()]?.[currentSlot?.id] || (currentSlot ? '上課中' : '休息中')}</div>
          <div className="mt-8 text-slate-800 opacity-20 text-sm">點擊畫面喚醒</div>
       </div>
    </div>
  );

  const SpecialView = () => {
    if (!specialStatus) return null;

    if (specialStatus.type === 'dark') {
      const isBook = specialStatus.icon === 'book';
      const hintText = subjectHints[specialStatus.message] || '進行中...';
      
      return (
        <QuietModeView 
          title={specialStatus.message}
          subtext={specialStatus.sub}
          icon={isBook ? BookOpen : Moon}
          onClose={() => setSpecialStatus(null)}
          centerContent={
             <div className="flex flex-col items-center">
                 <div className="text-8xl font-mono font-bold text-slate-200 drop-shadow-2xl">
                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}
                 </div>
                 <div className="mt-8 bg-white/10 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 text-indigo-200">
                     <span className="mr-4">{isBook ? '📖' : '💤'}</span>{hintText}
                 </div>
             </div>
          }
        />
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 p-8">
        <div className={`max-w-6xl w-full aspect-video rounded-[3rem] shadow-2xl flex flex-col items-center justify-center text-center p-12 bg-gradient-to-br text-white relative overflow-hidden ${specialStatus.color || 'from-blue-600 to-indigo-800'}`}>
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            {specialStatus.id === 6 ? <BedDouble size={100} className="mb-8 opacity-90" /> : (specialStatus.id === 99 ? <Megaphone size={100} className="mb-8 opacity-90 animate-bounce" /> : <MapPin size={100} className="mb-8 opacity-90 animate-bounce" />)}
            <h1 className="text-[7rem] font-bold mb-4 leading-tight drop-shadow-md">{specialStatus.message}</h1>
            {specialStatus.sub && <p className="text-4xl opacity-90 font-medium bg-white/20 px-8 py-2 rounded-full backdrop-blur-sm">{specialStatus.sub}</p>}
            <div className="absolute bottom-12 right-12 text-2xl font-mono opacity-60">現在時間 {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}</div>
            <button onClick={() => setSpecialStatus(null)} className="absolute top-12 right-12 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={32} /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans text-slate-800 bg-slate-200 selection:bg-indigo-200">
      {/* 隱藏捲軸的 CSS */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {statusMode !== 'eco' && statusMode !== 'off-hours' && <TimelineSidebar 
        now={now} 
        schedule={schedule} 
        activeTimeSlots={activeTimeSlots} 
        currentSlot={currentSlot} 
        nextSlot={nextSlot} 
        is24Hour={is24Hour} 
        dayTypes={dayTypes} 
      />}
      <div className="flex-1 flex flex-col relative">
        {statusMode === 'loading' && <div className="flex-1 flex items-center justify-center">Loading...</div>}
        {(statusMode === 'break' || statusMode === 'pre-bell') && <BreakView />}
        {statusMode === 'class' && <ClassView />}
        {statusMode === 'eco' && <EcoView />}
        {statusMode === 'off-hours' && <OffHoursView />}
        {statusMode === 'special' && specialStatus && <SpecialView />}
        
        {/* ControlDock with updated logic */}
        <ControlDock 
          statusMode={statusMode}
          specialButtons={specialButtons}
          setSpecialStatus={setSpecialStatus}
          setIsManualEco={setIsManualEco}
          isFullscreen={isFullscreen}
          toggleFullScreen={toggleFullScreen}
          setShowSettings={setShowSettings}
          isAutoNapActive={isAutoNapActive}
          onBroadcastClick={() => setShowBroadcastInput(true)}
        />
        
        {/* Tools Button Trigger - Only show when NOT in special modes */}
        {!(statusMode === 'eco' || statusMode === 'special' || isAutoNapActive) && (
           <div className="absolute bottom-6 right-6 z-50">
              <button 
                onClick={() => setShowTools(true)}
                className="p-4 bg-white/90 backdrop-blur shadow-xl rounded-2xl text-slate-600 hover:text-blue-600 hover:scale-110 transition-all border border-white/50"
                title="教室小工具"
              >
                <Box size={24} />
              </button>
           </div>
        )}
      </div>
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        timeSlots={timeSlots}
        setTimeSlots={setTimeSlots}
        schedule={schedule}
        setSchedule={setSchedule}
        subjectHints={subjectHints}
        setSubjectHints={setSubjectHints}
        dayTypes={dayTypes}
        setDayTypes={setDayTypes}
        timeOffset={timeOffset}
        setTimeOffset={setTimeOffset}
        setIsManualEco={setIsManualEco}
        setIsAutoEcoOverride={setIsAutoEcoOverride}
        setNow={setNow} // Pass setNow to SettingsModal
        is24Hour={is24Hour}
        setIs24Hour={setIs24Hour}
        setSpecialButtons={setSpecialButtons} // 傳遞更新按鈕的 function
        now={now} // 傳遞 now
      />
      <ToolsModal isOpen={showTools} onClose={() => setShowTools(false)} />
      <BroadcastInputModal 
        isOpen={showBroadcastInput} 
        onClose={() => setShowBroadcastInput(false)}
        onConfirm={(title, sub) => setSpecialStatus({ message: title, sub: sub, color: 'from-pink-500 to-rose-500', type: 'input', id: 99 })}
      />
      <MessageInput isOpen={isEditingMessage} onClose={() => setIsEditingMessage(false)} message={teacherMessage} setMessage={setTeacherMessage} />
    </div>
  );
};

export default App;
