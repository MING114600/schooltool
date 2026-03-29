import React, { useState, useMemo } from 'react';
import { Images } from 'lucide-react';
import { UI_THEME } from '../../constants';
import usePhotoStore from '../../store/usePhotoStore';
import AlbumManager from './components/AlbumManager';
import PhotosShareModal from './components/PhotosShareModal';

// ── 工具函數 ─────────────────────────────────────────────────────────────

/** 相對時間標籤 */
function relativeTime(ts) {
  if (!ts) return '';
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return '今天新增';
  if (d === 1) return '昨天新增';
  if (d < 30) return `${d} 天前新增`;
  if (d < 365) return `${Math.floor(d / 30)} 個月前新增`;
  return `${Math.floor(d / 365)} 年前新增`;
}

/**
 * 根據時間戳計算「學年度」標籤。
 * 台灣學年以 8/1 為新學年分界（例：2024/8 起 → 113 學年度）
 */
function getAcademicYear(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-indexed
  // 8 月以後算新學年；台灣民國年 = 西元 - 1911
  const rocYear = month >= 8 ? year - 1911 : year - 1912;
  return `${rocYear} 學年`;
}

// ── 主要元件 ─────────────────────────────────────────────────────────────

export default function AlbumList({ onSelectAlbum }) {
  const managedAlbums = usePhotoStore((state) => state.managedAlbums);
  const photosCache   = usePhotoStore((state) => state.photosCache);

  const [shareData, setShareData]       = useState({ isOpen: false, shareId: null, albumTitle: '' });
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 學年字串

  // ── 計算所有可用的學年 Chips ──────────────────────────────────────────
  const academicYears = useMemo(() => {
    const yearSet = new Set();
    managedAlbums.forEach((a) => {
      const y = getAcademicYear(a.createdAt);
      if (y) yearSet.add(y);
    });
    // 依學年降冪排序（最新在前）
    return Array.from(yearSet).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      return numB - numA;
    });
  }, [managedAlbums]);

  // ── 篩選後的相簿清單 ──────────────────────────────────────────────────
  const filteredAlbums = useMemo(() => {
    if (activeFilter === 'all') return managedAlbums;
    return managedAlbums.filter((a) => getAcademicYear(a.createdAt) === activeFilter);
  }, [managedAlbums, activeFilter]);

  const handleGenerateShareLink = (ids) => {
    setShareData({
      isOpen: true,
      shareId: ids.join(','),
      albumTitle: `已為您成功建立 ${ids.length} 個相簿的專屬分享通道`,
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
              : '尚未建立任何相簿'}
          </p>
        </div>
      </div>

      {/* Admin Panel */}
      <AlbumManager onGenerateShareLink={handleGenerateShareLink} />

      {/* Album Grid */}
      <div>
        {/* 標題列：「所有相簿」+ 學年篩選 Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <h2 className={`text-xl font-bold ${UI_THEME.TEXT_PRIMARY} mr-2`}>所有相簿</h2>

          {/* 全部 Chip */}
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 border ${
              activeFilter === 'all'
                ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                : `${UI_THEME.BORDER_DEFAULT} ${UI_THEME.TEXT_MUTED} hover:border-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-400`
            }`}
          >
            全部
          </button>

          {/* 動態學年 Chips */}
          {academicYears.map((year) => (
            <button
              key={year}
              onClick={() => setActiveFilter(year)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 border ${
                activeFilter === year
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                  : `${UI_THEME.BORDER_DEFAULT} ${UI_THEME.TEXT_MUTED} hover:border-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-400`
              }`}
            >
              {year}
            </button>
          ))}
        </div>

        {/* 空狀態 */}
        {filteredAlbums.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border-2 border-dashed ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.TEXT_MUTED}`}>
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center">
              <Images size={28} className="text-stone-400 dark:text-zinc-500" />
            </div>
            {managedAlbums.length === 0 ? (
              <>
                <p className="font-bold text-base mb-1">相簿空空如也</p>
                <p className="text-sm">請點擊上方「後台管理」展開並新增 Google Drive 相簿連結</p>
              </>
            ) : (
              <>
                <p className="font-bold text-base mb-1">此學年度無相簿</p>
                <button onClick={() => setActiveFilter('all')} className="mt-2 text-sm text-indigo-500 underline hover:no-underline">
                  顯示全部
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAlbums.map((album) => {
              const cachedCount = photosCache[album.folderId]?.files?.length;
              const yearLabel = getAcademicYear(album.createdAt);
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

                  {/* 學年標籤（左上角） */}
                  {yearLabel && (
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold">
                      {yearLabel}
                    </div>
                  )}

                  {/* Photo count badge (right) */}
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
        onClose={() => setShareData((prev) => ({ ...prev, isOpen: false }))}
        shareId={shareData.shareId}
        albumTitle={shareData.albumTitle}
        isMultiShare={true}
      />
    </div>
  );
}
