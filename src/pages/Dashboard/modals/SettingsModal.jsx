import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, Clock, Calendar, Save, RefreshCw, Wrench, 
  Download, Upload, Plus, Trash2, Check, ChevronDown, ChevronUp, MapPin, X, CloudSun
} from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';
import { TAIWAN_LOCATIONS } from '../utils/dashboardConstants'; // 引入地點資料
import GlobalBackupModal from '../../../components/common/GlobalBackupModal';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

// 定義各區塊的主題色系 (Tailwind Classes)
const SECTION_THEMES = {
  gray: {
    icon: 'text-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700',
    activeRing: 'ring-slate-400/30',
    lightBg: 'bg-slate-100/50 dark:bg-slate-800/50'
  },
  rose: {
    icon: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/10',
    border: 'border-rose-100 dark:border-rose-900/30',
    activeRing: 'ring-rose-400/30',
    lightBg: 'bg-rose-50/30 dark:bg-rose-900/10'
  },
  orange: {
    icon: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/10',
    border: 'border-orange-100 dark:border-orange-900/30',
    activeRing: 'ring-orange-400/30',
    lightBg: 'bg-orange-50/30 dark:bg-orange-900/10'
  },
  purple: {
    icon: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/10',
    border: 'border-purple-100 dark:border-purple-900/30',
    activeRing: 'ring-purple-400/30',
    lightBg: 'bg-purple-50/30 dark:bg-purple-900/10'
  },
  blue: {
    icon: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    border: 'border-blue-100 dark:border-blue-900/30',
    activeRing: 'ring-blue-400/30',
    lightBg: 'bg-blue-50/30 dark:bg-blue-900/10'
  },
  emerald: {
    icon: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/10',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    activeRing: 'ring-emerald-400/30',
    lightBg: 'bg-emerald-50/30 dark:bg-emerald-900/10'
  }
};

const SettingsSection = ({ title, icon: Icon, isOpen, onToggle, children, theme = 'gray' }) => {
  const styles = SECTION_THEMES[theme];

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300 border ${isOpen ? `${styles.border} shadow-lg ring-4 ${styles.activeRing}` : `${UI_THEME.BORDER_DEFAULT} shadow-sm hover:shadow-md`}`}>
      <button 
        onClick={onToggle}
        className={`w-full p-5 flex items-center justify-between transition-colors text-left ${isOpen ? styles.bg : `${UI_THEME.SURFACE_CARD} hover:bg-slate-50 dark:hover:bg-slate-800`}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl ${isOpen ? 'bg-white dark:bg-slate-900 shadow-sm' : 'bg-slate-100 dark:bg-slate-800'}`}>
             <Icon className={styles.icon} size={24} />
          </div>
          <span className={`text-lg font-bold ${UI_THEME.TEXT_PRIMARY}`}>{title}</span>
        </div>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${UI_THEME.TEXT_MUTED}`}>
          <ChevronDown size={20}/>
        </div>
      </button>
      
      {isOpen && (
        <div className={`p-6 border-t animate-in slide-in-from-top-2 duration-300 ${styles.border} ${styles.lightBg}`}>
          {children}
        </div>
      )}
    </div>
  );
};

