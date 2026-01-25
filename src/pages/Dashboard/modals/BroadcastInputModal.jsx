import React, { useState, useEffect } from 'react';
import { 
  Megaphone, X, Edit3, Volume2, PanelTop, Monitor, Save, Play,
  Users, BookOpen, Eye, Bell, MessageSquare, Star, Heart, AlertTriangle, Info, Zap
} from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';

// 可選圖示清單
const ICON_OPTIONS = [
  { id: 'Megaphone', icon: Megaphone, label: '廣播' },
  { id: 'Users', icon: Users, label: '集合' },
  { id: 'BookOpen', icon: BookOpen, label: '閱讀' },
  { id: 'Eye', icon: Eye, label: '護眼' },
  { id: 'Bell', icon: Bell, label: '鐘聲' },
  { id: 'MessageSquare', icon: MessageSquare, label: '訊息' },
  { id: 'AlertTriangle', icon: AlertTriangle, label: '注意' },
  { id: 'Info', icon: Info, label: '資訊' },
  { id: 'Star', icon: Star, label: '獎勵' },
  { id: 'Heart', icon: Heart, label: '關懷' },
  { id: 'Zap', icon: Zap, label: '快訊' },
];

// 可選顏色主題 (對應 constants 的配色)
const COLOR_OPTIONS = [
  { id: 'pink', value: 'from-pink-500 to-rose-500', label: '粉紅 (預設)' },
  { id: 'blue', value: 'from-blue-500 to-cyan-500', label: '天藍 (作息)' },
  { id: 'purple', value: 'from-purple-500 to-violet-500', label: '紫色 (閱讀)' },
  { id: 'green', value: 'from-green-500 to-emerald-500', label: '翠綠 (護眼)' },
  { id: 'orange', value: 'from-orange-500 to-amber-500', label: '橘黃 (用餐)' },
  { id: 'slate', value: 'from-slate-500 to-slate-700', label: '灰黑 (安靜)' },
  { id: 'red', value: 'from-red-500 to-red-700', label: '鮮紅 (緊急)' },
];

