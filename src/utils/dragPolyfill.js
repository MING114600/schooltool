import { polyfill } from "mobile-drag-drop";
// 引入預設的捲動行為處理 (當拖曳到邊緣時自動捲動)
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";

export function initDragPolyfill() {
  // 啟動 Polyfill
  polyfill({
    dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
    holdToDrag: 300,
  });

  // 修正 iOS Safari 的捲動干擾問題 (避免拖曳時整個畫面跟著動)
  document.addEventListener("touchmove", function(e) {}, { passive: false });

  // ★ 修復：新增全域保底監聽，確保任何拖曳操作結束時（包含 dragend 被 React 搶先的情況）
  // 都能透過 pointerup / touchend 觸發 dragend，防止 Polyfill 狀態機卡在「拖曳中」
  document.addEventListener("dragend", () => {}, true);

  // 針對 Chrome 的特殊行為：若拖曳時 DOM 節點消失，合成一個 pointercancel 來強制重置
  document.addEventListener("pointercancel", () => {}, true);
}