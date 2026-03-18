import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, AlertTriangle, Images, Share2, RefreshCw } from 'lucide-react';
import { get } from 'idb-keyval';
import { UI_THEME } from '../../constants';
import usePhotoStore from '../../store/usePhotoStore';
import { validatePublicFolder, fetchPublicFolderPhotos, updateFolderDescription } from '../../services/googleDriveService';
import { useAuth } from '../../context/AuthContext';
import PhotoLightbox from './components/PhotoLightbox';
import PhotosShareModal from './components/PhotosShareModal';
import DialogModal from '../../components/common/DialogModal'; // 🌟 引入自訂對話框

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_DELAY_MS = 300; // 🌟 緩衝延遲：避免過快抓取觸發 Google 429 錯誤

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function AlbumDetail({ folderId, onBack, isSharedView = false, user, login, isAuthLoading = false }) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  // 🌟 Debug: 追蹤傳入的 User 狀態
  useEffect(() => {
    console.log('[Photos] AlbumDetail Debug:', { user: !!user, isAuthLoading, isSharedView });
  }, [user, isAuthLoading, isSharedView]);

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
  const [isSelectMode, setIsSelectMode]   = useState(false);
  const [dialogConfig, setDialogConfig]   = useState({ isOpen: false, title: '', message: '', variant: 'info' }); // 🌟 新增對話框狀態
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
        .then(res => { 
          if (res.isValid) {
            setDynamicTitle(res.folderName);
          }
        })
        .catch(() => {});
    }
  }, [folderId, apiKey, rootAlbumInfo, updateManagedAlbum]);

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

      try {
        const meta = await validatePublicFolder(folderId, apiKey);
        if (meta.isValid) {
          // 僅獲取名稱，不再解析敘述中的封面
        }
      } catch (err) { console.error('Failed to fetch meta', err); }

      // Set the default album cover if missing
      // 🌟 [優化] 如果 URL 已經帶有 c 索引，則不要在這個階段跑自動回退 (Fallback)
      // 避免第一張照片搶先被存起來，造成後續學習邏輯判斷混淆
      const searchParams = new URLSearchParams(window.location.search);
      const hasUrlCoverIdx = searchParams.get('c') !== null;

      if (page1.files.length > 0 && !hasUrlCoverIdx && (!albumInfo.coverImage || !albumInfo.coverId)) {
        // Fallback to first photo
        const firstPhoto = page1.files[0];
        updateManagedAlbum(folderId, { 
          coverId: firstPhoto.id,
          coverImage: `https://drive.google.com/thumbnail?id=${firstPhoto.id}&sz=w800` 
        });
      }

      // ② Continue loading remaining pages in the background
      if (page1.nextPageToken) {
        setIsFetchingMore(true);
        let allFiles = [...page1.files];
        let pageToken = page1.nextPageToken;

        while (pageToken && allFiles.length < 500) {
          // 🌟 核心修正：加上緩衝延遲 (Throttle)，防止大相簿因並發請求過多被 Google 暫時封鎖
          await sleep(FETCH_DELAY_MS);
          
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

  // 🌟 [新增] 封面自動學習邏輯：從 URL 參數記憶封面
  useEffect(() => {
    // 修正：不論是否為分享視圖 (isSharedView)，都應嘗試學習封面索引
    if (!isLoading && cachedData && folderId) {
      const searchParams = new URLSearchParams(window.location.search);
      const coverIdxParam = searchParams.get('c');
      
      // 如果 URL 有指定索引，且滿足以下任一條件則更新本地 Store：
      // 1. 本地尚無該相簿紀錄
      // 2. 目前是訪客模式 (isSharedView)，則優先遵循連結中的索引
      const shouldUpdate = coverIdxParam !== null && !isNaN(parseInt(coverIdxParam)) && 
                          (!albumInfo.coverId || isSharedView);

      if (shouldUpdate) {
        const idx = parseInt(coverIdxParam);
        const photos = cachedData.files || [];
        // 依照統一的「名稱遞增」排序
        const sortedPhotos = [...photos].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        if (sortedPhotos[idx]) {
          const targetPhoto = sortedPhotos[idx];
          console.log(`[Photos] 偵測到 URL 封面索引 c=${idx}，自動學習至本地:`, targetPhoto.name);
          
          updateManagedAlbum(folderId, {
            coverId: targetPhoto.id,
            coverImage: `https://drive.google.com/thumbnail?id=${targetPhoto.id}&sz=w800`
          });
        }
      }
    }
  }, [isLoading, cachedData, folderId, albumInfo.coverId, isSharedView, updateManagedAlbum]);

  const handleForceRefresh = () => {
    clearAlbumCache(folderId);
    loadPhotos(true);
  };

  const handleSetCover = async (photoId, photoThumbUrl) => {
    try {
      // 🌟 核心優化：不再寫入 Google Drive，直接更新本地管理的相簿資訊
      updateManagedAlbum(folderId, { 
        coverId: photoId, 
        coverImage: photoThumbUrl 
      });

      // 🌟 改用 DialogModal 顯示成果
      setDialogConfig({
        isOpen: true,
        title: '封面設定成功',
        message: '已將此相片設為「此台裝置」的相簿封面！\n\n小提醒：若要在其他裝置看到此封面，請執行「全域備份與還原」。',
        variant: 'success'
      });
      
      setIsSelectMode(false); // 設定完自動退出模式
    } catch (err) {
      setDialogConfig({
        isOpen: true,
        title: '設定失敗',
        message: '原因：' + err.message,
        variant: 'danger'
      });
    }
  };

  const handleOpenShare = () => {
    // 🌟 網址縮短核心：計算「名稱遞增排序」下的索引位
    const photos = cachedData?.files || [];
    // 複製並依名稱排序 (與 Worker 規則一致)
    const sortedPhotos = [...photos].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    // 找出目前封面 ID 在排序清單中的位置
    const currentCoverId = albumInfo.coverId;
    let coverIndex = sortedPhotos.findIndex(p => p.id === currentCoverId);

    // 🌟 [深度優化] 解決冷啟動歸零問題：
    // 如果找不到索引（可能還在背景載入後面分頁），但 URL 參數有給 c，則優先使用 URL 的 c
    if (coverIndex < 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const urlCoverIdx = searchParams.get('c');
      if (urlCoverIdx !== null && !isNaN(parseInt(urlCoverIdx))) {
        coverIndex = parseInt(urlCoverIdx);
      }
    }

    setShareData({
      isOpen: true,
      shareId: folderId,
      albumTitle: albumInfo.title,
      coverIndex: coverIndex >= 0 ? coverIndex : 0 // 找不到則預設為 0
    });
  };

  const totalPhotos = cachedData?.files.length || 0;
  const progressLabel = isFetchingMore
    ? `載入中... 已取得 ${totalPhotos} 張`
    : cachedData ? `共 ${totalPhotos} 張照片` : isLoading ? '載入照片中...' : '準備中...';

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      {/* 🌟 1. 還原 Sticky Header (滾動遮罩) */}
      <div className={`sticky top-0 z-30 transition-all duration-300 ${
        isScrolled
          ? `${UI_THEME.SURFACE_GLASS} shadow-md border-b ${UI_THEME.BORDER_DEFAULT} px-4 md:px-8 py-3 translate-y-0 opacity-100`
          : 'translate-y-[-10px] opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {onBack && <button onClick={onBack} className={`p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${UI_THEME.TEXT_MUTED}`}><ChevronLeft size={20} /></button>}
            <span className={`font-bold text-base truncate ${UI_THEME.TEXT_PRIMARY}`}>{albumInfo.title}</span>
            <span className={`text-xs ${UI_THEME.TEXT_MUTED} hidden sm:inline`}>{progressLabel}</span>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* 🌟 核心優化：只要不是訪客就顯示，點擊時若無 Token 則自動觸發登入 */}
            {!isAuthLoading && !isSharedView && (
              <button
                onClick={() => setIsSelectMode(!isSelectMode)}
                className={`p-1.5 rounded-lg border transition-all duration-300 ${
                  isSelectMode 
                    ? 'bg-blue-500 text-white border-blue-400 shadow-sm shadow-blue-500/20' 
                    : `${UI_THEME.BTN_GHOST}`
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
        {/* 🌟 2. 頁面頂端原有標題列 (Normal Header) */}
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
            {/* 🌟 核心優化：非訪客模式下恆常顯示，解決 Token 過期按鈕失蹤問題 */}
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
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors shrink-0 disabled:opacity-50`}
            >
              <RefreshCw size={16} className={(isLoading || isFetchingMore) ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">重新讀取</span>
            </button>
            <button
              onClick={handleOpenShare}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors shrink-0`}
            >
              <Share2 size={16} /> <span className="hidden sm:inline">分享此相簿</span>
            </button>
          </div>
        </div>

        {/* 🌟 3. 選擇模式提示列 (始終在標題下方) */}
        {isSelectMode && (
          <div className="mb-6 p-4 bg-blue-500 text-white rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3 text-lg">
              <Images size={24} className="animate-pulse" />
              <span className="font-bold">請點選下方任一照片設為相簿預覽封面</span>
            </div>
            <button 
              onClick={() => setIsSelectMode(false)}
              className="px-5 py-2 rounded-lg bg-white text-blue-600 font-extrabold hover:bg-blue-50 transition-colors shadow-sm"
            >
              取消
            </button>
          </div>
        )}

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
        {/* 🌟 核心相片網格邏輯 */}
        <div className="relative">
          <PhotoLightbox 
            photos={cachedData?.files || []} 
            isSelectMode={isSelectMode}
            onSetCover={!isSharedView 
              ? (id, url) => {
                handleSetCover(id, url);
                setIsSelectMode(false);
              } 
              : null
            }
          />
        </div>
      {/* 相簿專屬分享 QR Code 彈窗 */}
      <PhotosShareModal
        isOpen={shareData.isOpen}
        onClose={() => setShareData(prev => ({ ...prev, isOpen: false }))}
        shareId={shareData.shareId}
        albumTitle={shareData.albumTitle}
        coverId={shareData.coverIndex} // 🌟 傳遞計算出的封面索引 (數字)
        isMultiShare={false}
      />

      {/* 🌟 萬用提示對話框 */}
      <DialogModal
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        variant={dialogConfig.variant}
        type="alert"
        onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
      />
      </div>
    </div>
  );
}
