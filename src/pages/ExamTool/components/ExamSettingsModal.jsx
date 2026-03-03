import React, { useState } from 'react';
import { X, Plus, Trash2, Mic, Calendar, Volume2, MessageSquare, Save, Upload, Edit3 } from 'lucide-react';
import { STANDARD_TIME_SLOTS, UI_THEME } from  '../../../constants';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
      active 
        ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
        : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
    }`}
  >
    {children}
  </button>
);

const ExamSettingsModal = ({ 
  isOpen, onClose, 
  schedule, setSchedule, 
  ttsRules, setTtsRules,
  announcements, setAnnouncements,
  uploadAudio, removeAudio, audioFiles
}) => {
  const [activeTab, setActiveTab] = useState('schedule');

  if (!isOpen) return null;

  // --- 排程邏輯 ---
  const addSlot = (template = null) => {
    const newSlot = template ? { ...template } : {
      id: Date.now().toString(), name: '新考科', start: '08:00', end: '09:00', type: 'class'
    };
    newSlot.id = Date.now().toString() + Math.random();
    setSchedule(prev => [...prev, newSlot].sort((a, b) => a.start.localeCompare(b.start)));
  };
  const updateSlot = (id, field, value) => setSchedule(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  const removeSlot = (id) => setSchedule(prev => prev.filter(s => s.id !== id));

// --- 邏輯：TTS 規則編輯 ---
  const addRule = () => {
    setTtsRules(prev => [...prev, {
      id: Date.now().toString(),
      triggerAt: 60,
      text: '請注意時間',
	  type: 'exam',
      enabled: true
    }]);
  };

  const updateRule = (id, field, value) => {
    setTtsRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRule = (id) => {
    setTtsRules(prev => prev.filter(r => r.id !== id));
  };

  // --- 音檔上傳 ---
  const handleFileChange = (e, slotId) => {
    const file = e.target.files[0];
    if (file) uploadAudio(slotId, file);
  };

  // --- 公告邏輯 ---
  const handleAnnounceChange = (type, index, value) => {
    const newArr = [...announcements[type]];
    newArr[index] = value;
    setAnnouncements(prev => ({ ...prev, [type]: newArr }));
  };
  const addAnnounce = (type) => {
    setAnnouncements(prev => ({ ...prev, [type]: [...prev[type], ''] }));
  };
  const removeAnnounce = (type, index) => {
    setAnnouncements(prev => ({ ...prev, [type]: prev[type].filter((_, i) => i !== index) }));
  };
  const PRESETS = {
    exam: ['手機關機', '寫上班級姓名', '保持安靜', '桌面淨空', '檢查考卷', '有問題請舉手'],
    break: ['喝水上廁所', '準備好考試用品', '靜心複習', '提早回教室'],
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${UI_THEME.SURFACE_MAIN}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            考場設定
          </h2>
          <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')}><Calendar size={16}/> 考程與音檔</TabButton>
          <TabButton active={activeTab === 'announcement'} onClick={() => setActiveTab('announcement')}><MessageSquare size={16}/> 文字輪播</TabButton>
          <TabButton active={activeTab === 'tts'} onClick={() => setActiveTab('tts')}><Mic size={16}/> 語音腳本</TabButton>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950/50">
          
          {/* TAB 1: 排程 & 音檔 */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {/* Quick Import */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase">快速匯入</h3>
                <div className="flex flex-wrap gap-2">
                  {STANDARD_TIME_SLOTS.map(t => (
                    <button key={t.id} onClick={() => addSlot(t)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
                      + {t.name}
                    </button>
                  ))}
                </div>
              </div>

{/* Slots List */}
              <div className="space-y-3">
                {schedule.map((slot, index) => (
                  <div key={slot.id} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                    
                    <div className="w-6 text-center text-sm font-bold text-slate-400 hidden md:block">{index + 1}</div>
                    
                    {/* ★ 1. 修改：帶有編輯提示的考科名稱欄位 */}
                    <div className="relative group flex-1 min-w-[120px]">
                      <input 
                        value={slot.name} 
                        onChange={(e) => updateSlot(slot.id, 'name', e.target.value)} 
                        placeholder="輸入考科名稱..."
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 font-bold text-slate-800 dark:text-white rounded-lg px-3 py-2 outline-none transition-all placeholder:font-normal" 
                        title="點擊修改考科名稱"
                      />
                      <Edit3 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                    </div>
                    
                    {/* ★ 2. 修改：加大的時間設定區塊 */}
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 shrink-0">
                      <input 
                        type="time" 
                        value={slot.start} 
                        onChange={(e) => updateSlot(slot.id, 'start', e.target.value)} 
                        className="bg-transparent text-sm md:text-base font-mono font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer w-[115px] md:w-[125px]"
                      />
                      <span className="text-slate-300 font-bold">-</span>
                      <input 
                        type="time" 
                        value={slot.end} 
                        onChange={(e) => updateSlot(slot.id, 'end', e.target.value)} 
                        className="bg-transparent text-sm md:text-base font-mono font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer w-[115px] md:w-[125px]"
                      />
                    </div>

                    <select value={slot.type} onChange={(e) => updateSlot(slot.id, 'type', e.target.value)} className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 outline-none cursor-pointer border border-transparent hover:border-slate-300">
                      <option value="class">考試</option>
                      <option value="break">休息</option>
                    </select>

                    {/* ★ 3. 修改：音檔上傳與一鍵刪除 */}
                    <div className="flex items-center gap-1 md:border-l md:border-slate-200 dark:border-slate-700 md:pl-3 w-full justify-end md:w-auto mt-2 md:mt-0 shrink-0">
                      <input type="file" accept="audio/*" id={`audio-${slot.id}`} className="hidden" onChange={(e) => handleFileChange(e, slot.id)} />
                      
                      <label 
                        htmlFor={`audio-${slot.id}`} 
                        className={`p-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1 ${audioFiles[slot.id] ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-500'}`} 
                        title={audioFiles[slot.id] ? "重新上傳" : "上傳聽力音檔"}
                      >
                        <Upload size={18} />
                        {!audioFiles[slot.id] && <span className="text-xs font-bold md:hidden">上傳音檔</span>}
                      </label>
                      
                      {/* 如果有音檔，顯示刪除按鈕 */}
                      {audioFiles[slot.id] && (
                        <button 
                          onClick={() => removeAudio(slot.id)}
                          className="p-2 rounded-lg text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 transition-colors"
                          title="刪除音檔"
                        >
                          <X size={18} />
                        </button>
                      )}

                      <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                      <button onClick={() => removeSlot(slot.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="刪除此時段">
                        <Trash2 size={18}/>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: 文字輪播 */}
          {activeTab === 'announcement' && (
            <div className="grid md:grid-cols-2 gap-6">
              {['exam', 'break'].map(type => (
                <div key={type} className="space-y-4">
                  <div className="flex justify-between items-center">
                     <h3 className="font-bold text-lg text-slate-700 dark:text-white capitalize">{type === 'exam' ? '🔴 考試中' : '🟢 下課中'} 輪播</h3>
                     <button onClick={() => addAnnounce(type)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-100">+ 新增</button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    {PRESETS[type].map(text => (
                      <button key={text} onClick={() => setAnnouncements(p => ({...p, [type]: [...p[type], text]}))} className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded hover:bg-slate-300">
                        {text}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {announcements[type].map((text, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          value={text} 
                          onChange={(e) => handleAnnounceChange(type, idx, e.target.value)}
                          className="flex-1 p-2 rounded border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800"
                        />
                        <button onClick={() => removeAnnounce(type, idx)} className="text-slate-300 hover:text-red-500"><X size={16}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: TTS (保持原樣，略) */}
          {activeTab === 'tts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                 <p className="text-sm text-slate-500">當剩餘時間符合條件時，系統將自動朗讀文字。</p>
                 <button onClick={addRule} className="flex items-center gap-1 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                   <Plus size={16}/> 新增規則
                 </button>
              </div>

              <div className="space-y-3">
                {ttsRules.map((rule) => (
                  <div key={rule.id} className={`flex gap-4 p-4 rounded-xl border ${rule.enabled ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 opacity-60'}`}>
                    
                    {/* [新增] 類型切換按鈕 */}
                    <div className="flex flex-col gap-1 w-24 shrink-0">
                        <label className="text-xs font-bold text-slate-400 uppercase">適用時段</label>
                        <button 
                            onClick={() => updateRule(rule.id, 'type', rule.type === 'break' ? 'exam' : 'break')}
                            className={`flex-1 rounded-lg font-bold text-xs transition-colors border ${
                                (rule.type || 'exam') === 'exam' 
                                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                                : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                            }`}
                        >
                            {(rule.type || 'exam') === 'exam' ? '🔴 考試中' : '🟢 下課/考前'}
                        </button>
                    </div>
                    
                    {/* Trigger Condition */}
                    <div className="flex flex-col gap-1 w-32 shrink-0">
                      <label className="text-xs font-bold text-slate-400 uppercase">剩餘秒數</label>
                      <input 
                        type="number" 
                        value={rule.triggerAt}
                        onChange={(e) => updateRule(rule.id, 'triggerAt', parseInt(e.target.value))}
                        className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 font-mono text-center font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs text-center text-slate-400">
                        ({Math.floor(rule.triggerAt / 60)}分 {rule.triggerAt % 60}秒)
                      </span>
                    </div>

                    {/* Script Content */}
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">朗讀內容</label>
                      <input 
                        type="text" 
                        value={rule.text}
                        onChange={(e) => updateRule(rule.id, 'text', e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col justify-center gap-2 border-l border-slate-100 dark:border-slate-700 pl-4">
                       <button 
                         onClick={() => updateRule(rule.id, 'enabled', !rule.enabled)}
                         className={`text-xs font-bold px-2 py-1 rounded ${rule.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}
                       >
                         {rule.enabled ? '啟用' : '停用'}
                       </button>
                       <button onClick={() => removeRule(rule.id)} className="text-slate-300 hover:text-red-500 self-center">
                         <Trash2 size={16}/>
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between">
           <div className="flex items-center gap-2">
             <input type="checkbox" checked={announcements.active} onChange={(e) => setAnnouncements(p => ({...p, active: e.target.checked}))} id="ticker-active" className="w-4 h-4"/>
             <label htmlFor="ticker-active" className="text-sm font-bold text-slate-600 dark:text-slate-300">啟用上方文字輪播</label>
           </div>
           <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700">儲存</button>
        </div>
      </div>
    </div>
  );
};

export default ExamSettingsModal;