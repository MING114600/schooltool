import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, AlertTriangle, Images, Share2, RefreshCw } from 'lucide-react';
import { get } from 'idb-keyval';
import { UI_THEME } from '../../constants';
import usePhotoStore from '../../store/usePhotoStore';
import { validatePublicFolder, fetchPublicFolderPhotos } from '../../services/googleDriveService';
import PhotoLightbox from './components/PhotoLightbox';
import PhotosShareModal from './components/PhotosShareModal';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function AlbumDetail({ folderId, onBack, isSharedView = false }) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  const managedAlbums    = usePhotoStore(state => state.managedAlbums);
  const photosCache      = usePhotoStore(state => state.photosCache);
  const setAlbumPhotos   = usePhotoStore(state => state.setAlbumPhotos);
  const setLoading       = usePhotoStore(state => state.setLoading);
  const setError         = usePhotoStore(state => state.setError);
  const loadingStates    = usePhotoStore(state => state.loadingStates);
  const errorStates      = usePhotoStore(state => state.errorStates);
  const updateManagedAlbum = usePhotoStore(state => state.updateManagedAlbum);
  const clearAlbumCache  = usePhotoStore(state => state.clearAlbumCache);

  const [dynamicTitle, setDynamicTitle]   = useState(null);
  const [shareData, setShareData]         = useState({ isOpen: false, shareId: null, albumTitle: '' });
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isScrolled, setIsScrolled]       = useState(false);
  const scrollRef = useRef(null);

  const rootAlbumInfo = managedAlbums.find(a => a.folderId === folderId);
  const albumInfo     = rootAlbumInfo || { title: dynamicTitle || `相簿 ${folderId}` };
  const cachedData    = photosCache[folderId];
  const isLoading     = loadingStates[folderId];
  const error         = errorStates[folderId];

  // --- Dynamic title fetch for shared/guest views ---
  useEffect(() => {
    if (!rootAlbumInfo && apiKey) {
      validatePublicFolder(folderId, apiKey)
        .then(res => { if (res.isValid) setDynamicTitle(res.folderName); })
        .catch(() => {});
    }
  }, [folderId, apiKey, rootAlbumInfo]);

  // Update Browser Tab Title
  useEffect(() => {
    const originalTitle = document.title;
    if (albumInfo.title) {
      document.title = `${albumInfo.title} - 班級相簿`;
    }
    return () => { document.title = originalTitle; };
  }, [albumInfo.title]);

  // --- Core progressive load function ---
  const loadPhotos = useCallback(async (forceRefresh = false) => {
    // Layer 1: Zustand memory (same session, different albums)
    if (!forceRefresh && cachedData && (Date.now() - cachedData.lastFetched < CACHE_TTL_MS)) return;

    // Layer 2: IndexedDB persisted cache (after F5 refresh)
    if (!forceRefresh) {
      try {
        const idbCache = await get(`photo_cache_${folderId}`);
        if (idbCache && (Date.now() - idbCache.lastFetched < CACHE_TTL_MS)) {
          setAlbumPhotos(folderId, idbCache.files, idbCache.lastFetched);
          return;
        }
      } catch (_) {}
    }

    if (!apiKey) { setError(folderId, '未設定 VITE_GOOGLE_API_KEY'); return; }

    // Layer 3: Fetch from Google Drive API (progressive)
    setLoading(folderId, true);
    setError(folderId, null);

    try {
      // ① Fetch page 1 and show it immediately
      const page1 = await fetchPublicFolderPhotos(folderId, apiKey);
      setAlbumPhotos(folderId, page1.files);
      setLoading(folderId, false);

      // Set the album cover from first photo (only if missing)
      if (page1.files.length > 0 && !albumInfo.coverImage) {
        const coverUrl = `https://drive.google.com/thumbnail?id=${page1.files[0].id}&sz=w800`;
        updateManagedAlbum(folderId, { coverImage: coverUrl });
      }

      // ② Continue loading remaining pages in the background
      if (page1.nextPageToken) {
        setIsFetchingMore(true);
        let allFiles = [...page1.files];
        let pageToken = page1.nextPageToken;

        while (pageToken && allFiles.length < 500) {
          const nextPage = await fetchPublicFolderPhotos(folderId, apiKey, pageToken);
          allFiles = [...allFiles, ...nextPage.files];
          // Update display progressively after each page
          setAlbumPhotos(folderId, allFiles);
          pageToken = nextPage.nextPageToken || null;
        }
        setIsFetchingMore(false);
        // Final write - only cache up to MAX_CACHE_PHOTOS IDs to prevent IDB bloat
        setAlbumPhotos(folderId, allFiles);
      }

    } catch (err) {
      setError(folderId, err.message);
      setLoading(folderId, false);
      setIsFetchingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, apiKey]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  // Detect scroll for sticky header
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setIsScrolled(el.scrollTop > 80);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleForceRefresh = () => {
    clearAlbumCache(folderId);
    loadPhotos(true);
  };

  const totalPhotos = cachedData?.files.length || 0;
  const progressLabel = isFetchingMore
    ? `載入中... 已取得 ${totalPhotos} 張`
    : cachedData ? `共 ${totalPhotos} 張照片` : isLoading ? '載入照片中...' : '準備中...';

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      {/* Sticky Header — shows after user scrolls down */}
      <div className={`sticky top-0 z-20 transition-all duration-300 ${
        isScrolled
          ? `${UI_THEME.SURFACE_GLASS} shadow-sm border-b ${UI_THEME.BORDER_DEFAULT} px-4 md:px-8 py-3`
          : 'px-0 py-0 opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {onBack && <button onClick={onBack} className={`p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${UI_THEME.TEXT_MUTED}`}><ChevronLeft size={20} /></button>}
            <span className={`font-bold text-base truncate ${UI_THEME.TEXT_PRIMARY}`}>{albumInfo.title}</span>
            <span className={`text-xs ${UI_THEME.TEXT_MUTED} hidden sm:inline`}>{progressLabel}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleForceRefresh} disabled={isLoading || isFetchingMore} className={`p-1.5 rounded-lg ${UI_THEME.BTN_GHOST} disabled:opacity-40`} title="重新讀取"><RefreshCw size={16} className={(isLoading || isFetchingMore) ? 'animate-spin' : ''} /></button>
            <button onClick={() => setShareData({ isOpen: true, shareId: folderId, albumTitle: albumInfo.title })} className={`p-1.5 rounded-lg ${UI_THEME.BTN_GHOST}`} title="分享"><Share2 size={16} /></button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* 頂部導航 */}
      <div className="flex justify-between items-start gap-4 mb-8">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${UI_THEME.TEXT_MUTED}`}
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className={`text-2xl md:text-3xl font-bold truncate ${UI_THEME.TEXT_PRIMARY}`}>
              {albumInfo.title}
            </h1>
            <p className={`${UI_THEME.TEXT_SECONDARY} mt-1 text-sm flex items-center gap-2`}>
              {progressLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleForceRefresh}
            disabled={isLoading || isFetchingMore}
            title="重新讀取相簿"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors shrink-0 disabled:opacity-50`}
          >
            <RefreshCw size={16} className={(isLoading || isFetchingMore) ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">重新讀取</span>
          </button>
          <button
            onClick={() => setShareData({ isOpen: true, shareId: folderId, albumTitle: albumInfo.title })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors shrink-0`}
          >
            <Share2 size={16} /> <span className="hidden sm:inline">分享此相簿</span>
          </button>
        </div>
      </div>

      {/* 狀態：錯誤 */}
      {error && !cachedData && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className={`text-xl font-bold ${UI_THEME.TEXT_PRIMARY} mb-2`}>相簿發生錯誤</h3>
          <p className={`${UI_THEME.TEXT_MUTED} max-w-md`}>{error}</p>
        </div>
      )}

      {/* 狀態：首次載入骨架屏 — 用橫向流動式佈局模擬真實相片牆 */}
      {isLoading && !cachedData && (
        <div className="flex flex-wrap gap-2 md:gap-4 after:content-[''] after:flex-[10_1_0%] animate-pulse">
          {Array.from({ length: 16 }).map((_, i) => {
            // 模擬隨機圖片比例 (寬/高)
            const mockRatios = [1.33, 0.75, 1.77, 1, 1.5, 0.8, 1.33, 1.25];
            const ratio = mockRatios[i % 8];
            const baseHeight = 240;

            return (
              <div
                key={i}
                className="relative bg-stone-200 dark:bg-zinc-800 rounded-xl mb-2 md:mb-0"
                style={{ flexGrow: ratio, flexBasis: `${ratio * baseHeight}px` }}
              >
                {/* 佔位高度對準比例 */}
                <i style={{ display: 'block', paddingBottom: `${(1 / ratio) * 100}%` }}></i>
              </div>
            );
          })}
        </div>
      )}

      {/* 狀態：無照片 */}
      {!isLoading && !error && cachedData?.files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mb-4">
            <Images size={32} />
          </div>
          <h3 className={`text-xl font-bold ${UI_THEME.TEXT_PRIMARY} mb-2`}>相簿內目前沒有照片</h3>
          <p className={UI_THEME.TEXT_MUTED}>請老師上傳照片至該 Google Drive 資料夾</p>
        </div>
      )}

      {/* 圖片牆 (燈箱) — 載入第一頁後立刻顯示 */}
      {cachedData && cachedData.files.length > 0 && (
        <PhotoLightbox photos={cachedData.files} />
      )}

      {/* 相簿專屬分享 QR Code 彈窗 */}
      <PhotosShareModal
        isOpen={shareData.isOpen}
        onClose={() => setShareData(prev => ({ ...prev, isOpen: false }))}
        shareId={shareData.shareId}
        albumTitle={shareData.albumTitle}
        isMultiShare={false}
      />
      </div>
    </div>
  );
}
