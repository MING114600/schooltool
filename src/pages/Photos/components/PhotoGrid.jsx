import React, { useState, useCallback, useRef, useEffect } from 'react';
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
function PhotoCard({ photo, isSelectMode, onSetCover, ratio, onLoadRatio, innerRef, openLightbox, isEager = false }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const thumbUrl   = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w400`;
  const previewUrl = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w100`;
  
  const md = photo.imageMediaMetadata || {};
  const hasMeta = !!(md.width && md.height);

  return (
    <div
      ref={innerRef}
      className={`absolute inset-0 cursor-pointer overflow-hidden rounded-xl shadow-sm transition-all duration-300 ${
        isSelectMode
          ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900 scale-95 hover:scale-100 rotate-1'
          : 'hover:shadow-md'
      }`}
      onClick={openLightbox}
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
        loading={isEager ? "eager" : "lazy"}
        fetchPriority={isEager ? "high" : "auto"}
        onLoad={(e) => {
          setImgLoaded(true);
          // 抓不到 Meta 時動態補齊真實比例，避免跑版
          if (!hasMeta && onLoadRatio) {
            onLoadRatio(photo.id, e.target.naturalWidth / e.target.naturalHeight);
          }
        }}
        onError={(e) => {
          // Google Drive API 偶發 403/429 或轉檔中，優雅降級到模糊預覽圖
          if (e.target.src !== previewUrl) {
            e.target.src = previewUrl;
            setImgLoaded(true);
          }
        }}
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
  const [loadedRatios, setLoadedRatios] = useState({});
  const pswpRef = useRef(null);

  const handleRatioLoad = useCallback((id, ratio) => {
    setLoadedRatios(prev => prev[id] ? prev : { ...prev, [id]: ratio });
  }, []);

  // 當背景載入更多照片時，即時更新已經開啟的燈箱
  useEffect(() => {
    const pswp = pswpRef.current;
    if (pswp && pswp.isOpen) {
      // 重建 dataSource (模擬 Item 的結構)
      const newDataSource = photos.map((photo) => {
        const md = photo.imageMediaMetadata || {};
        const hasMeta = !!(md.width && md.height);
        let ratio = loadedRatios[photo.id];
        
        if (!ratio) {
           if (hasMeta) {
              let w = md.width; let h = md.height;
              if (md.rotation === 90 || md.rotation === 270) { w = md.height; h = md.width; }
              ratio = w / h;
           } else {
              ratio = 1.33;
           }
        }

        const width = hasMeta ? (md.rotation === 90 || md.rotation === 270 ? md.height : md.width) : 1600 * ratio;
        const height = hasMeta ? (md.rotation === 90 || md.rotation === 270 ? md.width : md.height) : 1600;

        return {
          src: `https://drive.google.com/thumbnail?id=${photo.id}&sz=w1600`,
          msrc: `https://drive.google.com/thumbnail?id=${photo.id}&sz=w400`,
          w: Math.round(width),
          h: Math.round(height),
          alt: photo.name || '照片'
        };
      });

      // 強制覆寫 dataSource 並刷新
      pswp.options.dataSource = newDataSource;
      if (typeof pswp.refreshSlideContent === 'function') {
         pswp.refreshSlideContent(pswp.currIndex);
      }
      if (pswp.ui && typeof pswp.ui.update === 'function') {
         pswp.ui.update();
      }
    }
  }, [photos, loadedRatios]);

  // ── PhotoSwipe 燈箱前置設定 ────────────────────────────────────────────
  const handleBeforeOpen = (pswpInstance) => {
    pswpRef.current = pswpInstance;
    pswpInstance.on('close', () => { 
      pswpRef.current = null; 
      
      // 退出燈箱時自動捲動到最後觀看的照片位置
      const currentPhoto = photos[pswpInstance.currIndex];
      if (currentPhoto) {
        const el = document.getElementById(`photo-card-${currentPhoto.id}`);
        if (el) {
          // 使用 setTimeout 確保在 PhotoSwipe 關閉動畫啟動後執行
          setTimeout(() => {
            const rect = el.getBoundingClientRect();
            const inView = rect.top >= 100 && rect.bottom <= window.innerHeight - 100;
            if (!inView) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 50);
        }
      }
    });

    pswpInstance.options.activeTransitionDuration = 600;
    pswpInstance.options.mainScrollEndFriction = 0.1;
    pswpInstance.options.loop = true; // 已經解決 Lazy 導致的長度缺陷，恢復無限循環
    pswpInstance.options.errorMsg = '<div class="pswp__error-msg">圖片載入異常，可能是滑動過快或網路不穩定。請稍後再試或重新開啟燈箱。</div>';

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
        {photos.map((photo, index) => {
          const isFirstTen = index < 10;
          const shouldLazyLoad = useVirtualScroll && !isFirstTen;
          let ratio = loadedRatios[photo.id];

          if (!ratio) {
            const md = photo.imageMediaMetadata || {};
            if (md.width && md.height) {
              let w = md.width;
              let h = md.height;
              if (md.rotation === 90 || md.rotation === 270) {
                w = md.height;
                h = md.width;
              }
              ratio = w / h;
            } else {
              ratio = 1.33; // 預設容錯比例，載入後會自動被 onLoad 校正
            }
          }

          const md = photo.imageMediaMetadata || {};
          const hasMeta = !!(md.width && md.height);
          const widthForLightBox = hasMeta ? (md.rotation === 90 || md.rotation === 270 ? md.height : md.width) : 1600 * ratio;
          const heightForLightBox = hasMeta ? (md.rotation === 90 || md.rotation === 270 ? md.width : md.height) : 1600;

          const thumbUrl   = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w400`;
          const highResUrl = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w1600`;

          return (
            <Item key={photo.id} original={highResUrl} thumbnail={thumbUrl} width={Math.round(widthForLightBox)} height={Math.round(heightForLightBox)} alt={photo.name || '照片'}>
              {({ ref, open }) => {
                const handleOpenItem = (e) => {
                  if (isSelectMode) {
                    e.stopPropagation();
                    if (onSetCover) onSetCover(photo.id, `https://drive.google.com/thumbnail?id=${photo.id}&sz=w800`);
                  } else if (open) {
                    open(e);
                  }
                };

                const renderCard = () => (
                  <PhotoCard
                    photo={photo}
                    ratio={ratio}
                    isSelectMode={isSelectMode}
                    onSetCover={onSetCover}
                    onLoadRatio={handleRatioLoad}
                    innerRef={ref}
                    openLightbox={handleOpenItem}
                    isEager={isFirstTen}
                  />
                );

                if (shouldLazyLoad) {
                  return (
                    <LazyPhoto id={`photo-card-${photo.id}`} ratio={ratio} baseHeight={BASE_HEIGHT} innerRef={ref} onOpen={handleOpenItem}>
                      {renderCard()}
                    </LazyPhoto>
                  );
                }
                return (
                  <div id={`photo-card-${photo.id}`} className="relative group mb-2 md:mb-0" style={{ flexGrow: ratio, flexBasis: `${ratio * BASE_HEIGHT}px` }}>
                    <i style={{ display: 'block', paddingBottom: `${(1 / ratio) * 100}%` }} />
                    {renderCard()}
                  </div>
                );
              }}
            </Item>
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
