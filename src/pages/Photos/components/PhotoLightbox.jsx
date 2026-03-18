import React from 'react';
import { Gallery, Item } from 'react-photoswipe-gallery';
import { Images } from 'lucide-react';
import 'photoswipe/dist/photoswipe.css';

/**
 * PhotoLightbox — 控制相片網劇與 PhotoSwipe 燈箱
 * 
 * 支援「正常瀏覽」與「封面選擇模式」。
 * 
 * @param {Array} photos - 包含 { id, name, imageMediaMetadata } 的陣列
 * @param {Function} onSetCover - 設定封面回調 (id, url)
 * @param {Boolean} isSelectMode - 是否正處於封面選擇模式
 */
export default function PhotoLightbox({ photos = [], onSetCover = null, isSelectMode = false }) {

  // 自訂下載按鈕與切換動畫優化
  const handleBeforeOpen = (pswpInstance) => {
    // 確保動畫時間與阻尼感
    pswpInstance.options.activeTransitionDuration = 600;
    pswpInstance.options.mainScrollEndFriction = 0.1;

    // 解決鍵盤與按鈕點擊「瞬間跳轉」的問題：手動觸發帶有滑動動畫的位移
    const forceAnimateSlide = (delta) => {
      if (pswpInstance.mainScroll) {
        if (typeof pswpInstance.mainScroll.moveIndexBy === 'function') {
          pswpInstance.mainScroll.moveIndexBy(delta, true);
        } else {
          delta > 0 ? pswpInstance.next() : pswpInstance.prev();
        }
      }
    };

    // 重寫鍵盤監聽
    pswpInstance.on('keydown', (e) => {
      const { key } = e.originalEvent;
      if (key === 'ArrowRight' || key === 'ArrowLeft') {
        e.preventDefault();
        forceAnimateSlide(key === 'ArrowRight' ? 1 : -1);
      }
    });

    // 解決 UI 按鈕點擊無滑動動畫的問題
    pswpInstance.next = () => forceAnimateSlide(1);
    pswpInstance.prev = () => forceAnimateSlide(-1);

    pswpInstance.on('uiRegister', () => {
      // 🌟 Lightbox 內部的設為封面按鈕 (作為第二種路徑)
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
                const thumbUrl = `https://drive.google.com/thumbnail?id=${currentPhoto.id}&sz=w800`;
                onSetCover(currentPhoto.id, thumbUrl);
              }
            };
          }
        });
      }

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
        }
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
          const thumbUrl = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w400`;
          const highResUrl = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w1600`;
          const width = photo.imageMediaMetadata?.width || 1200;
          const height = photo.imageMediaMetadata?.height || 1600;
          const ratio = width / height;
          const baseHeight = 240;

          return (
            <div 
              key={photo.id} 
              className="relative group mb-2 md:mb-0"
              style={{
                flexGrow: ratio,
                flexBasis: `${ratio * baseHeight}px`,
              }}
            >
              <i style={{ display: 'block', paddingBottom: `${(height / width) * 100}%` }}></i>
              
              <Item
                original={highResUrl}
                thumbnail={thumbUrl}
                width={width}
                height={height}
                alt={photo.name || '照片'}
              >
                {({ ref, open }) => (
                  <div
                    className={`absolute inset-0 cursor-pointer overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 shadow-sm transition-all duration-300 ${
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
                    <img
                      ref={ref}
                      src={thumbUrl}
                      alt={photo.name}
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        isSelectMode ? 'opacity-70 group-hover:scale-110' : 'group-hover:scale-105'
                      }`}
                      loading="lazy"
                    />

                    {/* 選擇模式下的 Overlay */}
                    {isSelectMode && (
                      <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                        <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg transform scale-110 animate-bounce">
                          <Images size={20} />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 pointer-events-none">
                      <span className="text-white text-[10px] font-medium truncate w-full drop-shadow-sm">
                        {photo.name}
                      </span>
                    </div>
                  </div>
                )}
              </Item>
            </div>
          );
        })}
      </div>
    </Gallery>
  );
}
