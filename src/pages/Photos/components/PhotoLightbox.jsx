import React from 'react';
import { Gallery, Item } from 'react-photoswipe-gallery';
import 'photoswipe/dist/photoswipe.css';

/**
 * PhotoLightbox — 使用永不過期的 Google Drive thumbnail URL
 * 
 * URL 格式: https://drive.google.com/thumbnail?id=FILE_ID&sz=wSIZE
 * 此格式為官方穩定轉址，不需 cookie，不需 token，24小時後仍然有效。
 * 
 * @param {Array} photos - 包含 { id, name } 的陣列
 */
export default function PhotoLightbox({ photos = [] }) {

  // 自訂下載按鈕與切換動畫優化
  const handleBeforeOpen = (pswpInstance) => {
    // 確保動畫時間與阻尼感
    pswpInstance.options.activeTransitionDuration = 600;
    pswpInstance.options.mainScrollEndFriction = 0.1;

    // 解決鍵盤與按鈕點擊「瞬間跳轉」的問題：手動觸發帶有滑動動畫的位移
    const forceAnimateSlide = (delta) => {
      if (pswpInstance.mainScroll) {
        // PS5 內部的 moveIndexBy 是支援動畫的
        // 我們先檢查方法是否存在，避免再次報錯
        if (typeof pswpInstance.mainScroll.moveIndexBy === 'function') {
          pswpInstance.mainScroll.moveIndexBy(delta, true);
        } else {
          // 退而求其次：使用原本的 next/prev，但這就是目前使用者覺得沒動畫的地方
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
              // 使用穩定的 export=download 連結，不依賴 webContentLink
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
        // 增強切換時的滑動感：拉長時間與減少摩擦
        activeTransitionDuration: 600,
        mainScrollEndFriction: 0.1,
        showHideAnimationType: 'zoom',
        allowPanToNext: true,
        // 確保點擊或按鍵切換觸發平滑位移
        clickToCloseNonZoomable: false,
      }}
    >
      {/* 修改為「橫向流動式排列 (Justified Layout)」，符合一般相簿從左到右的閱讀邏輯，同時不破壞原始比例 */}
      <div className="flex flex-wrap gap-2 md:gap-4 after:content-[''] after:flex-[10_1_0%]">
        {photos.map((photo) => {
          // 使用官方穩定的縮圖 URL — 不過期、不需 cookie、速度快
          const thumbUrl = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w400`;
          const highResUrl = `https://drive.google.com/thumbnail?id=${photo.id}&sz=w1600`;

          // 取得原始高寬比，避免燈箱出現展開/拉伸造成的變形
          const width = photo.imageMediaMetadata?.width || 1200;
          const height = photo.imageMediaMetadata?.height || 1600;
          const ratio = width / height;
          // 基準高度 240px，讓畫面一排可以呈現 3~5 張照片
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
              {/* 利用 padding-bottom 撐開高度，維持完美比例 */}
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
                    className="absolute inset-0 cursor-pointer overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 shadow-sm hover:shadow-md transition-all"
                    onClick={open}
                  >
                    <img
                      ref={ref}
                      src={thumbUrl}
                      alt={photo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
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
