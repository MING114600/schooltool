import React, { useState } from 'react';
import { X, QrCode, Link as LinkIcon, Check, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PhotosShareModal = ({ isOpen, onClose, shareId, albumTitle, isMultiShare = false }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !shareId) return null;

  // --- 連結生成邏輯 (支援 GAS 橋接) ---
  const proxyUrl = import.meta.env.VITE_SHARE_PROXY_URL; // e.g. https://script.google.com/.../exec
  const queryParam = isMultiShare ? `albums=${shareId}` : `album=${shareId}`;

  // 如果有設定代理 URL，則優先使用代理連結（為了動態 OG Meta）
  // 否則使用目前的 window.location.origin
  const shareUrl = proxyUrl 
    ? `${proxyUrl}${proxyUrl.includes('?') ? '&' : '?'}${queryParam}`
    : `${window.location.origin}${window.location.pathname}?app=photos&${queryParam}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col items-center p-8 relative" onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
          <X size={20} />
        </button>

        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
          <QrCode size={32} />
        </div>

        <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-1 text-center">
          相簿分享連結已產生
        </h3>
        
        {proxyUrl && (
          <div className="mb-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded uppercase tracking-wider">
            已啟用動態預覽代理
          </div>
        )}

        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 text-center line-clamp-2 px-4">
          {albumTitle}
        </p>

        {/* QR Code 顯示區 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-slate-100 mb-6 transition-transform hover:scale-105">
          <QRCodeSVG value={shareUrl} size={200} level="H" includeMargin={false} />
        </div>

        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 text-center px-6">
          {proxyUrl 
            ? "此連結支援社群軟體動態預覽相簿名稱與縮圖" 
            : "請家長使用手機掃描上方行動條碼進入"}
        </p>

        {/* 網址複製區 */}
        <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex items-center gap-2">
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-mono text-slate-500 truncate px-2 select-all">
              {shareUrl}
            </p>
          </div>
          <button 
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'}`}
          >
            {copied ? <Check size={16} /> : <LinkIcon size={16} />}
            {copied ? '已複製' : '複製'}
          </button>
        </div>

        <a 
          href={shareUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-6 flex items-center gap-1.5 text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors"
        >
          <ExternalLink size={16} />
          在新分頁預覽測試
        </a>

      </div>
    </div>
  );
};

export default PhotosShareModal;
