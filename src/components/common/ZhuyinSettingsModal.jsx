import React, { useState } from 'react';
import { 
  X, Type, Download, CheckCircle2, AlertCircle, Book, Power, Settings2
} from 'lucide-react';
import { UI_THEME } from '../../utils/constants';
import { useOS } from '../../context/OSContext';
import ZhuyinCustomizer from './ZhuyinCustomizer';

const ZhuyinSettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('custom'); // 預設顯示自訂，因為開關已經拉到外面了
  const { isGlobalZhuyin, setIsGlobalZhuyin, fontInstalled } = useOS();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        // 1. 調整寬度至 2xl (更寬)，高度固定 650px (更高)
        className={`${UI_THEME.SURFACE_GLASS} w-full max-w-2xl h-[650px] flex flex-col rounded-2xl shadow-2xl border ${UI_THEME.BORDER_DEFAULT} overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* --- Header --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Type size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className={`font-bold text-xl ${UI_THEME.TEXT_PRIMARY}`}>注音系統設定</h3>
              <p className={`text-xs ${UI_THEME.TEXT_SECONDARY}`}>Global Zhuyin System</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${UI_THEME.TEXT_SECONDARY}`}
          >
            <X size={24} />
          </button>
        </div>

        {/* --- Master Switch Area (獨立的最上方區塊) --- */}
        <div className="px-6 py-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setIsGlobalZhuyin(!isGlobalZhuyin)}
            className={`w-full group relative overflow-hidden rounded-xl p-4 transition-all duration-300 border ${
              isGlobalZhuyin 
                ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20' 
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full transition-colors ${
                  isGlobalZhuyin ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                }`}>
                  <Power size={24} strokeWidth={3} />
                </div>
                <div className="text-left">
                  <div className={`font-bold text-lg ${isGlobalZhuyin ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {isGlobalZhuyin ? '注音模式：已開啟' : '注音模式：已關閉'}
                  </div>
                  <div className={`text-xs ${isGlobalZhuyin ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {isGlobalZhuyin ? '全系統將顯示國字注音輔助' : '點擊以啟用全域注音顯示'}
                  </div>
                </div>
              </div>

              {/* Toggle Visual */}
              <div className={`w-14 h-7 rounded-full transition-colors duration-300 flex items-center p-1 ${
                isGlobalZhuyin ? 'bg-black/30' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  isGlobalZhuyin ? 'translate-x-7' : 'translate-x-0'
                }`} />
              </div>
            </div>
          </button>
        </div>

        {/* --- Main Content Area --- */}
        <div className="flex flex-1 min-h-0"> {/* min-h-0 確保 flex 子元素滾動正常 */}
          
          {/* Sidebar Navigation (左側分頁) */}
          <div className="w-48 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col p-2 gap-1">
            <NavButton 
              active={activeTab === 'custom'} 
              onClick={() => setActiveTab('custom')}
              icon={<Book size={18}/>}
              label="自訂破音字"
              desc="校正與擴充字典"
            />
            <NavButton 
              active={activeTab === 'system'} 
              onClick={() => setActiveTab('system')}
              icon={<Settings2 size={18}/>}
              label="字型資源"
              desc="檢查字型安裝狀態"
              alert={!fontInstalled} // 如果沒裝字型，顯示紅點
            />
          </div>

          {/* Right Content (右側內容) */}
          <div className="flex-1 overflow-hidden relative bg-white dark:bg-slate-900">
            
            {/* Tab: Custom Dictionary */}
            {activeTab === 'custom' && (
              <div className="h-full overflow-hidden p-6">
                 {/* 傳遞高度資訊給 Customizer 讓它撐滿 */}
                 <ZhuyinCustomizer />
              </div>
            )}

            {/* Tab: System Resources */}
            {activeTab === 'system' && (
              <div className="h-full overflow-y-auto p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="max-w-md mx-auto space-y-8">
                  
                  {/* 字型狀態卡片 */}
                  <div className="text-center space-y-2">
                    <div className={`inline-flex p-4 rounded-full mb-2 ${
                      fontInstalled ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {fontInstalled ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 dark:text-white">
                      {fontInstalled ? '字型運作正常' : '建議安裝字型'}
                    </h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {fontInstalled 
                        ? '系統已偵測到「源泉注音圓體」，將提供最佳的閱讀體驗與渲染效能。' 
                        : '目前使用網頁暫存字型，可能會導致載入較慢或顯示不完美。建議下載並安裝至電腦。'}
                    </p>
                  </div>

                  {/* 下載按鈕 */}
                  {!fontInstalled && (
                    <button 
                      onClick={() => window.open('/fonts/BpmfGenSenRounded-R.ttf', '_blank')}
                      className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <Download size={20} />
                      下載字型安裝檔 (.ttf)
                    </button>
                  )}

                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-400 leading-relaxed">
                    <p className="font-bold mb-1">關於字型權限：</p>
                    本系統採用開源專案「源泉注音圓體」 (BpmfGenSenRounded)，感謝 But Ko 開發貢獻。此字型採用 SIL Open Font License 1.1 授權，可自由商用與改作。
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// 輔助元件：側邊欄按鈕
const NavButton = ({ active, onClick, icon, label, desc, alert }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 relative ${
      active 
        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
    }`}
  >
    <div className={`shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
      {icon}
    </div>
    <div>
      <div className={`font-bold text-sm ${active ? 'text-slate-900 dark:text-white' : ''}`}>{label}</div>
      <div className="text-[10px] opacity-70">{desc}</div>
    </div>
    {alert && (
      <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
    )}
  </button>
);

export default ZhuyinSettingsModal;