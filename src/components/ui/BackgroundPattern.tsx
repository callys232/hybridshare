'use client';

import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Shared wrapper
// ─────────────────────────────────────────────────────────────────────────────

interface PatternProps {
  className?: string;
  opacity?: number;
}

function PatternBase({ children, className, opacity = 1 }: PatternProps & { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className={cn('absolute inset-0 overflow-hidden pointer-events-none select-none', className)}
      style={{ opacity }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CIRCLES — concentric rings + rising bubbles  (login page)
// ─────────────────────────────────────────────────────────────────────────────

export function CirclesPattern({ className, opacity }: PatternProps) {
  return (
    <PatternBase className={className} opacity={opacity}>
      <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="cp-fade" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Concentric rings — centred */}
        {[60, 120, 180, 240, 300, 360, 420].map((r, i) => (
          <circle key={r} cx="400" cy="300" r={r}
            fill="none" stroke="var(--pat-red)" strokeWidth="0.6"
            strokeOpacity={0.06 - i * 0.005}
            strokeDasharray={i % 2 === 0 ? 'none' : '4 8'}>
            <animateTransform attributeName="transform" type="scale"
              values="1;1.04;1" dur={`${10 + i * 3}s`} repeatCount="indefinite"
              additive="sum" />
          </circle>
        ))}

        {/* Smaller offset ring cluster — top-left */}
        {[40, 80, 120].map((r, i) => (
          <circle key={`tl-${r}`} cx="80" cy="80" r={r}
            fill="none" stroke="var(--pat-ink)" strokeWidth="0.5" strokeOpacity={0.05 - i * 0.01}>
            <animateTransform attributeName="transform" type="rotate"
              values={`0 80 80;${i % 2 === 0 ? 360 : -360} 80 80`}
              dur={`${20 + i * 8}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Floating bubbles */}
        {[
          { cx: 120, cy: 520, r: 6,  dur: '12s', delay: '0s'   },
          { cx: 200, cy: 560, r: 4,  dur: '15s', delay: '2s'   },
          { cx: 340, cy: 590, r: 8,  dur: '18s', delay: '4s'   },
          { cx: 460, cy: 570, r: 5,  dur: '14s', delay: '1s'   },
          { cx: 600, cy: 540, r: 7,  dur: '16s', delay: '6s'   },
          { cx: 700, cy: 580, r: 4,  dur: '11s', delay: '3s'   },
          { cx: 760, cy: 510, r: 9,  dur: '20s', delay: '5s'   },
          { cx:  60, cy: 480, r: 5,  dur: '13s', delay: '7s'   },
        ].map(({ cx, cy, r, dur, delay }) => (
          <circle key={`b-${cx}`} cx={cx} cy={cy} r={r}
            fill="var(--pat-red)" fillOpacity="0.07">
            <animateTransform attributeName="transform" type="translate"
              values={`0,0; ${(cx % 20) - 10},${-(cy * 0.9)}`}
              dur={dur} begin={delay} repeatCount="indefinite"
              calcMode="spline" keySplines="0.4 0 0.6 1" />
            <animate attributeName="fill-opacity" values="0.07;0;0.07"
              dur={dur} begin={delay} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Pulse ring at centre */}
        <circle cx="400" cy="300" r="30" fill="none" stroke="var(--pat-red)" strokeWidth="1" strokeOpacity="0">
          <animate attributeName="r" values="20;80" dur="4s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.15;0" dur="4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </PatternBase>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SHAPES — triangles, hexagons, squares, diamonds  (register page)
// ─────────────────────────────────────────────────────────────────────────────

export function ShapesPattern({ className, opacity }: PatternProps) {
  const shapes = [
    { d: 'M50,10 L90,80 L10,80 Z',        x: 60,  y: 40,  rot: '0 50 50',   dur: '22s', stroke: 'var(--pat-red)',    dash: '' },
    { d: 'M50,10 L90,80 L10,80 Z',        x: 680, y: 80,  rot: '180 50 50', dur: '18s', stroke: 'var(--pat-blue)',   dash: '3 5' },
    { d: 'M50,10 L90,80 L10,80 Z',        x: 300, y: 480, rot: '60 50 50',  dur: '25s', stroke: 'var(--pat-ink)',    dash: '' },
    { d: 'M50,10 L90,80 L10,80 Z',        x: 700, y: 420, rot: '30 50 50',  dur: '20s', stroke: 'var(--pat-purple)', dash: '2 6' },
    { d: 'M50,0 L100,50 L50,100 L0,50 Z', x: 180, y: 60,  rot: '0 50 50',   dur: '28s', stroke: 'var(--pat-green)',  dash: '' },
    { d: 'M50,0 L100,50 L50,100 L0,50 Z', x: 580, y: 300, rot: '45 50 50',  dur: '16s', stroke: 'var(--pat-amber)',  dash: '4 6' },
    { d: 'M50,0 L95,25 L95,75 L50,100 L5,75 L5,25 Z', x: 420, y: 50,  rot: '0 50 50',  dur: '30s', stroke: 'var(--pat-purple)', dash: '2 4' },
    { d: 'M50,0 L95,25 L95,75 L50,100 L5,75 L5,25 Z', x: 100, y: 380, rot: '30 50 50', dur: '24s', stroke: 'var(--pat-red)',    dash: '' },
    { d: 'M10,10 L90,10 L90,90 L10,90 Z', x: 720, y: 200, rot: '45 50 50',  dur: '20s', stroke: 'var(--pat-ink)',    dash: '3 3' },
    { d: 'M10,10 L90,10 L90,90 L10,90 Z', x: 240, y: 520, rot: '15 50 50',  dur: '26s', stroke: 'var(--pat-blue)',   dash: '' },
  ];

  return (
    <PatternBase className={className} opacity={opacity}>
      <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {shapes.map((s, i) => (
          <g key={i} transform={`translate(${s.x},${s.y}) scale(0.6)`}>
            <path d={s.d} fill="none" stroke={s.stroke} strokeWidth="1.2"
              strokeOpacity="0.1" strokeDasharray={s.dash || undefined}>
              <animateTransform attributeName="transform" type="rotate"
                values={`${s.rot};${s.rot.replace('0 ', '360 ')}`}
                dur={s.dur} repeatCount="indefinite" />
            </path>
          </g>
        ))}

        {/* Scattered dots */}
        {Array.from({ length: 30 }, (_, i) => {
          const x = ((i * 137.5) % 800);
          const y = ((i * 97.3) % 600);
          return (
            <circle key={`d-${i}`} cx={x} cy={y} r="1.5" fill="var(--pat-ink)" fillOpacity="0.04">
              <animate attributeName="fill-opacity" values="0.04;0.1;0.04"
                dur={`${4 + (i % 5)}s`} begin={`${(i % 7) * 0.5}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </svg>
    </PatternBase>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. STICKMAN — animated walking stick figures  (dashboard)
// ─────────────────────────────────────────────────────────────────────────────

function Stickman({ x, y, scale = 1, dur = '3s', delay = '0s', color = 'var(--pat-ink)', opacity = 0.08 }: {
  x: number; y: number; scale?: number; dur?: string; delay?: string; color?: string; opacity?: number;
}) {
  const s = scale;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={opacity}>
      <circle cx="0" cy="-32" r="8" fill="none" stroke={color} strokeWidth="2" />
      <line x1="0" y1="-24" x2="0" y2="0" stroke={color} strokeWidth="2" />
      <line x1="0" y1="-18" x2="-12" y2="-8" stroke={color} strokeWidth="2">
        <animateTransform attributeName="transform" type="rotate"
          values="0 0 -18;20 0 -18;0 0 -18;-20 0 -18;0 0 -18" dur={dur} begin={delay} repeatCount="indefinite" />
      </line>
      <line x1="0" y1="-18" x2="12" y2="-8" stroke={color} strokeWidth="2">
        <animateTransform attributeName="transform" type="rotate"
          values="0 0 -18;-20 0 -18;0 0 -18;20 0 -18;0 0 -18" dur={dur} begin={delay} repeatCount="indefinite" />
      </line>
      <line x1="0" y1="0" x2="-10" y2="18" stroke={color} strokeWidth="2">
        <animateTransform attributeName="transform" type="rotate"
          values="0 0 0;20 0 0;0 0 0;-20 0 0;0 0 0" dur={dur} begin={delay} repeatCount="indefinite" />
      </line>
      <line x1="0" y1="0" x2="10" y2="18" stroke={color} strokeWidth="2">
        <animateTransform attributeName="transform" type="rotate"
          values="0 0 0;-20 0 0;0 0 0;20 0 0;0 0 0" dur={dur} begin={delay} repeatCount="indefinite" />
      </line>
      <animateTransform attributeName="transform" type="translate"
        values={`${x},${y};${x + 800},${y}`}
        dur={`${parseInt(dur) * 15}s`} begin={delay} repeatCount="indefinite"
        additive="replace" />
    </g>
  );
}

export function StickmanPattern({ className, opacity }: PatternProps) {
  return (
    <PatternBase className={className} opacity={opacity}>
      <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="520" x2="800" y2="520" stroke="var(--pat-ink)" strokeWidth="0.5" strokeOpacity="0.05" />
        <line x1="0" y1="580" x2="800" y2="580" stroke="var(--pat-ink)" strokeWidth="0.5" strokeOpacity="0.03" />

        <Stickman x={-60}  y={520} scale={1.2} dur="1.2s" delay="0s" color="var(--pat-ink)" opacity={0.07} />
        <Stickman x={-200} y={520} scale={0.9} dur="1.4s" delay="2s" color="var(--pat-red)" opacity={0.05} />
        <Stickman x={-400} y={520} scale={1.0} dur="1.1s" delay="4s" color="var(--pat-ink)" opacity={0.06} />

        <line x1="0" y1="200" x2="800" y2="200" stroke="var(--pat-ink)" strokeWidth="0.5" strokeOpacity="0.04" />
        <Stickman x={800} y={200} scale={0.8} dur="1.3s" delay="1s" color="var(--pat-blue)" opacity={0.05} />
        <Stickman x={600} y={200} scale={0.7} dur="1.5s" delay="3s" color="var(--pat-ink)"  opacity={0.04} />

        {Array.from({ length: 20 }, (_, i) => (
          <circle key={i} cx={(i * 43) % 800} cy={(i * 67 + 100) % 400 + 60}
            r="1.5" fill="var(--pat-red)" fillOpacity="0.04">
            <animate attributeName="cy" values={`${(i * 67 + 100) % 400 + 60};${(i * 67 + 100) % 400 + 30};${(i * 67 + 100) % 400 + 60}`}
              dur={`${5 + i % 4}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
    </PatternBase>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GRID — dot matrix with animated pulse wave  (files page)
// ─────────────────────────────────────────────────────────────────────────────

export function GridPattern({ className, opacity }: PatternProps) {
  const cols = 20;
  const rows = 14;
  const dots = Array.from({ length: cols * rows }, (_, i) => ({
    col: i % cols,
    row: Math.floor(i / cols),
    delay: `${((i % cols) * 0.05 + Math.floor(i / cols) * 0.08).toFixed(2)}s`,
  }));

  return (
    <PatternBase className={className} opacity={opacity}>
      <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {dots.map(({ col, row, delay }) => (
          <circle
            key={`${col}-${row}`}
            cx={(col + 0.5) * (800 / cols)}
            cy={(row + 0.5) * (600 / rows)}
            r="1.4" fill="var(--pat-ink)" fillOpacity="0.06"
          >
            <animate attributeName="fill-opacity" values="0.06;0.18;0.06"
              dur="4s" begin={delay} repeatCount="indefinite" />
            <animate attributeName="r" values="1.4;2.2;1.4"
              dur="4s" begin={delay} repeatCount="indefinite" />
          </circle>
        ))}

        <line x1="0" y1="0" x2="0" y2="600" stroke="var(--pat-red)" strokeWidth="60" strokeOpacity="0.02">
          <animateTransform attributeName="transform" type="translate"
            values="-60,0;860,0;-60,0" dur="8s" repeatCount="indefinite"
            calcMode="linear" />
        </line>
      </svg>
    </PatternBase>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. NODES — network graph with animated connections  (connectors page)
// ─────────────────────────────────────────────────────────────────────────────

export function NodesPattern({ className, opacity }: PatternProps) {
  const nodes = [
    { id: 'A', x: 100, y: 150 }, { id: 'B', x: 300, y: 80  }, { id: 'C', x: 500, y: 180 },
    { id: 'D', x: 700, y: 100 }, { id: 'E', x: 200, y: 320 }, { id: 'F', x: 420, y: 380 },
    { id: 'G', x: 640, y: 280 }, { id: 'H', x: 760, y: 400 }, { id: 'I', x: 80,  y: 460 },
    { id: 'J', x: 350, y: 500 }, { id: 'K', x: 570, y: 520 }, { id: 'L', x: 680, y: 560 },
  ];
  const edges = [
    ['A','B'],['B','C'],['C','D'],['A','E'],['B','E'],['C','F'],
    ['D','G'],['E','F'],['F','G'],['G','H'],['E','I'],['F','J'],
    ['G','K'],['H','L'],['I','J'],['J','K'],['K','L'],['C','G'],
  ];

  return (
    <PatternBase className={className} opacity={opacity}>
      <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {edges.map(([a, b], i) => {
          const na = nodes.find(n => n.id === a)!;
          const nb = nodes.find(n => n.id === b)!;
          return (
            <line key={`e-${i}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke="var(--pat-ink)" strokeWidth="0.8" strokeOpacity="0.07"
              strokeDasharray="4 6">
              <animate attributeName="stroke-opacity" values="0.07;0.18;0.07"
                dur={`${4 + (i % 4)}s`} begin={`${(i % 6) * 0.4}s`} repeatCount="indefinite" />
            </line>
          );
        })}
        {edges.slice(0, 8).map(([a, b], i) => {
          const na = nodes.find(n => n.id === a)!;
          const nb = nodes.find(n => n.id === b)!;
          return (
            <circle key={`p-${i}`} r="3" fill="var(--pat-red)" fillOpacity="0.25">
              <animateMotion dur={`${3 + i * 0.7}s`} begin={`${i * 0.6}s`} repeatCount="indefinite">
                <mpath xlinkHref={`#edge-path-${i}`} />
              </animateMotion>
              <path id={`edge-path-${i}`} d={`M ${na.x} ${na.y} L ${nb.x} ${nb.y}`} fill="none" />
            </circle>
          );
        })}
        {nodes.map((n, i) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r="10" fill="none" stroke="var(--pat-ink)" strokeWidth="1" strokeOpacity="0.08">
              <animate attributeName="r" values="10;14;10" dur={`${3 + i % 3}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0.08;0.2;0.08" dur={`${3 + i % 3}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={n.x} cy={n.y} r="3" fill="var(--pat-ink)" fillOpacity="0.12" />
          </g>
        ))}
      </svg>
    </PatternBase>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. LINES — geometric flowing lines  (settings pages)
// ─────────────────────────────────────────────────────────────────────────────

export function LinesPattern({ className, opacity }: PatternProps) {
  return (
    <PatternBase className={className} opacity={opacity}>
      <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {Array.from({ length: 14 }, (_, i) => (
          <line key={`dl-${i}`}
            x1={i * 70 - 200} y1="0"
            x2={i * 70 + 400} y2="600"
            stroke="var(--pat-ink)" strokeWidth="0.5" strokeOpacity="0.04"
            strokeDasharray={i % 3 === 0 ? 'none' : `${6 + i % 3} ${8 + i % 4}`}>
            <animateTransform attributeName="transform" type="translate"
              values="0,0;70,0;0,0" dur={`${20 + i * 2}s`} repeatCount="indefinite" />
          </line>
        ))}

        {[100, 200, 300, 400, 500].map((y, i) => (
          <line key={`hl-${y}`} x1="0" y1={y} x2="800" y2={y}
            stroke="var(--pat-red)" strokeWidth="0.4" strokeOpacity="0.04"
            strokeDasharray="2 20">
            <animateTransform attributeName="transform" type="translate"
              values="0,0;-20,0;0,0" dur={`${12 + i * 3}s`} repeatCount="indefinite" />
          </line>
        ))}

        {[
          { x: 0,   y: 0,   d: 'M0,60 L0,0 L60,0'   },
          { x: 740, y: 0,   d: 'M0,0 L60,0 L60,60'  },
          { x: 0,   y: 540, d: 'M0,0 L0,60 L60,60'  },
          { x: 740, y: 540, d: 'M0,60 L60,60 L60,0' },
        ].map((b, i) => (
          <g key={`br-${i}`} transform={`translate(${b.x},${b.y})`}>
            <path d={b.d} fill="none" stroke="var(--pat-ink)" strokeWidth="1.5" strokeOpacity="0.06">
              <animate attributeName="stroke-opacity" values="0.06;0.14;0.06"
                dur="6s" begin={`${i}s`} repeatCount="indefinite" />
            </path>
          </g>
        ))}

        {[[160, 150], [640, 450], [400, 300]].map(([cx, cy], i) => (
          <g key={`ch-${i}`}>
            <line x1={cx - 12} y1={cy} x2={cx + 12} y2={cy} stroke="var(--pat-ink)" strokeWidth="0.8" strokeOpacity="0.06" />
            <line x1={cx} y1={cy - 12} x2={cx} y2={cy + 12} stroke="var(--pat-ink)" strokeWidth="0.8" strokeOpacity="0.06" />
            <circle cx={cx} cy={cy} r="3" fill="none" stroke="var(--pat-ink)" strokeWidth="0.8" strokeOpacity="0.06" />
          </g>
        ))}
      </svg>
    </PatternBase>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. WAVES — flowing sine curves  (notifications / activity pages)
// ─────────────────────────────────────────────────────────────────────────────

export function WavesPattern({ className, opacity }: PatternProps) {
  return (
    <PatternBase className={className} opacity={opacity}>
      <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {[0, 80, 160, 240, 320, 400, 480].map((offset, i) => (
          <path
            key={i}
            fill="none"
            stroke={i % 2 === 0 ? 'var(--pat-red)' : 'var(--pat-ink)'}
            strokeWidth="0.7"
            strokeOpacity={0.05 - i * 0.005}
            d={`M-100,${offset + 60} C100,${offset + 20} 300,${offset + 100} 500,${offset + 40} S700,${offset + 80} 900,${offset + 60}`}
          >
            <animateTransform attributeName="transform" type="translate"
              values="0,0;-100,0;0,0" dur={`${8 + i * 2}s`} repeatCount="indefinite" />
          </path>
        ))}

        {Array.from({ length: 8 }, (_, i) => {
          const x = i * 110 + 40;
          const y = 100 + (i % 3) * 160;
          return (
            <path key={`dia-${i}`}
              d={`M${x},${y - 8} L${x + 8},${y} L${x},${y + 8} L${x - 8},${y} Z`}
              fill="none" stroke="var(--pat-red)" strokeWidth="0.8" strokeOpacity="0.07">
              <animateTransform attributeName="transform" type="rotate"
                values={`0 ${x} ${y};360 ${x} ${y}`} dur={`${10 + i * 3}s`} repeatCount="indefinite" />
            </path>
          );
        })}
      </svg>
    </PatternBase>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Named re-export for convenience
// ─────────────────────────────────────────────────────────────────────────────

export type PatternVariant = 'circles' | 'shapes' | 'stickman' | 'grid' | 'nodes' | 'lines' | 'waves';

export function BackgroundPattern({ variant, className, opacity }: PatternProps & { variant: PatternVariant }) {
  switch (variant) {
    case 'circles':  return <CirclesPattern  className={className} opacity={opacity} />;
    case 'shapes':   return <ShapesPattern   className={className} opacity={opacity} />;
    case 'stickman': return <StickmanPattern className={className} opacity={opacity} />;
    case 'grid':     return <GridPattern     className={className} opacity={opacity} />;
    case 'nodes':    return <NodesPattern    className={className} opacity={opacity} />;
    case 'lines':    return <LinesPattern    className={className} opacity={opacity} />;
    case 'waves':    return <WavesPattern    className={className} opacity={opacity} />;
  }
}