const SettingsModal = ({ 
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
  now,
  visibleButtons, setVisibleButtons,
  systemButtonsConfig, 
  defaultValues,
  weatherConfig, setWeatherConfig
}) => {
  const [expandedSections, setExpandedSections] = useState({ 'general': true });
  const [newSubjectName, setNewSubjectName] = useState('');
  const [tempTime, setTempTime] = useState(''); 
  const [selectedDay, setSelectedDay] = useState(''); 
  const fileInputRef = useRef(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  useEffect(() => {
    if (isOpen && now) {
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        setTempTime(`${h}:${m}`);
        setSelectedDay(prev => prev === '' ? now.getDay().toString() : prev);
    }
  }, [isOpen]); 

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleTimeSlotChange = (id, field, value) => {
    const newSlots = timeSlots.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    );
    newSlots.sort((a, b) => a.start.localeCompare(b.start));
    setTimeSlots(newSlots);
  };

  const handleAddSlot = () => {
    const newId = `custom_${Date.now()}`;
    const newSlot = { 
        id: newId, 
        name: '新時段', 
        start: '00:00', 
        end: '00:00', 
        type: 'break' 
    };
    setTimeSlots([...timeSlots, newSlot]);
  };

  const handleDeleteSlot = (id) => {
    if (confirm('確定要刪除此時段嗎？這將會一併清除該時段的課表資料。')) {
        setTimeSlots(timeSlots.filter(s => s.id !== id));
        const newSchedule = { ...schedule };
        Object.keys(newSchedule).forEach(day => {
            if (newSchedule[day][id]) delete newSchedule[day][id];
        });
        setSchedule(newSchedule);
    }
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
    if (confirm(`確定要刪除「${subject}」嗎？`)) {
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
      alert(`科目「${trimmedNew}」已存在。`);
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

// 在 SettingsModal 內部，加入搜尋函式
const handleSearchLocation = async () => {
  if (!weatherConfig.district) return;
  
  // 顯示搜尋中... (您可以加個 loading state，這裡簡化處理)
  const query = weatherConfig.district; 
  
  try {
    // 使用 OpenStreetMap 的免費搜尋 API
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
    const data = await res.json();

    if (data && data.length > 0) {
      const result = data[0];
      setWeatherConfig({
        ...weatherConfig,
        city: 'custom', // 標記為自訂
        // district: result.display_name, // 如果想用搜尋到的全名
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      });
      alert(`已找到地點：${result.display_name}\n座標更新為：${result.lat}, ${result.lon}`);
    } else {
      alert('找不到該地點，請嘗試輸入更完整的名稱（例如：嘉義縣阿里山鄉）');
    }
  } catch (error) {
    console.error(error);
    alert('搜尋失敗，請檢查網路連線');
  }
};


  const toggleButtonVisibility = (btnId) => {
    const newSet = new Set(visibleButtons);
    if (newSet.has(btnId)) newSet.delete(btnId);
    else newSet.add(btnId);
    setVisibleButtons(Array.from(newSet));
  };



  const applyTimeChange = () => {
    const nowReal = new Date();
    let targetDate = new Date(nowReal);

    if (tempTime) {
      const [h, m] = tempTime.split(':').map(Number);
      targetDate.setHours(h, m, 0);
    }
    if (selectedDay !== '') {
      const currentDay = nowReal.getDay();
      const targetDay = parseInt(selectedDay, 10);
      targetDate.setDate(nowReal.getDate() + (targetDay - currentDay));
    }
    const offset = targetDate.getTime() - nowReal.getTime();
    setTimeOffset(offset);
    setNow(new Date(Date.now() + offset)); 
    setIsManualEco(false);
    setIsAutoEcoOverride(true);
  };

  if (!isOpen) return null;

  // 通用輸入框樣式
  const inputStyle = `bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 outline-none rounded-lg transition-all ${UI_THEME.TEXT_PRIMARY}`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
      <GlobalBackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
      {/* 彈窗容器：使用毛玻璃效果，取代純色背景 */}
      <div className={`${UI_THEME.SURFACE_GLASS} w-full max-w-5xl h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border ${UI_THEME.BORDER_LIGHT}`}>
        
        {/* Header：更清爽的設計 */}
        <div className={`px-8 py-6 flex justify-between items-center shrink-0 border-b ${UI_THEME.BORDER_LIGHT}`}>
          <div>
              <h2 className={`text-3xl font-bold flex items-center gap-3 ${UI_THEME.TEXT_PRIMARY}`}>
                <div className="p-2 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/30">
                    <Settings size={24} />
                </div>
                設定控制台
              </h2>
              <p className={`mt-1 text-sm ${UI_THEME.TEXT_MUTED}`}>調整課表、作息時間與系統偏好設定</p>
          </div>
          <button 
            onClick={onClose} 
            className={`p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${UI_THEME.TEXT_SECONDARY}`}
          >
            <X size={24} />
          </button>
        </div>
        
        {/* 內容區 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
          
          <SettingsSection 
            title="一般設定" 
            icon={Wrench} 
            theme="gray"
            isOpen={expandedSections['general']} 
            onToggle={() => toggleSection('general')}
          >
             <div className="flex flex-col gap-6">
               <div className="flex items-center gap-4">
                  <span className={`font-bold w-24 ${UI_THEME.TEXT_SECONDARY}`}>時間格式：</span>
                  <div className={`flex rounded-lg p-1 ${UI_THEME.BACKGROUND}`}>
                     <button onClick={() => setIs24Hour(false)} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${!is24Hour ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400' : `${UI_THEME.TEXT_MUTED} hover:text-slate-600`}`}>12H</button>
                     <button onClick={() => setIs24Hour(true)} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${is24Hour ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400' : `${UI_THEME.TEXT_MUTED} hover:text-slate-600`}`}>24H</button>
                  </div>
               </div>
             </div>
          </SettingsSection>

          <SettingsSection 
            title="作息時間表設定" 
            icon={Clock} 
            theme="rose"
            isOpen={expandedSections['timeslots']} 
            onToggle={() => toggleSection('timeslots')}
          >
            <div className="space-y-3">
                <div className={`grid grid-cols-12 gap-4 text-xs font-bold px-4 uppercase tracking-wider ${UI_THEME.TEXT_MUTED} opacity-70`}>
                    <div className="col-span-3">時段名稱</div>
                    <div className="col-span-2">開始</div>
                    <div className="col-span-2">結束</div>
                    <div className="col-span-3">類型</div>
                    <div className="col-span-2 text-center">操作</div>
                </div>
                
                {timeSlots.map((slot) => (
                    <div key={slot.id} className={`grid grid-cols-12 gap-4 items-center p-3 rounded-xl border transition-all hover:shadow-md ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT}`}>
                        <div className="col-span-3">
                            <input 
                                value={slot.name} 
                                onChange={(e) => handleTimeSlotChange(slot.id, 'name', e.target.value)}
                                className={`w-full font-bold px-3 py-2 ${inputStyle}`}
                            />
                        </div>
                        <div className="col-span-2">
                            <input
                                type="time"
                                value={slot.start}
                                onChange={(e) => handleTimeSlotChange(slot.id, 'start', e.target.value)}
                                className={`w-full font-mono font-bold text-center px-1 py-2 ${inputStyle}`}
                            />
                        </div>
                        <div className="col-span-2">
                            <input
                                type="time"
                                value={slot.end}
                                onChange={(e) => handleTimeSlotChange(slot.id, 'end', e.target.value)}
                                className={`w-full font-mono font-bold text-center px-1 py-2 ${inputStyle}`}
                            />
                        </div>
                        <div className="col-span-3">
                            <select 
                                value={slot.type} 
                                onChange={(e) => handleTimeSlotChange(slot.id, 'type', e.target.value)}
                                className={`w-full text-sm font-bold px-3 py-2 cursor-pointer ${inputStyle} ${slot.type === 'class' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                            >
                                <option value="class">📚 上課 (Class)</option>
                                <option value="break">☕ 下課 (Break)</option>
                            </select>
                        </div>
                        <div className="col-span-2 text-center">
                            <button 
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                <button 
                    onClick={handleAddSlot}
                    className="w-full py-4 mt-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} /> 新增時間段
                </button>
            </div>
          </SettingsSection>

          <SettingsSection 
            title="全天/半天設定" 
            icon={Calendar} 
            theme="orange"
            isOpen={expandedSections['dayTypes']} 
            onToggle={() => toggleSection('dayTypes')}
          >
             <div className="grid grid-cols-5 gap-4">
                {[1,2,3,4,5].map(day => (
                  <div key={day} className={`flex flex-col items-center gap-3 p-4 rounded-xl border ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT}`}>
                    <span className={`text-sm font-bold ${UI_THEME.TEXT_SECONDARY}`}>週{WEEKDAYS[day]}</span>
                    <div className="flex flex-col gap-2 w-full">
                        <button
                            onClick={() => setDayTypes(prev => ({...prev, [day]: 'full'}))}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm flex items-center justify-center gap-1 ${
                                dayTypes[day] === 'full' 
                                ? 'bg-blue-500 text-white border-blue-600 shadow-blue-200' 
                                : `bg-transparent ${UI_THEME.TEXT_MUTED} border-transparent hover:bg-slate-100 dark:hover:bg-slate-800`
                            }`}
                        >
                            {dayTypes[day] === 'full' && <Check size={12}/>} 全天
                        </button>
                        <button
                            onClick={() => setDayTypes(prev => ({...prev, [day]: 'half'}))}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm flex items-center justify-center gap-1 ${
                                dayTypes[day] === 'half' 
                                ? 'bg-amber-500 text-white border-amber-600 shadow-amber-200' 
                                : `bg-transparent ${UI_THEME.TEXT_MUTED} border-transparent hover:bg-slate-100 dark:hover:bg-slate-800`
                            }`}
                        >
                            {dayTypes[day] === 'half' && <Check size={12}/>} 半天
                        </button>
                    </div>
                  </div>
                ))}
             </div>
          </SettingsSection>

          <SettingsSection 
            title="快捷按鈕管理" 
            icon={MapPin} 
            theme="purple"
            isOpen={expandedSections['buttons']} 
            onToggle={() => toggleSection('buttons')}
          >
             <div className="space-y-6">
                <div>
                    <h4 className={`text-xs font-bold uppercase mb-3 ${UI_THEME.TEXT_MUTED} tracking-wider`}>常用動作</h4>
                    <div className="flex flex-wrap gap-3">
                        {systemButtonsConfig.singles.map(btn => (
                            <button key={btn.id} onClick={() => toggleButtonVisibility(btn.id)} className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95 ${visibleButtons.includes(btn.id) ? 'bg-purple-600 text-white border-purple-600 shadow-purple-200' : `${UI_THEME.SURFACE_CARD} ${UI_THEME.TEXT_MUTED} border-transparent opacity-60 grayscale hover:opacity-100 hover:grayscale-0`}`}>
                                {visibleButtons.includes(btn.id) && <Check size={14}/>}
                                <btn.icon size={16}/> {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
                {systemButtonsConfig.groups.map(group => (
                    <div key={group.id}>
                        <h4 className={`text-xs font-bold uppercase mb-3 flex items-center gap-2 ${UI_THEME.TEXT_MUTED} tracking-wider`}><group.icon size={14}/> {group.label}</h4>
                        <div className="flex flex-wrap gap-3">
                            {group.items.map(btn => (
                                <button key={btn.id} onClick={() => toggleButtonVisibility(btn.id)} className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95 ${visibleButtons.includes(btn.id) ? 'bg-purple-600 text-white border-purple-600 shadow-purple-200' : `${UI_THEME.SURFACE_CARD} ${UI_THEME.TEXT_MUTED} border-transparent opacity-60 grayscale hover:opacity-100 hover:grayscale-0`}`}>
                                    {visibleButtons.includes(btn.id) && <Check size={14}/>}
                                    <btn.icon size={16}/> {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
             </div>
          </SettingsSection>

          <SettingsSection 
            title="課表設定" 
            icon={Calendar} 
            theme="blue"
            isOpen={expandedSections['schedule']} 
            onToggle={() => toggleSection('schedule')}
          >
            <div className={`grid grid-cols-6 gap-3 text-sm text-center mb-3 font-bold p-3 rounded-xl ${UI_THEME.BACKGROUND} ${UI_THEME.TEXT_SECONDARY}`}>
              <div>節次</div>
              {Object.keys(schedule).map(day => <div key={day}>週{WEEKDAYS[day]}</div>)}
            </div>
            {timeSlots.filter(s => s.type === 'class').map(slot => (
              <div key={slot.id} className="grid grid-cols-6 gap-3 mb-3">
                <div className={`flex items-center justify-center font-bold rounded-lg text-sm ${UI_THEME.SURFACE_CARD} ${UI_THEME.TEXT_PRIMARY} shadow-sm border ${UI_THEME.BORDER_DEFAULT}`}>{slot.name}</div>
                {Object.keys(schedule).map(day => (
                  <select
                    key={`${day}-${slot.id}`}
                    value={schedule[day][slot.id] || ''}
                    onChange={(e) => setSchedule({...schedule, [day]: {...schedule[day], [slot.id]: e.target.value}})}
                    className={`text-center text-sm cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 ${inputStyle} p-2`}
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
            title="科目與提醒詞管理" 
            icon={Clock} 
            theme="emerald"
            isOpen={expandedSections['hints']} 
            onToggle={() => toggleSection('hints')}
          >
             <div className="flex gap-3 mb-6">
                <input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="輸入新科目名稱..." className={`flex-1 p-3 shadow-sm ${inputStyle}`} onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()} />
                <button onClick={handleAddSubject} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-2"><Plus size={20}/> 新增</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {Object.keys(subjectHints).map(subject => (
                 <div key={subject} className={`flex gap-3 items-center p-3 rounded-xl border shadow-sm ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT}`}>
                    {subject === 'default' ? <span className={`px-3 py-1.5 rounded-lg text-sm font-bold w-24 text-center ${UI_THEME.BACKGROUND} ${UI_THEME.TEXT_MUTED}`}>預設</span> : 
                    <input defaultValue={subject} onBlur={(e) => handleRenameSubject(subject, e.target.value)} className={`w-24 px-2 py-1 font-bold bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none text-sm transition-colors ${UI_THEME.TEXT_PRIMARY}`}/>}
                    <input value={subjectHints[subject]} onChange={(e) => setSubjectHints({...subjectHints, [subject]: e.target.value})} className={`flex-1 bg-transparent outline-none text-sm ${UI_THEME.TEXT_SECONDARY} focus:text-blue-500`} placeholder="輸入提醒事項..." />
                    {subject !== 'default' && <button onClick={() => handleDeleteSubject(subject)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 size={16}/></button>}
                 </div>
               ))}
             </div>
          </SettingsSection>
		{/* 天氣設定區塊 */}
		  <SettingsSection 
            title="天氣與地區設定" 
            icon={CloudSun} 
            theme="blue"
            isOpen={expandedSections['weather']} 
            onToggle={() => toggleSection('weather')}
          >
             <div className="flex flex-col gap-4">
               
               {/* 1. 新增：顯示開關 (Toggle Switch) */}
               <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex flex-col">
                     <span className={`font-bold text-lg ${UI_THEME.TEXT_PRIMARY}`}>顯示天氣小工具</span>
                     <span className={`text-xs ${UI_THEME.TEXT_MUTED}`}>在主畫面右上角顯示即時氣溫與降雨機率</span>
                  </div>
                  <button
                    onClick={() => setWeatherConfig({ ...weatherConfig, enabled: !weatherConfig.enabled })}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ease-in-out ${
                       weatherConfig.enabled ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                       weatherConfig.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
               </div>

               {/* 只有開啟時才顯示詳細設定 (透明度切換) */}
               <div className={`transition-all duration-300 ${weatherConfig.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                   
                   {/* 1. 快速選單區域 */}
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className={`block text-sm font-bold mb-2 ${UI_THEME.TEXT_SECONDARY}`}>縣市 (快速樣板)</label>
                        <select 
                          value={weatherConfig.city} 
                          onChange={(e) => {
                             const newCity = e.target.value;
                             if (newCity === 'custom') {
                                setWeatherConfig({ ...weatherConfig, city: 'custom', district: '' });
                             } else {
                                const firstDist = TAIWAN_LOCATIONS[newCity][0]; 
                                setWeatherConfig({
                                  city: newCity,
                                  district: firstDist.name,
                                  lat: firstDist.lat,
                                  lon: firstDist.lon
                                });
                             }
                          }}
                          className={`w-full p-3 font-bold cursor-pointer ${inputStyle}`}
                        >
                          {Object.keys(TAIWAN_LOCATIONS).map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                          <option value="custom">📍 自訂地點 (手動輸入)</option>
                        </select>
                     </div>
                     <div>
                        <label className={`block text-sm font-bold mb-2 ${UI_THEME.TEXT_SECONDARY}`}>地點搜尋 / 行政區</label>
                        {weatherConfig.city === 'custom' ? (
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={weatherConfig.district}
                                    onChange={(e) => setWeatherConfig({ ...weatherConfig, district: e.target.value })}
                                    placeholder="輸入地點 (如: 阿里山)"
                                    className={`flex-1 p-3 font-bold ${inputStyle}`}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                                />
                                <button 
                                    onClick={handleSearchLocation}
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors"
                                >
                                    搜尋
                                </button>
                            </div>
                        ) : (
                            <select 
                              value={weatherConfig.district} 
                              onChange={(e) => {
                                 const newDistName = e.target.value;
                                 const distData = TAIWAN_LOCATIONS[weatherConfig.city].find(d => d.name === newDistName);
                                 setWeatherConfig({
                                   ...weatherConfig,
                                   district: newDistName,
                                   lat: distData.lat,
                                   lon: distData.lon
                                 });
                              }}
                              className={`w-full p-3 font-bold cursor-pointer ${inputStyle}`}
                            >
                              {TAIWAN_LOCATIONS[weatherConfig.city]?.map(dist => (
                                <option key={dist.name} value={dist.name}>{dist.name}</option>
                              ))}
                            </select>
                        )}
                     </div>
                   </div>

                   <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-4"></div>

                   {/* 2. 精準座標區域 */}
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-bold mb-2 ${UI_THEME.TEXT_SECONDARY}`}>緯度 (Latitude)</label>
                        <input 
                            type="number" 
                            step="0.0001"
                            value={weatherConfig.lat}
                            onChange={(e) => setWeatherConfig({ ...weatherConfig, lat: parseFloat(e.target.value) })}
                            className={`w-full p-3 font-mono font-bold ${inputStyle}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-bold mb-2 ${UI_THEME.TEXT_SECONDARY}`}>經度 (Longitude)</label>
                        <input 
                            type="number" 
                            step="0.0001"
                            value={weatherConfig.lon}
                            onChange={(e) => setWeatherConfig({ ...weatherConfig, lon: parseFloat(e.target.value) })}
                            className={`w-full p-3 font-mono font-bold ${inputStyle}`}
                        />
                      </div>
                   </div>

                   <div className={`mt-4 text-xs flex items-center gap-2 ${UI_THEME.TEXT_MUTED} bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800`}>
                      <MapPin size={14} />
                      <span>
                        提示：您可以透過 Google Maps 右鍵點選地點來取得精準座標。選單僅供快速填入，實際天氣將依據下方座標抓取。
                      </span>
                   </div>
               </div>
             </div>
          </SettingsSection>


          <SettingsSection 
            title="系統維護" 
            icon={Save} 
            theme="gray"
            isOpen={expandedSections['maintenance']} 
            onToggle={() => toggleSection('maintenance')}
          >
             <div className="space-y-6">
                <div className={`p-6 rounded-2xl flex gap-6 items-center flex-wrap ${UI_THEME.BACKGROUND}`}>
                     <span className={`font-bold ${UI_THEME.TEXT_PRIMARY} flex items-center gap-2`}><Clock size={16}/> 時間模擬：</span>
                     <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className={`p-2 w-32 ${inputStyle}`}><option value="">(原星期)</option>{WEEKDAYS.map((d,i)=><option key={i} value={i}>週{d}</option>)}</select>
                     
                     <input 
                        type="time"
                        value={tempTime}
                        onChange={(e) => setTempTime(e.target.value)}
                        className={`p-2 font-bold ${inputStyle}`}
                     />
                     
                     <div className="flex gap-2">
                        <button onClick={applyTimeChange} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md shadow-blue-500/20 transition-all">套用模擬</button>
                        <button onClick={() => {setTimeOffset(0); setIsManualEco(false); setIsAutoEcoOverride(true);}} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-600 dark:text-slate-200 rounded-lg font-bold transition-all">重置時間</button>
                     </div>
                </div>
				<button 
                    onClick={() => setIsBackupOpen(true)} 
                    className="w-full py-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2 font-bold text-slate-600 dark:text-slate-300 shadow-sm"
                >
                    <Download size={20} /> 開啟系統資料中樞 (備份/還原)
                </button>
             </div>
          </SettingsSection>

        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex justify-end gap-4 shrink-0 backdrop-blur-md bg-white/50 dark:bg-slate-900/50 ${UI_THEME.BORDER_LIGHT}`}>
          <button 
            onClick={() => {
              if(confirm('重置將恢復到最初的預設狀態，確定嗎？')) {
                 setTimeSlots(defaultValues.TIME_SLOTS);
                 setSchedule(defaultValues.SCHEDULE);
                 setSubjectHints(defaultValues.SUBJECT_HINTS);
                 setDayTypes(defaultValues.DAY_TYPES);
                 setTimeOffset(0);
                 setIsManualEco(false);
                 setIsAutoEcoOverride(false);
                 setIs24Hour(true);
                 const allIds = [
                    ...systemButtonsConfig.singles.map(b => b.id),
                    ...systemButtonsConfig.groups.flatMap(g => g.items.map(b => b.id))
                 ];
                 setVisibleButtons(allIds);
              }
            }}
            className="px-6 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-2 font-bold transition-colors"
          >
            <RefreshCw size={18}/> 重置預設
          </button>
          <button 
            onClick={onClose}
            className="px-10 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl transition-all font-bold flex items-center gap-2"
          >
            <Save size={18} /> 完成
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;