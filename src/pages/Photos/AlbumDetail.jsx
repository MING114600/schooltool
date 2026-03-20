import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, AlertTriangle, Images, Share2, RefreshCw } from 'lucide-react';
import { UI_THEME } from '../../constants';
import usePhotoStore from '../../store/usePhotoStore';
import { validatePublicFolder } from '../../services/googleDriveService';
import { useDrivePhotos } from './hooks/useDrivePhotos';
import PhotoGrid from './components/PhotoGrid';
import PhotosShareModal from './components/PhotosShareModal';
import DialogModal from '../../components/common/DialogModal';

/**
 * AlbumDetail — 相簿詳細頁
 *
 * 資料獲取邏輯已移至 useDrivePhotos Hook。
 * 相片網格已移至 PhotoGrid 元件（含漸進式載入、Layout Shift 防護）。
 */
export default function AlbumDetail({ folderId, onBack, isSharedView = false, user, login, isAuthLoading = false }) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  // ── Debug ──────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log('[Photos] AlbumDetail Debug:', { user: !!user, isAuthLoading, isSharedView });
  }, [user, isAuthLoading, isSharedView]);

  // ── Store (僅 UI 需要的部分) ───────────────────────────────────────────
  const managedAlbums      = usePhotoStore((s) => s.managedAlbums);
  const updateManagedAlbum = usePhotoStore((s) => s.updateManagedAlbum);

  const rootAlbumInfo = managedAlbums.find((a) => a.folderId === folderId);

  // ── Hook：資料獲取 + 快取 + 封面學習 ──────────────────────────────────
  const { cachedData, isLoading, error, isFetchingMore, progressLabel, handleForceRefresh } =
    useDrivePhotos(folderId, apiKey, rootAlbumInfo || {}, isSharedView);

  // ── Local UI States ────────────────────────────────────────────────────
  const [dynamicTitle, setDynamicTitle]   = useState(null);
  const [shareData, setShareData]         = useState({ isOpen: false, shareId: null, albumTitle: '', coverIndex: 0 });
  const [isScrolled, setIsScrolled]       = useState(false);
  const [isSelectMode, setIsSelectMode]   = useState(false);
  const [dialogConfig, setDialogConfig]   = useState({ isOpen: false, title: '', message: '', variant: 'info' });
  const scrollRef = useRef(null);

  const albumInfo = rootAlbumInfo || { title: dynamicTitle || `相簿 ${folderId}` };

  // ── 訪客/分享模式的動態資料夾名稱 ────────────────────────────────────
  useEffect(() => {
    if (!rootAlbumInfo && apiKey) {
      validatePublicFolder(folderId, apiKey)
        .then((res) => { if (res.isValid) setDynamicTitle(res.folderName); })
        .catch(() => {});
    }
  }, [folderId, apiKey, rootAlbumInfo]);

  // ── 動態分頁標題 ──────────────────────────────────────────────────────
  useEffect(() => {
    const originalTitle = document.title;
    if (albumInfo.title) document.title = `${albumInfo.title} - 班級相簿`;
    return () => { document.title = originalTitle; };
  }, [albumInfo.title]);

  // ── 滾動偵測（Sticky Header） ─────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setIsScrolled(el.scrollTop > 80);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // ── 設定封面 ──────────────────────────────────────────────────────────
  const handleSetCover = useCallback(async (photoId, photoThumbUrl) => {
    try {
      updateManagedAlbum(folderId, { coverId: photoId, coverImage: photoThumbUrl });
      setDialogConfig({
        isOpen: true,
        title: '封面設定成功',
        message: '已將此相片設為「此台裝置」的相簿封面！\n\n小提醒：若要在其他裝置看到此封面，請執行「全域備份與還原」。',
        variant: 'success',
      });
      setIsSelectMode(false);
    } catch (err) {
      setDialogConfig({ isOpen: true, title: '設定失敗', message: '原因：' + err.message, variant: 'danger' });
    }
  }, [folderId, updateManagedAlbum]);

  // ── 開啟分享 Modal ────────────────────────────────────────────────────
  const handleOpenShare = useCallback(() => {
    const photos = cachedData?.files || [];
    const sortedPhotos = [...photos].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const currentCoverId = albumInfo.coverId;
    let coverIndex = sortedPhotos.findIndex((p) => p.id === currentCoverId);

    if (coverIndex < 0) {
      const urlCoverIdx = new URLSearchParams(window.location.search).get('c');
      if (urlCoverIdx !== null && !isNaN(parseInt(urlCoverIdx))) {
        coverIndex = parseInt(urlCoverIdx);
      }
    }

    setShareData({
      isOpen: true,
      shareId: folderId,
      albumTitle: albumInfo.title,
      coverIndex: coverIndex >= 0 ? coverIndex : 0,
    });
  }, [cachedData, albumInfo, folderId]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">

      {/* ── Sticky Header（滾動後出現） ────────────────────────────────── */}
      <div className={`sticky top-0 z-30 transition-all duration-300 ${
        isScrolled
          ? `${UI_THEME.SURFACE_GLASS} shadow-md border-b ${UI_THEME.BORDER_DEFAULT} px-4 md:px-8 py-3 translate-y-0 opacity-100`
          : 'translate-y-[-10px] opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {onBack && (
              <button onClick={onBack} className={`p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${UI_THEME.TEXT_MUTED}`}>
                <ChevronLeft size={20} />
              </button>
            )}
            <span className={`font-bold text-base truncate ${UI_THEME.TEXT_PRIMARY}`}>{albumInfo.title}</span>
            <span className={`text-xs ${UI_THEME.TEXT_MUTED} hidden sm:inline`}>{progressLabel}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isAuthLoading && !isSharedView && (
              <button
                onClick={() => setIsSelectMode(!isSelectMode)}
                className={`p-1.5 rounded-lg border transition-all duration-300 ${
                  isSelectMode ? 'bg-blue-500 text-white border-blue-400 shadow-sm shadow-blue-500/20' : UI_THEME.BTN_GHOST
                }`}
                title={isSelectMode ? '取消選擇' : '更換相簿封面'}
              >
                <Images size={16} />
              </button>
            )}
            <button onClick={handleForceRefresh} disabled={isLoading || isFetchingMore} className={`p-1.5 rounded-lg ${UI_THEME.BTN_GHOST} disabled:opacity-40`} title="重新讀取">
              <RefreshCw size={16} className={(isLoading || isFetchingMore) ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleOpenShare} className={`p-1.5 rounded-lg ${UI_THEME.BTN_GHOST}`} title="分享">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">

        {/* ── 頁面頂端標題列（Normal Header） ──────────────────────────── */}
        <div className="flex justify-between items-start gap-4 mb-8">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {onBack && (
              <button onClick={onBack} className={`p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${UI_THEME.TEXT_MUTED}`}>
                <ChevronLeft size={24} />
              </button>
            )}
            <div className="min-w-0">
              <h1 className={`text-2xl md:text-3xl font-bold truncate ${UI_THEME.TEXT_PRIMARY}`}>{albumInfo.title}</h1>
              <p className={`${UI_THEME.TEXT_SECONDARY} mt-1 text-sm flex items-center gap-2`}>{progressLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isAuthLoading && !isSharedView && (
              <button
                onClick={() => setIsSelectMode(!isSelectMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border transition-all duration-300 ${
                  isSelectMode
                    ? 'bg-blue-500 text-white border-blue-400 shadow-md scale-105'
                    : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-blue-400 hover:text-blue-500 shadow-sm'
                }`}
              >
                <Images size={18} />
                <span>{isSelectMode ? '取消選擇' : '更換封面'}</span>
              </button>
            )}
            <button
              onClick={handleForceRefresh}
              disabled={isLoading || isFetchingMore}
              title="重新讀取相簿"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors shrink-0 disabled:opacity-50"
            >
              <RefreshCw size={16} className={(isLoading || isFetchingMore) ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">重新讀取</span>
            </button>
            <button
              onClick={handleOpenShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors shrink-0"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">分享此相簿</span>
            </button>
          </div>
        </div>

        {/* ── 封面選擇模式提示列 ─────────────────────────────────────────── */}
        {isSelectMode && (
          <div className="mb-6 p-4 bg-blue-500 text-white rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3 text-lg">
              <Images size={24} className="animate-pulse" />
              <span className="font-bold">請點選下方任一照片設為相簿預覽封面</span>
            </div>
            <button onClick={() => setIsSelectMode(false)} className="px-5 py-2 rounded-lg bg-white text-blue-600 font-extrabold hover:bg-blue-50 transition-colors shadow-sm">
              取消
            </button>
          </div>
        )}

        {/* ── 狀態：錯誤 ────────────────────────────────────────────────── */}
        {error && !cachedData && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className={`text-xl font-bold ${UI_THEME.TEXT_PRIMARY} mb-2`}>相簿發生錯誤</h3>
            <p className={`${UI_THEME.TEXT_MUTED} max-w-md`}>{error}</p>
          </div>
        )}

        {/* ── 狀態：初次載入骨架屏 ────────────────────────────────────────── */}
        {isLoading && !cachedData && (
          <div className="flex flex-wrap gap-2 md:gap-4 after:content-[''] after:flex-[10_1_0%] animate-pulse">
            {Array.from({ length: 16 }).map((_, i) => {
              const mockRatios = [1.33, 0.75, 1.77, 1, 1.5, 0.8, 1.33, 1.25];
              const ratio = mockRatios[i % 8];
              const baseHeight = 240;
              return (
                <div key={i} className="relative bg-stone-200 dark:bg-zinc-800 rounded-xl mb-2 md:mb-0" style={{ flexGrow: ratio, flexBasis: `${ratio * baseHeight}px` }}>
                  <i style={{ display: 'block', paddingBottom: `${(1 / ratio) * 100}%` }} />
                </div>
              );
            })}
          </div>
        )}

        {/* ── 狀態：空相簿 ──────────────────────────────────────────────── */}
        {!isLoading && !error && cachedData?.files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mb-4">
              <Images size={32} />
            </div>
            <h3 className={`text-xl font-bold ${UI_THEME.TEXT_PRIMARY} mb-2`}>相簿內目前沒有照片</h3>
            <p className={UI_THEME.TEXT_MUTED}>請老師上傳照片至該 Google Drive 資料夾</p>
          </div>
        )}

        {/* ── 相片網格（含 PhotoSwipe 燈箱） ──────────────────────────────── */}
        <div className="relative">
          <PhotoGrid
            photos={cachedData?.files || []}
            isSelectMode={isSelectMode}
            isFetchingMore={isFetchingMore}
            onSetCover={!isSharedView
              ? (id, url) => { handleSetCover(id, url); setIsSelectMode(false); }
              : null
            }
          />
        </div>

      </div>

      {/* ── 分享 Modal ────────────────────────────────────────────────── */}
      <PhotosShareModal
        isOpen={shareData.isOpen}
        onClose={() => setShareData((prev) => ({ ...prev, isOpen: false }))}
        shareId={shareData.shareId}
        albumTitle={shareData.albumTitle}
        coverId={shareData.coverIndex}
        isMultiShare={false}
      />


      {/* ── 萬用提示對話框 ─────────────────────────────────────────────── */}
      <DialogModal
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        variant={dialogConfig.variant}
        type="alert"
        onClose={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
