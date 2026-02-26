import React, { useState, useEffect } from 'react';
import { 
  Mail, Link, Instagram, Coffee, X, QrCode, 
  Copy, Check, ArrowLeftToLine 
} from 'lucide-react';

// 輔助函式：處理靜態資源路徑
const getAssetPath = (path) => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}${cleanPath}`;
};

const AboutDevModal = ({ isOpen, onClose }) => {
  const [viewMode, setViewMode] = useState('info'); // 'info' | 'share'
  const [avatarError, setAvatarError] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // 鎖定背景捲動 + Esc 關閉
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalStyle;
        window.removeEventListener('keydown', handleKeyDown);
        setViewMode('info'); 
        setCopiedId(null);
      };
    }
  }, [isOpen, onClose]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (!isOpen) return null;

  const CONTACT_INFO = [
    { 
      id: 'email', 
      icon: Mail, 
      label: 'EMAIL', 
      value: 'apaul@g.lnps.tp.edu.tw', 
      link: 'mailto:apaul@g.lnps.tp.edu.tw',
      color: 'blue' 
    },
    { 
      id: 'website', 
      icon: Link, 
      label: 'WEBSITE', 
      value: '阿保老師的教室', 
      realValue: 'https://sites.google.com/g.lnps.tp.edu.tw/apaul-classroom/',
      link: 'https://sites.google.com/g.lnps.tp.edu.tw/apaul-classroom/',
      color: 'emerald' 
    },
    { 
      id: 'instagram', 
      icon: Instagram, 
      label: 'INSTAGRAM', 
      value: '@apaulliao', 
      realValue: 'https://www.instagram.com/apaulliao/',
      link: 'https://www.instagram.com/apaulliao/',
      color: 'rose' 
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="devcard-title"
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/20 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部裝飾背景 */}
        <div className={`h-24 bg-gradient-to-r transition-colors duration-500 ${
            viewMode === 'share' ? 'from-emerald-500 via-teal-500 to-cyan-500' :
            'from-indigo-500 via-purple-500 to-pink-500'
        }`}></div>
        
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="關閉名片"
        >
            <X size={16} />
        </button>

        <div className="px-8 pb-8 -mt-12 flex flex-col items-center">
            {/* 頭像 */}
            <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 p-1.5 shadow-xl z-10">
                <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden relative">
                    <span className="absolute text-3xl select-none">👨‍🏫</span> 
                    {!avatarError && (
                        <img 
                          src={getAssetPath('profile.jpg')} 
                          alt="阿保老師" 
                          className="relative w-full h-full object-cover z-10" 
                          onError={() => setAvatarError(true)} 
                        />
                    )}
                </div>
            </div>

            <h3 id="devcard-title" className="mt-4 text-2xl font-bold text-slate-800 dark:text-white">阿保老師</h3>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium transition-all min-h-[20px]">
                {viewMode === 'info' && "教育科技開發者 / 國小教師"}
                {viewMode === 'share' && "掃描 QR Code 分享給同事"}
            </p>

            <div className="w-full min-h-[180px] mt-4 flex flex-col justify-center">
                
                {/* 模式 1: 資訊列表 */}
                {viewMode === 'info' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {CONTACT_INFO.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors group">
                                <a 
                                    href={item.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex-1 flex items-center gap-3 no-underline"
                                >
                                    <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${
                                        item.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                                        item.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                                        'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                                    }`}>
                                        <item.icon size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</span>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[140px] sm:max-w-[160px]">
                                            {item.value}
                                        </span>
                                    </div>
                                </a>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(item.realValue || item.value, item.id);
                                    }}
                                    className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all"
                                    title="複製內容"
                                >
                                    {copiedId === item.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 模式 2: 分享 QR Code */}
                {viewMode === 'share' && (
                    <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border-2 border-slate-100 dark:border-slate-700">
                             {!qrError ? (
                                <img 
                                    src={getAssetPath('qrcode.png')} 
                                    alt="Share QR" 
                                    className="w-40 h-40 object-contain"
                                    onError={() => setQrError(true)}
                                />
                             ) : (
                                <div className="w-40 h-40 flex flex-col items-center justify-center bg-slate-50 rounded-xl text-slate-400 text-xs text-center p-2">
                                    <QrCode size={32} className="mb-2 opacity-50" />
                                    <span>圖片讀取失敗<br/>qrcode.png</span>
                                </div>
                             )}
                        </div>
                        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 text-center px-4 leading-relaxed">
                            讓更多老師一起使用<br/>智慧教室儀表板
                        </p>
                    </div>
                )}
            </div>

            {/* 底部按鈕區 */}
            <div className="w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                 
                 {/* 🌟 BMAC 贊助按鈕 (正式啟用) */}
                 <a 
                    href="https://buymeacoffee.com/apaulliao" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all active:scale-95 no-underline group"
                 >
                    <Coffee size={18} className="group-hover:animate-bounce" />
                    <span>請喝咖啡</span>
                 </a>
                 
                 {/* 分享按鈕 */}
                 <button 
                    onClick={() => setViewMode(viewMode === 'share' ? 'info' : 'share')}
                    className={`p-2.5 rounded-xl transition-colors border ${
                        viewMode === 'share' 
                        ? 'bg-indigo-100 text-indigo-600 border-indigo-200' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`} 
                    title={viewMode === 'share' ? "返回資訊" : "顯示分享 QR Code"}
                 >
                    {viewMode === 'share' ? <ArrowLeftToLine size={20} /> : <QrCode size={20} />}
                 </button>
            </div>

            <div className="mt-4 text-[10px] text-slate-400 dark:text-slate-500 text-center font-mono opacity-80">
                © 2026 Apaul Classroom. All rights reserved.
            </div>
        </div>
      </div>
    </div>
  );
};

export default AboutDevModal;