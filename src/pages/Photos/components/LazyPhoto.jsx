import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyPhoto — 使用 Intersection Observer 的懶掛載容器
 *
 * 當元素進入可視區域（含 rootMargin 緩衝）時，才真正掛載子元件。
 * 未進入視窗前保持佔位骨架，以正確維護捲動高度。
 *
 * @param {number}    ratio     - 畫面寬高比（用於計算骨架高度）
 * @param {number}    baseHeight
 * @param {ReactNode} children  - 實際的 PhotoCard 元素
 */
export default function LazyPhoto({ ratio, baseHeight = 240, children }) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // 一旦進入視窗即可永久掛載，不需再觀察
        }
      },
      {
        // ± 400px 緩衝：使用者看到前就預先渲染，避免白屏感
        rootMargin: '400px 0px',
        threshold: 0,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative group mb-2 md:mb-0"
      style={{ flexGrow: ratio, flexBasis: `${ratio * baseHeight}px` }}
    >
      {/* 佔位撐高（始終存在，防止 Layout Shift） */}
      <i style={{ display: 'block', paddingBottom: `${(1 / ratio) * 100}%` }} />

      {/* 進入視窗前：骨架底色；進入後：真實渲染 */}
      {isVisible ? (
        /* children 已包含 absolute inset-0 的定位 */
        children
      ) : (
        <div className="absolute inset-0 bg-stone-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
      )}
    </div>
  );
}
