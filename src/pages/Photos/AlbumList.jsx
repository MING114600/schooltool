import React, { useState } from 'react';
import { Images } from 'lucide-react';
import { UI_THEME } from '../../constants';
import usePhotoStore from '../../store/usePhotoStore';
import AlbumManager from './components/AlbumManager';
import PhotosShareModal from './components/PhotosShareModal';

// Relative time helper
function relativeTime(ts) {
  if (!ts) return '';
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return '今天新增';
  if (d === 1) return '昨天新增';
  if (d < 30) return `${d} 天前新增`;
  if (d < 365) return `${Math.floor(d / 30)} 個月前新增`;
  return `${Math.floor(d / 365)} 年前新增`;
}

export default function AlbumList({ onSelectAlbum }) {
  const managedAlbums = usePhotoStore(state => state.managedAlbums);
  const photosCache   = usePhotoStore(state => state.photosCache);

  const [shareData, setShareData] = useState({ isOpen: false, shareId: null, albumTitle: '' });

  const handleGenerateShareLink = (ids) => {
    setShareData({
      isOpen: true,
      shareId: ids.join(','),
      albumTitle: `已為您成功建立 ${ids.length} 個相簿的專屬分享通道`
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 mt-4">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${UI_THEME.TEXT_PRIMARY}`}>班級相簿</h1>
          <p className={`${UI_THEME.TEXT_SECONDARY} mt-1 text-sm`}>
            {managedAlbums.length > 0
              ? `共 ${managedAlbums.length} 本相簿`
              : '尚未建立任何相簿'
            }
          </p>
        </div>
      </div>

      {/* Admin Panel */}
      <AlbumManager onGenerateShareLink={handleGenerateShareLink} />

      {/* Album Grid */}
      <div>
        <h2 className={`text-xl font-bold mb-5 ${UI_THEME.TEXT_PRIMARY}`}>所有相簿</h2>
        {managedAlbums.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border-2 border-dashed ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.TEXT_MUTED}`}>
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center">
              <Images size={28} className="text-stone-400 dark:text-zinc-500" />
            </div>
            <p className="font-bold text-base mb-1">相簿空空如也</p>
            <p className="text-sm">請點擊上方「後台管理」展開並新增 Google Drive 相簿連結</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {managedAlbums.map(album => {
              const cachedCount = photosCache[album.folderId]?.files?.length;
              return (
                <div
                  key={album.folderId}
                  onClick={() => onSelectAlbum(album.folderId)}
                  className={`group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer bg-stone-100 dark:bg-zinc-800 border ${UI_THEME.BORDER_DEFAULT} shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300`}
                >
                  {/* Cover image or gradient */}
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

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Photo count badge (top-right) */}
                  {cachedCount !== undefined && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold">
                      {cachedCount} 張
                    </div>
                  )}

                  {/* Title + date (bottom) */}
                  <div className="absolute bottom-0 left-0 right-0 p-3.5">
                    <h3 className="text-white font-bold text-base truncate drop-shadow-md">{album.title}</h3>
                    <p className="text-white/60 text-xs mt-0.5 translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                      {relativeTime(album.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <PhotosShareModal
        isOpen={shareData.isOpen}
        onClose={() => setShareData(prev => ({ ...prev, isOpen: false }))}
        shareId={shareData.shareId}
        albumTitle={shareData.albumTitle}
        isMultiShare={true}
      />
    </div>
  );
}
