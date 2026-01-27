import React, { useMemo, useState, useEffect } from "react";

// 1. 定義主題配置
const THEMES = {
  galaxy: {
    bg: "#020617",
    milkyWay: ["rgba(140, 190, 255, 0.12)", "rgba(210, 180, 255, 0.08)", "rgba(170, 210, 255, 0.05)"],
    starColors: ["#CFE8FF", "#FFFFFF", "#FFE9C4"],
    meteorColor: "rgba(255, 255, 255, 0.95)",
    rotation: -35, // 調整流星雨角度
  },
  deep: {
    bg: "#000000",
    milkyWay: ["rgba(50, 50, 50, 0.1)", "rgba(20, 20, 50, 0.05)", "transparent"],
    starColors: ["#FFFFFF", "#D1D5DB", "#9CA3AF"],
    meteorColor: "rgba(200, 220, 255, 0.8)",
    rotation: -20,
  },
  warm: {
    bg: "#0c0a09",
    milkyWay: ["rgba(255, 180, 100, 0.08)", "rgba(255, 120, 50, 0.05)", "rgba(255, 230, 150, 0.04)"],
    starColors: ["#FFEDD5", "#FEF3C7", "#FFFFFF"],
    meteorColor: "#FFEDD5",
    rotation: -45,
  },
  lavender: {
    bg: "#080510",
    milkyWay: ["rgba(168, 85, 247, 0.15)", "rgba(192, 132, 252, 0.1)", "rgba(232, 213, 255, 0.05)"],
    starColors: ["#F5F3FF", "#E9D5FF", "#DDD6FE", "#FFFFFF"],
    meteorColor: "#E9D5FF",
    rotation: -30,
  }
};

// 輔助工具：生成隨機星星
const generateStars = (count, sizeRange, opacityRange, colors) => {
  return Array.from({ length: count }).map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    opacity: opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0]),
    duration: 3 + Math.random() * 7,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
};

// 子組件：渲染星星層
const StarLayer = ({ stars }) => (
  <div className="absolute inset-0">
    {stars.map((s, i) => (
      <span
        key={i}
        style={{
          position: "absolute",
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: s.size,
          height: s.size,
          backgroundColor: s.color,
          opacity: s.opacity,
          borderRadius: "50%",
          animation: `twinkle ${s.duration}s ease-in-out infinite`,
          boxShadow: `0 0 ${s.size * 1.5}px ${s.color}`,
        }}
      />
    ))}
  </div>
);

// ✅ 新版子組件：事件驅動流星 (支援隨機亮度 + 連發)
const Meteors = ({
  color,
  angle = -35,
  minGap = 2000,      // 調快一點，避免畫面太冷清
  maxGap = 10000,
  burstChance = 0.20, // 20% 機率連發
  burstMin = 2,
  burstMax = 3,
}) => {
  const [meteors, setMeteors] = useState([]);

  useEffect(() => {
    let alive = true;
    const timers = new Set();
    const addTimer = (t) => timers.add(t);
    const clearAll = () => {
      for (const t of timers) clearTimeout(t);
      timers.clear();
    };

    // 定義流星等級
    const tiers = [
      { name: "dim", weight: 0.5, head: 1.5, tail: 20, glow: 0.2 },    // 暗：頭小尾短
      { name: "normal", weight: 0.3, head: 2.2, tail: 50, glow: 0.5 }, // 中：標準
      { name: "bright", weight: 0.2, head: 3.5, tail: 90, glow: 1.0 }, // 亮：大火球
    ];

    const pickTier = () => {
      const sum = tiers.reduce((a, t) => a + t.weight, 0);
      let r = Math.random() * sum;
      for (const t of tiers) {
        r -= t.weight;
        if (r <= 0) return t;
      }
      return tiers[0];
    };

    const spawnOne = (seed = {}) => {
      if (!alive) return;
      const tier = pickTier();
      const lum = 0.8 + Math.random() * 0.4; // 亮度微調
      const id = Math.random().toString(36).slice(2);
      
      const left = typeof seed.left === "number" ? seed.left : Math.random() * 100;
      // 讓起點更隨機，避免只從上面出來
      const top = typeof seed.top === "number" ? seed.top : -100 - Math.random() * 100; 

      const duration = 1.2 + Math.random() * 1.0;
      const travel = 600 + Math.random() * 500;

      setMeteors((m) => [
        ...m,
        { id, left, top, duration, travel, tier, lum },
      ]);

      // 動畫結束後銷毀
      const kill = setTimeout(() => {
        setMeteors((m) => m.filter((x) => x.id !== id));
        timers.delete(kill);
      }, duration * 1000 + 100);
      addTimer(kill);
    };

    const scheduleNext = () => {
      if (!alive) return;
      const doBurst = Math.random() < burstChance;

      if (doBurst) {
        // 連發模式
        const burstCount = burstMin + Math.floor(Math.random() * (burstMax - burstMin + 1));
        const baseLeft = Math.random() * 100;
        const baseTop = -100 - Math.random() * 50;

        for (let i = 0; i < burstCount; i++) {
          const spacing = 150 + Math.random() * 400; // 每顆之間的延遲
          const t = setTimeout(() => {
            spawnOne({
              left: Math.min(100, Math.max(0, baseLeft + (Math.random() - 0.5) * 20)),
              top: baseTop + (Math.random() - 0.5) * 30,
            });
            timers.delete(t);
          }, i * spacing);
          addTimer(t);
        }
      } else {
        // 單發
        spawnOne();
      }

      // 安排下一次
      const next = minGap + Math.random() * (maxGap - minGap);
      const n = setTimeout(() => {
        scheduleNext();
        timers.delete(n);
      }, next);
      addTimer(n);
    };

    // 啟動迴圈
    const start = setTimeout(scheduleNext, 500); 
    addTimer(start);

    return () => {
      alive = false;
      clearAll();
    };
  }, [color, minGap, maxGap, burstChance, burstMin, burstMax]);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ transform: `rotate(${angle}deg)` }}
    >
      {meteors.map((m) => (
        <span
          key={m.id}
          className="meteor"
          style={{
            left: `${m.left}%`,
            top: `${m.top}px`,
            width: `${m.tier.head}px`,
            height: `${m.tier.head}px`,
            animationDuration: `${m.duration}s`,
            "--travel": `${m.travel}px`,
            "--meteorColor": color,
            "--tailLen": `${m.tier.tail}px`, // 傳入尾巴基準長度
            "--lum": m.lum, // 傳入亮度係數
          }}
        />
      ))}
    </div>
  );
};

// 主組件
const StarryBackground = ({ theme = "galaxy", customStarCount, isWaking = false }) => {
  const config = THEMES[theme] || THEMES.galaxy;
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const far = useMemo(() => generateStars(customStarCount || 120, [0.5, 1], [0.15, 0.45], config.starColors), [theme, customStarCount]);
  const near = useMemo(() => generateStars(30, [1.5, 2.2], [0.5, 0.9], config.starColors), [theme]);

  return (
    <div 
      className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 ${isWaking ? 'opacity-0' : 'opacity-100'}`} 
      style={{ backgroundColor: config.bg }}
    >
      <div className={`w-full h-full transition-transform duration-700 ease-in-out ${isWaking ? 'scale-[1.5] blur-md' : 'scale-100'}`}>
        {/* 銀河層 */}
        <div 
          className="absolute inset-0 opacity-80 transition-transform duration-1000 ease-out" 
          style={{
            background: `
              radial-gradient(60% 40% at 30% 35%, ${config.milkyWay[0]}, transparent 60%),
              radial-gradient(50% 30% at 70% 35%, ${config.milkyWay[1]}, transparent 60%),
              linear-gradient(115deg, transparent 0%, ${config.milkyWay[2]} 50%, transparent 100%)
            `,
            filter: "blur(15px)",
            transform: `rotate(${config.rotation}deg) scale(1.2) translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)`,
          }}
        />

        {/* 遠/近 星星層 */}
        <div className="absolute inset-0 transition-transform duration-700 ease-out" style={{ transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` }}>
          <StarLayer stars={far} />
        </div>
        <div className="absolute inset-0 transition-transform duration-500 ease-out" style={{ transform: `translate(${mousePos.x * 60}px, ${mousePos.y * 60}px)` }}>
          <StarLayer stars={near} />
        </div>
      </div>

      {/* ✅ 新版流星：傳入角度與顏色 */}
      {!isWaking && (
        <Meteors 
          color={config.meteorColor} 
          angle={config.rotation} 
        />
      )}

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        .meteor {
          position: absolute;
          border-radius: 50%;
          background: var(--meteorColor);
          opacity: 0;
		  animation: meteor-fly 1 ease-in;
		  filter: drop-shadow(0 0 8px rgba(255,255,255,var(--glow, 0.4)));
		  will-change: transform, opacity;

        }

        .meteor::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 2px; 
          /* 尾巴長度動態計算：基礎長度 * 亮度係數 */
          height: calc(var(--tailLen) * var(--lum));
		  transform: translateX(-50%) translateY(-100%) scaleY(0.1);
		  background: linear-gradient(
			to top,
			rgba(255,255,255, calc(0.85 * var(--lum, 1))),
			rgba(255,255,255, 0.25),
			rgba(255,255,255, 0)
		  );
		  filter: blur(0.25px);

		  animation: meteor-tail 1 ease-out;
		  animation-duration: inherit;
		  animation-iteration-count: 1;
        }

        @keyframes meteor-fly {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(var(--travel));
            opacity: 0;
          }
        }
		
		@keyframes meteor-tail {
		  0%   { opacity: 0; transform: translateX(-50%) translateY(-100%) scaleY(0.1); }
		  15%  { opacity: 1; transform: translateX(-50%) translateY(-100%) scaleY(calc(var(--tailScale, 1.2) * 1.2)); }
		  60%  { opacity: 0.8; transform: translateX(-50%) translateY(-100%) scaleY(calc(var(--tailScale, 1.2) * 0.8)); }
		  100% { opacity: 0; transform: translateX(-50%) translateY(-100%) scaleY(0.1); }
		}
      `}</style>
    </div>
  );
};

export default StarryBackground;