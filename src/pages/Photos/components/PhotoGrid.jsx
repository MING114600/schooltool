import React, { useState } from 'react';
import { Gallery, Item } from 'react-photoswipe-gallery';
import { Images } from 'lucide-react';
import 'photoswipe/dist/photoswipe.css';
import LazyPhoto from './LazyPhoto';

const BASE_HEIGHT = 240;
// 超過此數量自動啟用 LazyPhoto 懶掛載（減少手機 DOM 負擔）
const VIRTUAL_THRESHOLD = 100;

/**
 * PhotoCard — 單張相片卡片（不含外層 flex 容器，由 PhotoGrid 決定包裹方式）
 *
 * 封裝：佔位底色 + blur preview 漸進式載入 + 選擇模式 overlay
 */
function PhotoCard({ photo, isSelectMode, onSetCover, ratio }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const thumbUrl   = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w400`;
  const previewUrl = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w100`;
  const highResUrl = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w1600`;
  const width      = photo.imageMediaMetadata?.width  || 1200;
  const height     = photo.imageMediaMetadata?.height || 1600;

  return (
    <>
      {/* 比例撐高（在 absolute 佈局中維持容器高度） */}
      <i style={{ display: 'block', paddingBottom: `${(height / width) * 100}%` }} />

      <Item original={highResUrl} thumbnail={thumbUrl} width={width} height={height} alt={photo.name || '照片'}>
        {({ ref, open }) => (
          <div
            ref={ref}
            className={`absolute inset-0 cursor-pointer overflow-hidden rounded-xl shadow-sm transition-all duration-300 ${
              isSelectMode
                ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900 scale-95 hover:scale-100 rotate-1'
                : 'hover:shadow-md'
            }`}
            onClick={(e) => {
              if (isSelectMode) {
                e.stopPropagation();
                onSetCover(photo.id, `https://drive.google.com/thumbnail?id=${photo.id}&sz=w800`);
              } else {
                open(e);
              }
            }}
          >
            {/* ── 佔位底色（始終存在） ── */}
            <div className="absolute inset-0 bg-stone-200 dark:bg-zinc-800 rounded-xl" />

            {/* ── 極低解析度模糊 Preview（先行載入） ── */}
            <img
              src={previewUrl}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 w-full h-full object-cover rounded-xl scale-110 blur-sm transition-opacity duration-300 ${
                imgLoaded ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {/* ── 真實縮圖（載入完成後淡入） ── */}
            <img
              src={thumbUrl}
              alt={photo.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover rounded-xl transition-all duration-500 ${
                isSelectMode
                  ? `${imgLoaded ? 'opacity-70' : 'opacity-0'} group-hover:scale-110`
                  : `${imgLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`
              }`}
            />

            {/* ── 選擇模式 Overlay ── */}
            {isSelectMode && (
              <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center rounded-xl">
                <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg transform scale-110 animate-bounce">
                  <Images size={20} />
                </div>
              </div>
            )}

            {/* ── Hover 時顯示檔名 ── */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 pointer-events-none rounded-xl">
              <span className="text-white text-[10px] font-medium truncate w-full drop-shadow-sm">
                {photo.name}
              </span>
            </div>
          </div>
        )}
      </Item>
    </>
  );
}

/**
 * PhotoGrid — 相片網格佈局元件（含 PhotoSwipe 燈箱整合）
 *
 * 職責：
 *   1. Justified / Masonry 排版（flex-wrap）
 *   2. 漸進式影像顯示（佔位底色 → blur preview → 真實縮圖）
 *   3. 虛擬滾動：超過 100 張時以 LazyPhoto 包裹，降低手機 DOM 負擔
 *   4. 燈箱 onBeforeOpen 設定（鍵盤 / 下載 / 設封面 按鈕）
 *   5. Layout Shift 防護（isFetchingMore 時底部補 Skeleton）
 *   6. 選擇封面模式
 *
 * @param {Array}    photos        - { id, name, imageMediaMetadata }
 * @param {Function} onSetCover    - 設定封面回調 (id, url)，null 則不顯示按鈕
 * @param {Boolean}  isSelectMode  - 封面選擇模式
 * @param {Boolean}  isFetchingMore- 是否正在背景載入更多
 */
export default function PhotoGrid({ photos = [], onSetCover = null, isSelectMode = false, isFetchingMore = false }) {
  const useVirtualScroll = photos.length > VIRTUAL_THRESHOLD;

  // ── PhotoSwipe 燈箱前置設定 ────────────────────────────────────────────
  const handleBeforeOpen = (pswpInstance) => {
    pswpInstance.options.activeTransitionDuration = 600;
    pswpInstance.options.mainScrollEndFriction = 0.1;

    const forceAnimateSlide = (delta) => {
      if (pswpInstance.mainScroll) {
        if (typeof pswpInstance.mainScroll.moveIndexBy === 'function') {
          pswpInstance.mainScroll.moveIndexBy(delta, true);
        } else {
          delta > 0 ? pswpInstance.next() : pswpInstance.prev();
        }
      }
    };

    pswpInstance.on('keydown', (e) => {
      const { key } = e.originalEvent;
      if (key === 'ArrowRight' || key === 'ArrowLeft') {
        e.preventDefault();
        forceAnimateSlide(key === 'ArrowRight' ? 1 : -1);
      }
    });

    pswpInstance.next = () => forceAnimateSlide(1);
    pswpInstance.prev = () => forceAnimateSlide(-1);

    pswpInstance.on('uiRegister', () => {
      // 燈箱內「設為封面」按鈕
      if (onSetCover) {
        pswpInstance.ui.registerElement({
          name: 'set-cover-button',
          order: 8,
          isButton: true,
          html: '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
          onInit: (el, pswp) => {
            el.setAttribute('title', '將此張照片設為相簿封面');
            el.onclick = () => {
              const currentPhoto = photos[pswp.currIndex];
              if (currentPhoto) {
                onSetCover(currentPhoto.id, `https://drive.google.com/thumbnail?id=${currentPhoto.id}&sz=w800`);
              }
            };
          },
        });
      }

      // 燈箱內「下載原圖」按鈕
      pswpInstance.ui.registerElement({
        name: 'custom-download-button',
        order: 9,
        isButton: true,
        tagName: 'a',
        html: '<svg aria-hidden="true" class="pswp__icn" viewBox="0 0 32 32" width="32" height="32"><path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 15.8l6 6.4 6-6.4z"/><path d="M23 23H9v2h14z"/></svg>',
        onInit: (el, pswp) => {
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener');
          el.setAttribute('title', '下載原圖');
          pswp.on('change', () => {
            const currentPhoto = photos[pswp.currIndex];
            if (currentPhoto) {
              el.href = `https://drive.google.com/uc?export=download&id=${currentPhoto.id}`;
            }
          });
        },
      });
    });
  };

  return (
    <Gallery
      onBeforeOpen={handleBeforeOpen}
      options={{
        zoom: true,
        bgOpacity: 0.9,
        activeTransitionDuration: 600,
        mainScrollEndFriction: 0.1,
        showHideAnimationType: 'zoom',
        allowPanToNext: true,
        clickToCloseNonZoomable: false,
      }}
    >
      <div className="flex flex-wrap gap-2 md:gap-4 after:content-[''] after:flex-[10_1_0%]">
        {photos.map((photo) => {
          const width  = photo.imageMediaMetadata?.width  || 1200;
          const height = photo.imageMediaMetadata?.height || 1600;
          const ratio  = width / height;

          const card = (
            <PhotoCard
              photo={photo}
              ratio={ratio}
              isSelectMode={isSelectMode}
              onSetCover={onSetCover}
            />
          );

          // 超過閾值：用 LazyPhoto 包裹（Intersection Observer 懶掛載）
          // 未達閾值：直接渲染，保留 Masonry 精確度並避免 Observer 開銷
          if (useVirtualScroll) {
            return (
              <LazyPhoto key={photo.id} ratio={ratio} baseHeight={BASE_HEIGHT}>
                {card}
              </LazyPhoto>
            );
          }
          return (
            <div
              key={photo.id}
              className="relative group mb-2 md:mb-0"
              style={{ flexGrow: ratio, flexBasis: `${ratio * BASE_HEIGHT}px` }}
            >
              {card}
            </div>
          );
        })}
      </div>

      {/* ── Layout Shift 防護：背景載入時底部補 Skeleton ── */}
      {isFetchingMore && (
        <div className="flex flex-wrap gap-2 md:gap-4 mt-2 md:mt-4 after:content-[''] after:flex-[10_1_0%] animate-pulse pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => {
            const mockRatios = [1.33, 0.75, 1.77, 1, 1.5, 0.8];
            const ratio = mockRatios[i % 6];
            return (
              <div
                key={`skeleton-${i}`}
                className="relative bg-stone-200 dark:bg-zinc-800 rounded-xl mb-2 md:mb-0"
                style={{ flexGrow: ratio, flexBasis: `${ratio * BASE_HEIGHT}px` }}
              >
                <i style={{ display: 'block', paddingBottom: `${(1 / ratio) * 100}%` }} />
              </div>
            );
          })}
        </div>
      )}
    </Gallery>
  );
}
