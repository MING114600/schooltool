import React, { useMemo } from "react";

const generateStars = (count, sizeRange, opacityRange) => {
  return Array.from({ length: count }).map(() => {
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
    const opacity =
      opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0]);
    const duration = 3 + Math.random() * 7;

    const r = Math.random();
    const color = r > 0.88 ? "#FFE9C4" : r < 0.12 ? "#CFE8FF" : "#FFFFFF";

    return { x, y, size, opacity, duration, color };
  });
};

const StarLayer = ({ stars, className = "" }) => (
  <div className={`absolute inset-0 ${className}`}>
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
        }}
      />
    ))}
  </div>
);

const Meteors = ({ count = 3 }) => {
  const meteors = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const left = 10 + Math.random() * 80; // %
      const top = -30 - Math.random() * 30; // px，從畫面外開始
      const delay = Math.random() * 10; // 秒（越大越不常出現）
      const duration = 2.2 + Math.random() * 1.6; // 秒
      const travel = 900 + Math.random() * 400; // px
      return { i, left, top, delay, duration, travel };
    });
  }, [count]);

  return (
    <div className="meteor-field absolute inset-0 pointer-events-none">
      {meteors.map((m) => (
        <span
          key={m.i}
          className="meteor"
          style={{
            left: `${m.left}%`,
            top: `${m.top}px`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            // CSS 變數（React 允許自訂屬性名）
            ["--travel"]: `${m.travel}px`,
          }}
        />
      ))}
    </div>
  );
};

const StarryBackground = () => {
  const far = useMemo(() => generateStars(140, [0.5, 1], [0.18, 0.5]), []);
  const mid = useMemo(() => generateStars(90, [1, 1.6], [0.35, 0.8]), []);
  const near = useMemo(() => generateStars(45, [1.6, 2.3], [0.55, 1]), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#020617]">
      {/* 微霧狀銀河 */}
      <div className="milkyway absolute inset-0" />

      {/* 星星三層 */}
      <StarLayer stars={far} className="opacity-70" />
      <StarLayer stars={mid} className="opacity-70" />
      <StarLayer stars={near} className="opacity-80" />

      {/* 流星：點狀頭 + 尾巴拖曳 */}
      <Meteors count={3} />

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        .milkyway {
          background:
            radial-gradient(60% 40% at 30% 35%, rgba(140, 190, 255, 0.10), transparent 60%),
            radial-gradient(55% 35% at 55% 55%, rgba(210, 180, 255, 0.08), transparent 62%),
            radial-gradient(50% 30% at 70% 35%, rgba(255, 230, 200, 0.06), transparent 60%),
            radial-gradient(45% 28% at 45% 70%, rgba(170, 210, 255, 0.05), transparent 65%),
            linear-gradient(115deg,
              transparent 0%,
              rgba(120, 190, 255, 0.035) 35%,
              rgba(255, 230, 200, 0.025) 50%,
              rgba(170, 200, 255, 0.03) 65%,
              transparent 100%
            );
          filter: blur(14px);
          transform: rotate(-18deg) scale(1.15);
          opacity: 0.9;
          mix-blend-mode: screen;
          animation: drift 18s ease-in-out infinite alternate;
        }

        @keyframes drift {
          0% { transform: rotate(-18deg) scale(1.15) translate(-2%, -1%); }
          100% { transform: rotate(-18deg) scale(1.15) translate(2%, 1.5%); }
        }

        /* 旋轉「整個流星場」來決定斜向方向，裡面只沿 Y 軸飛 */
        .meteor-field {
          transform: rotate(-35deg);
          transform-origin: center;
        }

        /* 流星頭（亮點） */
        .meteor {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: rgba(255,255,255,0.95);
          opacity: 0;
          filter: drop-shadow(0 0 6px rgba(255,255,255,0.55));
          animation-name: meteor-fly;
          animation-timing-function: cubic-bezier(0.15, 0, 0.4, 1);
          animation-iteration-count: infinite;
        }

        /* 流星尾（在頭的後方，沿 -Y 拉出來） */
        .meteor::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 0;
          width: 2px;
          height: 60px; /* 尾巴最大基準長度 */
          transform: translateX(-50%) translateY(-100%) scaleY(0.2);
          border-radius: 999px;
          background: linear-gradient(
            to top,
            rgba(255,255,255,0.95),
            rgba(255,255,255,0.35),
            rgba(255,255,255,0.0)
          );
          filter: blur(0.2px);

          animation: meteor-tail;
          animation-duration: inherit;
          animation-delay: inherit;
          animation-timing-function: ease-out;
          animation-iteration-count: inherit;
        }

			@keyframes meteor-fly {
			  0% { 
				transform: translateY(0) scale(0.5); 
				opacity: 0; 
			  }
			  /* 縮短出現時間，增加爆發感 */
			  2% { 
				opacity: 1; 
				transform: translateY(20px) scale(1);
			  } 
			  /* 使用更劇烈的加速曲線，讓結尾更有消失在天際的感覺 */
			  100% { 
				transform: translateY(var(--travel)) scale(1.2); 
				opacity: 0; 
			  }
			}

			@keyframes meteor-tail {
			  0% { 
				opacity: 0; 
				transform: translateX(-50%) translateY(-100%) scaleY(0.1); 
			  }
			  /* 尾巴噴發：在 15% 處達到最長，然後慢慢縮回 */
			  15% { 
				opacity: 1; 
				transform: translateX(-50%) translateY(-100%) scaleY(1.8); 
			  }
			  60% {
				opacity: 0.8;
				transform: translateX(-50%) translateY(-100%) scaleY(1.2);
			  }
			  100% { 
				opacity: 0; 
				transform: translateX(-50%) translateY(-100%) scaleY(0.1); 
			  }
			}
        }
      `}</style>
    </div>
  );
};

export default StarryBackground;
