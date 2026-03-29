import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { get, set as setIDB, del as delIDB } from 'idb-keyval';

const usePhotoStore = create(
  persist(
    (set, get) => ({
      // 已註冊管理的相簿列表: { folderId, title, coverImage, status: 'active' | 'error', errorMsg?: string, fileCount?: number }
      managedAlbums: [],
      // 快取的照片資料: { [folderId]: { files: [], lastFetched: timestamp } }
      photosCache: {},
      
      // 更新載入狀態 (供 UI 顯示)
      loadingStates: {}, // { [folderId]: boolean }
      errorStates: {},   // { [folderId]: string | null }

      setLoading: (folderId, isLoading) => 
        set((state) => ({ loadingStates: { ...state.loadingStates, [folderId]: isLoading } })),
      
      setError: (folderId, error) => 
        set((state) => ({ errorStates: { ...state.errorStates, [folderId]: error } })),

      // 新增管理的相簿
      addManagedAlbum: (albumData) => set((state) => {
        // 避免重複加入
        if (state.managedAlbums.some(a => a.folderId === albumData.folderId)) {
          return state;
        }
        return { managedAlbums: [...state.managedAlbums, albumData] };
      }),

      // 更新管理的相簿 (可更新標題或封面 coverId, coverImage)
      updateManagedAlbum: (folderId, updates) => set((state) => ({
        managedAlbums: state.managedAlbums.map(a => 
          a.folderId === folderId ? { ...a, ...updates } : a
        )
      })),

      // 移除管理的相簿
      removeManagedAlbum: (folderId) => {
        delIDB(`photo_cache_${folderId}`).catch(console.error);
        set((state) => {
          const newCache = { ...state.photosCache };
          delete newCache[folderId];
          return { 
            managedAlbums: state.managedAlbums.filter(a => a.folderId !== folderId),
            photosCache: newCache 
          };
        });
      },

      // 儲存拉取到的相簿照片資料到 Cache
      setAlbumPhotos: (folderId, files, timestamp = Date.now()) => {
        // 非同步背景寫入 IndexedDB，避免阻塞 Zustand 主執行緒
        setIDB(`photo_cache_${folderId}`, { files, lastFetched: timestamp }).catch(console.error);
        
        set((state) => ({
          photosCache: {
            ...state.photosCache,
            [folderId]: {
              files,
              lastFetched: timestamp
            }
          }
        }));
      },

      // 清空快取 (強制重整時使用)
      clearAlbumCache: (folderId) => {
        delIDB(`photo_cache_${folderId}`).catch(console.error);
        set((state) => {
          const newCache = { ...state.photosCache };
          delete newCache[folderId];
          return { photosCache: newCache };
        });
      }
    }),
    {
      name: 'classroomos-photos-storage', // localStorage key
      partialize: (state) => ({ 
        // 🌟 效能大優化：僅將輕量的相簿清單存入 localStorage，不寫入龐大的 photosCache。
        // photosCache 若包含上千張照片，跟隨 Zustand 狀態一起 serialize 會造成嚴重卡頓 (Jank)
        managedAlbums: state.managedAlbums,
      }), 
    }
  )
);

export default usePhotoStore;