const BroadcastInputModal = ({ isOpen, onClose, onConfirm, customPresets, setCustomPresets }) => {
  const [activeTabId, setActiveTabId] = useState(1);
  
  // 編輯中的暫存狀態
  const [editingData, setEditingData] = useState({
    name: '', title: '', sub: '', 
    mode: 'fullscreen', enableTTS: false,
    color: 'from-pink-500 to-rose-500', icon: 'Megaphone'
  });
  
  const [isEditingName, setIsEditingName] = useState(false);

  // 當打開或切換 Tab 時，載入該 Preset 的資料
  useEffect(() => {
    if (isOpen) {
      const preset = customPresets.find(p => p.id === activeTabId);
      if (preset) {
        setEditingData({
          name: preset.name,
          title: preset.title,
          sub: preset.sub,
          mode: preset.mode || 'fullscreen',
          enableTTS: preset.enableTTS || false,
          color: preset.color || 'from-pink-500 to-rose-500',
          icon: preset.icon || 'Megaphone'
        });
      }
    }
  }, [isOpen, activeTabId, customPresets]);

  // 儲存設定 (更新 customPresets)
  const handleSave = () => {
    const newPresets = customPresets.map(p => 
      p.id === activeTabId 
        ? { ...p, ...editingData } 
        : p
    );
    setCustomPresets(newPresets);
    return newPresets; // 回傳最新的 presets 供後續使用
  };

  // 僅儲存並關閉
  const handleSaveAndClose = () => {
    handleSave();
    onClose();
  };

  // 儲存並立即發布
	const handlePublish = () => {
    handleSave(); // 先儲存到清單
    
    // 呼叫上層的發布函式，並帶入完整的顏色與圖示資訊
    onConfirm(editingData.title, editingData.sub, { 
      mode: editingData.mode, 
      enableTTS: editingData.enableTTS,
      color: editingData.color, // ✅ 新增：傳遞顏色
      icon: editingData.icon    // ✅ 新增：傳遞圖示 ID
    });
    
    onClose(); 
  };

  if (!isOpen) return null;

  // 取得當前選到的 Icon 元件 (用於預覽)
  const CurrentIcon = ICON_OPTIONS.find(i => i.id === editingData.icon)?.icon || Megaphone;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${editingData.color} text-white shadow-sm`}>
                  <CurrentIcon size={20} />
                </div>
                自訂按鈕設定中心
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full transition-colors">
                <X size={20}/>
            </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
            {/* 左側：按鈕選擇清單 */}
            <div className="w-48 bg-slate-50 dark:bg-slate-800/30 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">選擇按鈕</span>
                {customPresets.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => setActiveTabId(preset.id)}
                        className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${
                            activeTabId === preset.id 
                            ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-md ring-1 ring-slate-200 dark:ring-slate-600' 
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span className={`w-2 h-8 rounded-full bg-gradient-to-b ${preset.color} shrink-0`}></span>
                        <div className="flex flex-col truncate">
                            <span>{preset.name}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* 右側：編輯區域 */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                
                {/* 1. 基本資訊 (按鈕名稱、標題、副標題) */}
                <div className="space-y-4 mb-6">
                    {/* 按鈕顯示名稱 */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                             <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">按鈕選單名稱</label>
                             <span className="text-[10px] text-slate-400">顯示在快速選單上的文字</span>
                        </div>
                        <input 
                            value={editingData.name}
                            onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                            className="w-full p-2 text-sm font-bold border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none text-slate-700 dark:text-slate-200"
                            placeholder="例如：收實驗器材"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">廣播主標題</label>
                            <input 
                                value={editingData.title}
                                onChange={(e) => setEditingData({ ...editingData, title: e.target.value })}
                                className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:border-pink-500 dark:focus:border-pink-500 focus:outline-none text-lg font-bold text-slate-800 dark:text-white transition-colors"
                                placeholder="例如：全班集合"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">副標題</label>
                            <input 
                                value={editingData.sub}
                                onChange={(e) => setEditingData({ ...editingData, sub: e.target.value })}
                                className="w-full p-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:border-pink-500 dark:focus:border-pink-500 focus:outline-none text-slate-800 dark:text-white transition-colors"
                                placeholder="例如：請帶水壺至走廊"
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-6"></div>

                {/* 2. 外觀樣式 (圖示與顏色) */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3">按鈕外觀風格</label>
                    
                    {/* 顏色選擇 */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                        {COLOR_OPTIONS.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setEditingData({ ...editingData, color: c.value })}
                                className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.value} transition-transform hover:scale-110 shrink-0 ${
                                    editingData.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                                }`}
                                title={c.label}
                            />
                        ))}
                    </div>

                    {/* 圖示選擇 */}
                    <div className="grid grid-cols-6 gap-2">
                        {ICON_OPTIONS.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setEditingData({ ...editingData, icon: item.id })}
                                className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                                    editingData.icon === item.id 
                                    ? 'bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20' 
                                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                                title={item.label}
                            >
                                <item.icon size={20} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-6"></div>

                {/* 3. 廣播行為 (模式與TTS) */}
                <div>
                     <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3">廣播行為設定</label>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800 p-1 rounded-xl flex border border-slate-200 dark:border-slate-700">
                            <button 
                                onClick={() => setEditingData({ ...editingData, mode: 'fullscreen' })}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                                    editingData.mode === 'fullscreen' 
                                    ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                                <Monitor size={16}/> 全螢幕
                            </button>
                            <button 
                                onClick={() => setEditingData({ ...editingData, mode: 'marquee' })}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                                    editingData.mode === 'marquee' 
                                    ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                            >
                                <PanelTop size={16}/> 跑馬燈
                            </button>
                        </div>

                        <button 
                            onClick={() => setEditingData({ ...editingData, enableTTS: !editingData.enableTTS })}
                            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold border transition-all ${
                                editingData.enableTTS 
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <Volume2 size={18} className={editingData.enableTTS ? 'animate-pulse' : ''} />
                            {editingData.enableTTS ? '自動朗讀：開' : '自動朗讀：關'}
                        </button>
                     </div>
                </div>

            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
            <button 
                onClick={handleSaveAndClose}
                className="px-5 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
                <Save size={18} />
                僅儲存設定
            </button>
            <button 
                onClick={handlePublish}
                disabled={!editingData.title}
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                <Play size={18} fill="currentColor" />
                儲存並立即發布
            </button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastInputModal;