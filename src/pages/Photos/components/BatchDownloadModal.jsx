import React, { useState, useCallback } from 'react';
import { Download, X, CheckSquare, Square, Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { UI_THEME } from '../../../constants';

/**
 * BatchDownloadModal — 批次下載相片
 *
 * ⚠️ 說明：Google Drive 的下載端點不允許瀏覽器跨域 fetch()（CORS）。
 * 因此改採「逐一觸發 <a> 原生下載」方案：
 * - 每張照片各自觸發一次瀏覽器下載對話框
 * - 每次間隔 800ms 避免被瀏覽器的彈出視窗攔截機制封鎖
 * - 不打包 ZIP，但確保所有照片都能正常下載
 *
 * @param {boolean}  isOpen        - 是否顯示
 * @param {Function} onClose       - 關閉回調
 * @param {Array}    photos        - 照片陣列（含 id, name）
 * @param {string}   albumTitle    - 相簿名稱（用於提示文字）
 */
export default function BatchDownloadModal({ isOpen, onClose, photos = [], albumTitle = '相簿' }) {
  const [selectedIds, setSelectedIds]     = useState(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress]           = useState({ current: 0, total: 0 });
  const [status, setStatus]               = useState('idle'); // 'idle' | 'downloading' | 'done' | 'error'
  const [errorMsg, setErrorMsg]           = useState('');

  const allSelected = photos.length > 0 && selectedIds.size === photos.length;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(photos.map((p) => p.id)));
  };

  // 逐一用 <a> 原生下載，繞過 CORS 限制
  const handleDownload = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const selectedPhotos = photos.filter((p) => selectedIds.has(p.id));
    setIsDownloading(true);
    setStatus('downloading');
    setProgress({ current: 0, total: selectedPhotos.length });
    setErrorMsg('');

    try {
      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        const link = document.createElement('a');
        link.href = `https://drive.google.com/uc?export=download&id=${photo.id}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setProgress({ current: i + 1, total: selectedPhotos.length });
        // 每次間隔 800ms，避免瀏覽器攔截多個彈出視窗
        if (i < selectedPhotos.length - 1) {
          await new Promise((r) => setTimeout(r, 800));
        }
      }
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedIds, photos]);

  const handleClose = () => {
    if (isDownloading) return;
    setSelectedIds(new Set());
    setStatus('idle');
    setErrorMsg('');
    setProgress({ current: 0, total: 0 });
    onClose();
  };

  // 所有 Hook 已宣告完成，才做 early return
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-lg rounded-2xl ${UI_THEME.SURFACE_MAIN} shadow-2xl border ${UI_THEME.BORDER_DEFAULT} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${UI_THEME.BORDER_DEFAULT}`}>
          <div className="flex items-center gap-2">
            <Download size={18} className="text-blue-500" />
            <h2 className={`font-bold text-base ${UI_THEME.TEXT_PRIMARY}`}>批次下載</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
              {photos.length} 張
            </span>
          </div>
          <button onClick={handleClose} disabled={isDownloading} className={`p-1.5 rounded-lg ${UI_THEME.BTN_GHOST} disabled:opacity-40`}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {status === 'done' ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle size={48} className="text-emerald-500" />
              <p className={`font-bold text-lg ${UI_THEME.TEXT_PRIMARY}`}>下載完成！</p>
              <p className={`text-sm ${UI_THEME.TEXT_MUTED}`}>已觸發 {progress.total} 張照片的下載，請確認瀏覽器的下載資料夾。</p>
              <button onClick={handleClose} className="mt-2 px-6 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors">
                關閉
              </button>
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <AlertTriangle size={48} className="text-rose-500" />
              <p className={`font-bold ${UI_THEME.TEXT_PRIMARY}`}>下載失敗</p>
              <p className="text-sm text-rose-500 text-center max-w-xs">{errorMsg}</p>
              <button onClick={() => setStatus('idle')} className="mt-2 px-6 py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors">
                重試
              </button>
            </div>
          ) : status === 'downloading' ? (
            <div className="flex flex-col items-center py-8 gap-4">
              <Loader2 size={40} className="text-blue-500 animate-spin" />
              <p className={`font-bold ${UI_THEME.TEXT_PRIMARY}`}>正在觸發下載...</p>
              <p className={`text-sm ${UI_THEME.TEXT_MUTED}`}>{progress.current} / {progress.total} 張</p>
              <div className="w-full bg-stone-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className={`text-xs ${UI_THEME.TEXT_MUTED} text-center`}>
                照片將在瀏覽器中逐一下載，請勿關閉此視窗
              </p>
            </div>
          ) : (
            <>
              {/* 說明提示 */}
              <div className={`flex items-start gap-2 p-3 mb-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs`}>
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>照片將逐一開啟瀏覽器下載，請允許瀏覽器顯示多個下載視窗。</span>
              </div>

              {/* 全選控制列 */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={toggleAll}
                  className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${
                    allSelected
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300'
                      : `${UI_THEME.TEXT_MUTED} hover:bg-stone-100 dark:hover:bg-zinc-700`
                  }`}
                >
                  {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  {allSelected ? '取消全選' : '全選'}
                </button>
                <span className={`text-sm ${UI_THEME.TEXT_MUTED}`}>已選 {selectedIds.size} 張</span>
              </div>

              {/* 照片縮圖網格 */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto rounded-xl p-1">
                {photos.map((photo) => {
                  const thumbUrl = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w100`;
                  const selected = selectedIds.has(photo.id);
                  return (
                    <button
                      key={photo.id}
                      onClick={() => toggleSelect(photo.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden transition-all duration-200 ${
                        selected ? 'ring-2 ring-blue-500 ring-offset-1 scale-95' : 'hover:opacity-80'
                      }`}
                    >
                      <img src={thumbUrl} alt={photo.name} className="w-full h-full object-cover" />
                      {selected && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <CheckSquare size={16} className="text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {status === 'idle' && (
          <div className={`px-5 py-4 border-t ${UI_THEME.BORDER_DEFAULT} flex justify-end gap-2`}>
            <button onClick={handleClose} className={`px-4 py-2 rounded-xl text-sm font-bold ${UI_THEME.BTN_GHOST}`}>
              取消
            </button>
            <button
              onClick={handleDownload}
              disabled={selectedIds.size === 0}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedIds.size > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                  : 'bg-stone-200 text-stone-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
              }`}
            >
              <Download size={16} />
              下載 {selectedIds.size} 張
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
