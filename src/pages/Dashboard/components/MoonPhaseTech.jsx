import React, { useMemo } from "react";

export default function MoonPhaseTech({
  size = 120,
  illumination = 1, // 0 ~ 1
  waxing = true,    // true: 右亮 (盈), false: 左亮 (虧)
  isIdle = false,
}) {
  const R = 45; // 月球半徑

  // --- 計算遮罩路徑 (維持不變) ---
  const maskPath = useMemo(() => {
    const value = (illumination - 0.5) * 2;
    const rx = Math.abs(R * value);
    const sweep = illumination > 0.5 ? 1 : 0;
    const outerSweep = waxing ? 1 : 0;
    const innerSweep = waxing ? (sweep) : (1 - sweep);

    return `
      M 0,-${R} 
      A ${R},${R} 0 0 ${outerSweep} 0,${R} 
      A ${rx},${R} 0 0 ${innerSweep} 0,-${R}
    `;
  }, [illumination, waxing, R]);

  // --- 新增：計算外光暈的強度 ---
  // 滿月時最亮(0.6)，新月時最暗(0.15)
  const haloOpacity = useMemo(() => 0.15 + (illumination * 0.45), [illumination]);

  return (
    <div
      className={`relative transition-all duration-[3000ms] ease-in-out
        ${isIdle ? "opacity-0 blur-xl scale-90" : "opacity-100 blur-0 scale-100"}`}
      style={{ width: size, height: size }}
    >
      {/* viewBox 稍微加大一點，容納外光暈 */}
      <svg viewBox="-70 -70 140 140" className="w-full h-full">
        <defs>
          {/* 1. 冷月本體漸層 */}
          <radialGradient id="coldOrbFill" cx="40%" cy="40%" r="55%" fx="40%" fy="40%">
            <stop offset="0%" stopColor="#FFFFFF" />    {/* 核心高光 */}
            <stop offset="60%" stopColor="#CBD5E1" />   {/* Slate-300 中層 */}
            <stop offset="100%" stopColor="#475569" />  {/* Slate-600 邊緣陰影 */}
          </radialGradient>

          {/* 2. 本體內發光 (Inner Glow) */}
          <filter id="moonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 3. 新增：大氣外光暈濾鏡 (Outer Halo) */}
          {/* 使用非常大的模糊半徑來模擬大氣散射 */}
          <filter id="outerHaloBlur" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="15" />
          </filter>

          {/* 4. 定義遮罩 */}
          <mask id="phaseMask">
            <rect x="-70" y="-70" width="140" height="140" fill="black" />
            <path d={maskPath} fill="white" />
          </mask>
        </defs>
        
        {/* --- Layer 0: 大氣外光暈 (The Halo) --- */}
        {/* 放在最底層，一個比月亮稍大的模糊圓圈 */}
        <circle 
            cx="0" cy="0" 
            r={R * 1.1} // 比本體稍大
            fill="#E2E8F0" // Slate-200 冷白光
            filter="url(#outerHaloBlur)"
            opacity={haloOpacity} // 動態透明度
            className="transition-opacity duration-[2000ms]"
        />

        {/* --- Layer 1: 暗面 (Earthshine) --- */}
        <circle cx="0" cy="0" r={R} fill="#111827" opacity="0.55" />
<circle cx="0" cy="0" r={R} fill="#6366F1" opacity="0.06" />

        {/* --- Layer 2: 亮面 (The Lit Side) --- */}
        <g mask="url(#phaseMask)">
           <circle cx="0" cy="0" r={R} fill="url(#coldOrbFill)" filter="url(#moonGlow)" />
           <circle cx="-10" cy="-10" r={R * 0.6} fill="white" opacity="0.1" filter="blur(8px)" />
        </g>
        
        {/* --- Layer 3: 邊緣光 (Rim Light) --- */}
        <circle
  cx="0" cy="0" r={R}
  fill="none"
  stroke="#818CF8"
  strokeWidth="0.8"
  opacity="0.12"
  filter="blur(1.2px)"
/>

      </svg>
    </div>
  );
}