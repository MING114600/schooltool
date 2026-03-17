import React, { useEffect, useState } from 'react';
import { Images, Loader2 } from 'lucide-react';
import { UI_THEME } from '../../constants';
import { validatePublicFolder, fetchPublicFolderPhotos } from '../../services/googleDriveService';
import AlbumDetail from './AlbumDetail';

export default function SharedAlbums({ ids }) {
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAlbumId, setActiveAlbumId] = useState(null);

  const albumIds = ids ? ids.split(',').filter(Boolean) : [];
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

  useEffect(() => {
    const fetchAlbumsInfo = async () => {
      if (!apiKey || albumIds.length === 0) { setIsLoading(false); return; }

      try {
        const results = await Promise.all(
          albumIds.map(async (id) => {
            const res = await validatePublicFolder(id, apiKey);
            if (!res.isValid) return { folderId: id, title: `無效相簿 (${id})`, isValid: false, coverImage: null };

            // Fetch first photo to use as cover image
            let coverImage = null;
            try {
              const page1 = await fetchPublicFolderPhotos(id, apiKey);
              if (page1.files && page1.files.length > 0) {
                coverImage = `https://drive.google.com/thumbnail?id=${page1.files[0].id}&sz=w600`;
              }
            } catch (_) {}

            return { folderId: id, title: res.folderName || '未命名相簿', isValid: true, coverImage };
          })
        );
        setAlbums(results.filter(a => a.isValid));
      } catch (error) {
        console.error('解析分享相簿失敗', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbumsInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, apiKey]);

  // If user clicked into a specific album, render detail view
  if (activeAlbumId) {
    return (
      <AlbumDetail
        folderId={activeAlbumId}
        isSharedView={true}
        onBack={() => setActiveAlbumId(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 mt-4">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${UI_THEME.TEXT_PRIMARY}`}>老師分享的班級相簿</h1>
        <p className={`${UI_THEME.TEXT_SECONDARY} mt-1 text-sm`}>
          {isLoading ? '讀取相簿中...' : `共有 ${albums.length} 本相簿`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: albumIds.length || 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-stone-200 dark:bg-zinc-800 rounded-2xl" />
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border-2 border-dashed ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.TEXT_MUTED}`}>
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center">
            <Images size={28} className="text-stone-400 dark:text-zinc-500" />
          </div>
          <p className="font-bold text-base mb-1">無法讀取相簿</p>
          <p className="text-sm">連結可能已失效，或老師尚未開放權限</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {albums.map((album) => (
            <div
              key={album.folderId}
              onClick={() => setActiveAlbumId(album.folderId)}
              className={`group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer bg-stone-100 dark:bg-zinc-800 border ${UI_THEME.BORDER_DEFAULT} shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300`}
            >
              {album.coverImage ? (
                <img
                  src={album.coverImage}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-purple-50 to-sky-100 dark:from-zinc-700 dark:via-zinc-750 dark:to-zinc-800 flex items-center justify-center">
                  <Images size={36} className="text-indigo-300 dark:text-zinc-500 group-hover:scale-110 transition-transform duration-500" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <h3 className="text-white font-bold text-base truncate drop-shadow-md">{album.title}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
