import { useState, useCallback, useEffect } from 'react';
import { get } from 'idb-keyval';
import usePhotoStore from '../../../store/usePhotoStore';
import {
  validatePublicFolder,
  fetchPublicFolderPhotos,
} from '../../../services/googleDriveService';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FETCH_DELAY_MS = 300; // 節流延遲，避免 Google 429 錯誤

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * useDrivePhotos — 封裝相簿照片的三層快取獲取邏輯
 *
 * 快取層級：
 *   Layer 1：Zustand memory（同 session 切換相簿時）
 *   Layer 2：IndexedDB（F5 重整後仍有效）
 *   Layer 3：Google Drive API（真實網路請求）
 *
 * @param {string} folderId      - Google Drive 資料夾 ID
 * @param {string} apiKey        - VITE_GOOGLE_API_KEY
 * @param {object} albumInfo     - 來自 Zustand managedAlbums 的相簿資訊
 * @param {boolean} isSharedView - 是否為訪客/分享模式
 * @returns {{ isFetchingMore, progressLabel, handleForceRefresh }}
 */
export function useDrivePhotos(folderId, apiKey, albumInfo = {}, isSharedView) {
  const photosCache        = usePhotoStore((s) => s.photosCache);
  const setAlbumPhotos     = usePhotoStore((s) => s.setAlbumPhotos);
  const setLoading         = usePhotoStore((s) => s.setLoading);
  const setError           = usePhotoStore((s) => s.setError);
  const loadingStates      = usePhotoStore((s) => s.loadingStates);
  const errorStates        = usePhotoStore((s) => s.errorStates);
  const updateManagedAlbum = usePhotoStore((s) => s.updateManagedAlbum);
  const clearAlbumCache    = usePhotoStore((s) => s.clearAlbumCache);

  const cachedData = photosCache[folderId];
  const isLoading  = loadingStates[folderId];
  const error      = errorStates[folderId];

  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // ── Core: Progressive Load ──────────────────────────────────────────────
  const loadPhotos = useCallback(
    async (forceRefresh = false) => {
      // Layer 1: Zustand memory
      if (!forceRefresh && cachedData && Date.now() - cachedData.lastFetched < CACHE_TTL_MS) return;

      // Layer 2: IndexedDB
      if (!forceRefresh) {
        try {
          const idbCache = await get(`photo_cache_${folderId}`);
          if (idbCache && Date.now() - idbCache.lastFetched < CACHE_TTL_MS) {
            setAlbumPhotos(folderId, idbCache.files, idbCache.lastFetched);
            return;
          }
        } catch (_) {}
      }

      if (!apiKey) {
        setError(folderId, '未設定 VITE_GOOGLE_API_KEY');
        return;
      }

      // Layer 3: Google Drive API
      setLoading(folderId, true);
      setError(folderId, null);

      try {
        // ① 先取第一頁，立即顯示
        const page1 = await fetchPublicFolderPhotos(folderId, apiKey);
        setAlbumPhotos(folderId, page1.files);
        setLoading(folderId, false);

        // 驗證資料夾 meta（資料夾名稱）
        try {
          await validatePublicFolder(folderId, apiKey);
        } catch (err) {
          console.error('[useDrivePhotos] Failed to fetch meta', err);
        }

        // 自動回退封面：URL 有 c 參數時跳過，避免學習邏輯混淆
        const searchParams = new URLSearchParams(window.location.search);
        const hasUrlCoverIdx = searchParams.get('c') !== null;

        if (page1.files.length > 0 && !hasUrlCoverIdx && (!albumInfo.coverImage || !albumInfo.coverId)) {
          const firstPhoto = page1.files.find(f => f.mimeType?.includes('image/'));
          if (firstPhoto) {
            updateManagedAlbum(folderId, {
              coverId: firstPhoto.id,
              coverImage: `https://drive.google.com/thumbnail?id=${firstPhoto.id}&sz=w800`,
            });
          }
        }

        // ② 背景繼續載入剩餘分頁
        if (page1.nextPageToken) {
          setIsFetchingMore(true);
          let allFiles = [...page1.files];
          let pageToken = page1.nextPageToken;
          let lastUpdateTime = Date.now();

          while (pageToken && allFiles.length < 500) {
            await sleep(FETCH_DELAY_MS);
            const nextPage = await fetchPublicFolderPhotos(folderId, apiKey, pageToken);
            allFiles = [...allFiles, ...nextPage.files];
            pageToken = nextPage.nextPageToken || null;
            
            // 狀態防抖動 (Debounced Render)：為避免每抓一頁就重繪龐大的 DOM 樹
            // 設定間隔至少 1.5 秒，或是沒資料了、提早滿 500 張了，才正式寫入 Zustand 觸發畫面更新
            if (Date.now() - lastUpdateTime > 1500 || !pageToken || allFiles.length >= 500) {
               setAlbumPhotos(folderId, allFiles);
               lastUpdateTime = Date.now();
            }
          }

          setIsFetchingMore(false);
          // 確保背景迴圈結束後，一定會更新最後一份清單
          setAlbumPhotos(folderId, allFiles);
        }
      } catch (err) {
        setError(folderId, err.message);
        setLoading(folderId, false);
        setIsFetchingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [folderId, apiKey],
  );

  // ── 初始載入 ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // ── 封面學習：從 URL c 參數自動記憶封面 ────────────────────────────────
  useEffect(() => {
    if (!isLoading && cachedData && folderId) {
      const searchParams = new URLSearchParams(window.location.search);
      const coverIdxParam = searchParams.get('c');
      const shouldUpdate =
        coverIdxParam !== null &&
        !isNaN(parseInt(coverIdxParam)) &&
        (!albumInfo.coverId || isSharedView);

      if (shouldUpdate) {
        const idx = parseInt(coverIdxParam);
        const photos = (cachedData.files || []).filter(f => f.mimeType?.includes('image/'));
        const sortedPhotos = [...photos].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        if (sortedPhotos[idx]) {
          const targetPhoto = sortedPhotos[idx];
          console.log(`[useDrivePhotos] 自動學習封面 c=${idx}:`, targetPhoto.name);
          updateManagedAlbum(folderId, {
            coverId: targetPhoto.id,
            coverImage: `https://drive.google.com/thumbnail?id=${targetPhoto.id}&sz=w800`,
          });
        }
      }
    }
  }, [isLoading, cachedData, folderId, albumInfo.coverId, isSharedView, updateManagedAlbum]);

  // ── 強制重新讀取 ──────────────────────────────────────────────────────
  const handleForceRefresh = useCallback(() => {
    clearAlbumCache(folderId);
    loadPhotos(true);
  }, [clearAlbumCache, folderId, loadPhotos]);

  // ── 進度標籤 ──────────────────────────────────────────────────────────
  const totalPhotos = cachedData?.files.length || 0;
  const progressLabel = isFetchingMore
    ? `載入中... 已取得 ${totalPhotos} 張`
    : cachedData
      ? `共 ${totalPhotos} 張照片`
      : isLoading
        ? '載入照片中...'
        : '準備中...';

  return {
    cachedData,
    isLoading,
    error,
    isFetchingMore,
    progressLabel,
    handleForceRefresh,
  };
}
