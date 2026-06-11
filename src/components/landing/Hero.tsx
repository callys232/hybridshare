import Link from 'next/link';

// ── Hero-specific background scene ───────────────────────────────────────────
// Stickman A (left) hands a document to Stickman B (right) via an encrypted
// transfer arc. A coordinator stickman sits at the top center.
function HeroPattern() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 1200 660"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker id="hp-arr" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L9,3.5 Z" fill="#c12129" fillOpacity="0.55" />
          </marker>
          <marker id="hp-arr-sm" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 Z" fill="white" fillOpacity="0.18" />
          </marker>
        </defs>

        {/* ── Ground lines under each stickman ─── */}
        <line x1="40"  y1="496" x2="330" y2="496" stroke="white" strokeWidth="0.7" strokeOpacity="0.07" />
        <line x1="870" y1="496" x2="1160" y2="496" stroke="white" strokeWidth="0.7" strokeOpacity="0.07" />

        {/* ════════════════════════════════════════
            STICKMAN A — sender (left)
        ════════════════════════════════════════ */}
        {/* Head */}
        <circle cx="178" cy="394" r="15" fill="none" stroke="white" strokeWidth="1.8" strokeOpacity="0.14">
          <animate attributeName="stroke-opacity" values="0.14;0.21;0.14" dur="3.2s" repeatCount="indefinite" />
        </circle>
        {/* Body */}
        <line x1="178" y1="409" x2="178" y2="458" stroke="white" strokeWidth="1.8" strokeOpacity="0.14" />
        {/* Left arm — relaxed */}
        <line x1="178" y1="426" x2="150" y2="448" stroke="white" strokeWidth="1.8" strokeOpacity="0.14" />
        {/* Right arm — raised, handing doc */}
        <line x1="178" y1="426" x2="217" y2="405" stroke="white" strokeWidth="1.8" strokeOpacity="0.14">
          <animateTransform attributeName="transform" type="rotate"
            values="0 178 426;8 178 426;0 178 426;-3 178 426;0 178 426"
            dur="3.2s" repeatCount="indefinite" />
        </line>
        {/* Left leg */}
        <line x1="178" y1="458" x2="156" y2="496" stroke="white" strokeWidth="1.8" strokeOpacity="0.14" />
        {/* Right leg */}
        <line x1="178" y1="458" x2="200" y2="496" stroke="white" strokeWidth="1.8" strokeOpacity="0.14" />

        {/* Document held by Stickman A — floats gently */}
        <g stroke="white" fill="none" strokeOpacity="0.22">
          <rect x="222" y="387" width="33" height="41" rx="2" strokeWidth="1.5" />
          <path d="M243,387 L255,399 L243,399 Z" strokeWidth="1" />
          <line x1="226" y1="404" x2="239" y2="404" strokeWidth="1" />
          <line x1="226" y1="411" x2="241" y2="411" strokeWidth="1" />
          <line x1="226" y1="418" x2="237" y2="418" strokeWidth="1" />
          <animateTransform attributeName="transform" type="translate"
            values="0,0;0,-5;0,0" dur="3.2s" repeatCount="indefinite"
            calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
        </g>

        {/* ════════════════════════════════════════
            STICKMAN B — receiver (right)
        ════════════════════════════════════════ */}
        {/* Head */}
        <circle cx="1022" cy="394" r="15" fill="none" stroke="white" strokeWidth="1.8" strokeOpacity="0.14">
          <animate attributeName="stroke-opacity" values="0.14;0.21;0.14" dur="3.8s" begin="0.7s" repeatCount="indefinite" />
        </circle>
        {/* Body */}
        <line x1="1022" y1="409" x2="1022" y2="458" stroke="white" strokeWidth="1.8" strokeOpacity="0.14" />
        {/* Left arm — reaching forward to receive */}
        <line x1="1022" y1="426" x2="983" y2="405" stroke="white" strokeWidth="1.8" strokeOpacity="0.14">
          <animateTransform attributeName="transform" type="rotate"
            values="0 1022 426;-8 1022 426;0 1022 426;4 1022 426;0 1022 426"
            dur="3.8s" begin="0.7s" repeatCount="indefinite" />
        </line>
        {/* Right arm — raised (celebrate) */}
        <line x1="1022" y1="426" x2="1054" y2="408" stroke="white" strokeWidth="1.8" strokeOpacity="0.14" />
        {/* Left leg */}
        <line x1="1022" y1="458" x2="1000" y2="496" stroke="white" strokeWidth="1.8" strokeOpacity="0.14" />
        {/* Right leg */}
        <line x1="1022" y1="458" x2="1044" y2="496" stroke="white" strokeWidth="1.8" strokeOpacity="0.14" />

        {/* Document arriving at Stickman B — red tint */}
        <g stroke="#c12129" fill="none" strokeOpacity="0.32">
          <rect x="945" y="387" width="33" height="41" rx="2" strokeWidth="1.5" />
          <path d="M966,387 L978,399 L966,399 Z" strokeWidth="1" />
          <line x1="949" y1="404" x2="962" y2="404" strokeWidth="1" />
          <line x1="949" y1="411" x2="964" y2="411" strokeWidth="1" />
          <line x1="949" y1="418" x2="960" y2="418" strokeWidth="1" />
          <animateTransform attributeName="transform" type="translate"
            values="0,0;0,-5;0,0" dur="3.8s" begin="0.7s" repeatCount="indefinite"
            calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
        </g>

        {/* ════════════════════════════════════════
            MAIN TRANSFER ARC + ANIMATED PACKETS
        ════════════════════════════════════════ */}
        {/* Dashed curved arrow */}
        <path
          d="M 259 394 Q 600 196 940 394"
          fill="none" stroke="#c12129" strokeWidth="1.6" strokeOpacity="0.26"
          strokeDasharray="8 5"
          markerEnd="url(#hp-arr)"
        />
        {/* Packet 1 */}
        <circle r="6" fill="#c12129" fillOpacity="0.72">
          <animateMotion dur="3.6s" repeatCount="indefinite"
            path="M 259 394 Q 600 196 940 394" />
        </circle>
        {/* Packet 2 — staggered */}
        <circle r="4" fill="#c12129" fillOpacity="0.38">
          <animateMotion dur="3.6s" begin="1.8s" repeatCount="indefinite"
            path="M 259 394 Q 600 196 940 394" />
        </circle>

        {/* ════════════════════════════════════════
            LOCK ICON — arc midpoint (encryption)
        ════════════════════════════════════════ */}
        <g transform="translate(600, 194)" opacity="0.42">
          {/* Body */}
          <rect x="-16" y="-2" width="32" height="24" rx="3" fill="none" stroke="#c12129" strokeWidth="1.6">
            <animate attributeName="stroke-opacity" values="0.65;1;0.65" dur="2.4s" repeatCount="indefinite" />
          </rect>
          {/* Shackle */}
          <path d="M -9,-13 Q -9,-24 0,-24 Q 9,-24 9,-13" fill="none" stroke="#c12129" strokeWidth="1.6" />
          {/* Keyhole */}
          <circle cx="0" cy="11" r="4" fill="#c12129" fillOpacity="0.45" />
          <line x1="0" y1="11" x2="0" y2="17" stroke="#c12129" strokeWidth="1.6" />
        </g>

        {/* ════════════════════════════════════════
            STICKMAN C — cloud coordinator (top)
        ════════════════════════════════════════ */}
        <g stroke="white" fill="none" strokeWidth="1.4" strokeOpacity="0.09">
          <circle cx="600" cy="115" r="12" />
          <line x1="600" y1="127" x2="600" y2="160" />
          <line x1="600" y1="140" x2="579" y2="153" />
          <line x1="600" y1="140" x2="621" y2="153" />
          <line x1="600" y1="160" x2="587" y2="182" />
          <line x1="600" y1="160" x2="613" y2="182" />
        </g>
        {/* Distributor arrows from C → A and C → B */}
        <path d="M 589 184 Q 386 278 259 394"
          fill="none" stroke="white" strokeWidth="0.9" strokeOpacity="0.07"
          strokeDasharray="4 7" markerEnd="url(#hp-arr-sm)" />
        <path d="M 611 184 Q 814 278 940 394"
          fill="none" stroke="white" strokeWidth="0.9" strokeOpacity="0.07"
          strokeDasharray="4 7" markerEnd="url(#hp-arr-sm)" />

        {/* ════════════════════════════════════════
            SHIELD ICON — bottom right
        ════════════════════════════════════════ */}
        <g transform="translate(1100, 388)" opacity="0.1">
          <path d="M22,0 L46,12 L46,34 Q46,55 22,64 Q-2,55 -2,34 L-2,12 Z"
            fill="none" stroke="white" strokeWidth="1.5" />
          <path d="M8,32 L18,43 L38,20" fill="none" stroke="#c12129" strokeWidth="2" strokeOpacity="0.55" />
        </g>

        {/* ════════════════════════════════════════
            FLOATING DOCUMENT ICONS
        ════════════════════════════════════════ */}
        {/* Top-left */}
        <g stroke="white" fill="none" strokeOpacity="0.1" strokeWidth="1.2">
          <rect x="58" y="122" width="27" height="34" rx="2" />
          <path d="M77,122 L85,130 L77,130 Z" />
          <line x1="62" y1="136" x2="73" y2="136" />
          <line x1="62" y1="143" x2="75" y2="143" />
          <animateTransform attributeName="transform" type="translate"
            values="0,0;0,-9;0,0" dur="4.2s" repeatCount="indefinite"
            calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
        </g>
        {/* Top-right */}
        <g stroke="white" fill="none" strokeOpacity="0.09" strokeWidth="1.2">
          <rect x="1110" y="98" width="27" height="34" rx="2" />
          <path d="M1129,98 L1137,106 L1129,106 Z" />
          <line x1="1114" y1="112" x2="1125" y2="112" />
          <animateTransform attributeName="transform" type="translate"
            values="0,0;0,-9;0,0" dur="5.1s" begin="1.6s" repeatCount="indefinite"
            calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
        </g>
        {/* Mid-left small */}
        <g stroke="white" fill="none" strokeOpacity="0.07" strokeWidth="1">
          <rect x="52" y="290" width="20" height="26" rx="2" />
          <path d="M66,290 L72,296 L66,296 Z" />
          <animateTransform attributeName="transform" type="translate"
            values="0,0;0,-7;0,0" dur="6s" begin="2.1s" repeatCount="indefinite"
            calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
        </g>
        {/* Mid-right small */}
        <g stroke="white" fill="none" strokeOpacity="0.07" strokeWidth="1">
          <rect x="1130" y="280" width="20" height="26" rx="2" />
          <path d="M1144,280 L1150,286 L1144,286 Z" />
          <animateTransform attributeName="transform" type="translate"
            values="0,0;0,-7;0,0" dur="5.6s" begin="0.9s" repeatCount="indefinite"
            calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
        </g>

        {/* ════════════════════════════════════════
            DIRECTIONAL ARROWS — data flow (bottom)
        ════════════════════════════════════════ */}
        {[320, 460, 600, 740, 880].map((x, i) => (
          <g key={i} transform={`translate(${x},${514 + (i % 2) * 28})`} opacity="0.07">
            <path d="M-13,0 L13,0 M7,-6 L13,0 L7,6" fill="none" stroke="white" strokeWidth="1.2" />
          </g>
        ))}

        {/* ════════════════════════════════════════
            DECORATIVE CROSS / PLUS MARKS
        ════════════════════════════════════════ */}
        {[{x:90,y:560},{x:400,y:80},{x:800,y:80},{x:1110,y:560}].map(({x,y},i) => (
          <g key={i} opacity="0.07">
            <line x1={x-8} y1={y} x2={x+8} y2={y} stroke="white" strokeWidth="1" />
            <line x1={x} y1={y-8} x2={x} y2={y+8} stroke="white" strokeWidth="1" />
            <circle cx={x} cy={y} r="3" fill="none" stroke="white" strokeWidth="0.8" />
          </g>
        ))}

        {/* ════════════════════════════════════════
            AMBIENT DOTS
        ════════════════════════════════════════ */}
        {Array.from({ length: 22 }, (_, i) => {
          const x = 30 + ((i * 73 + i * i * 11) % 1140);
          const y = 30 + ((i * 59 + i * i * 7)  % 600);
          return (
            <circle key={i} cx={x} cy={y} r="1.5" fill="white" fillOpacity="0.04">
              <animate attributeName="fill-opacity" values="0.04;0.11;0.04"
                dur={`${3 + i % 5}s`} begin={`${(i % 6) * 0.45}s`} repeatCount="indefinite" />
            </circle>
          );
        })}

        {/* ════════════════════════════════════════
            CORNER BRACKETS
        ════════════════════════════════════════ */}
        <g fill="none" stroke="white" strokeWidth="1.6" strokeOpacity="0.07">
          <path d="M0,60 L0,0 L60,0" />
          <path d="M1140,0 L1200,0 L1200,60" />
          <path d="M0,600 L0,660 L60,660" />
          <path d="M1140,660 L1200,660 L1200,600" />
        </g>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-black via-zinc-900 to-zinc-800 text-white">
      <HeroPattern />

      {/* Glow blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-red/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-28 lg:py-36 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 backdrop-blur">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Purpose-built for consultants and advisors who handle critical data
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight">
          Share. Store.{' '}
          <span className="text-brand-red">Collaborate.</span>
        </h1>

        <p className="text-zinc-300 text-lg sm:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
          Share, store and collaborate on sensitive client documents with confidence.
        </p>
        <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Bank-level encrypted transfers, per-client access controls, and a full audit trail.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-brand-red text-white font-bold rounded-xl hover:bg-red-700 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-red/25 text-sm"
          >
            Start for free — no credit card
          </Link>
          <Link
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-150 border border-white/20 text-sm"
          >
            See all features
          </Link>
        </div>

        <p className="mt-4 text-zinc-500 text-xs">
          Trusted by 50,000+ professionals across 180 countries
        </p>

        {/* Mock UI preview strip */}
        <div className="mt-14 mx-auto max-w-3xl">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur text-left">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              <div className="flex-1 h-5 bg-white/10 rounded-md ml-2" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Client NDA 2026.pdf',      size: '3.1 MB', color: 'bg-red-500/20 border-red-500/30' },
                { name: 'Q4 Financial Report.xlsx', size: '2.0 MB', color: 'bg-emerald-500/20 border-emerald-500/30' },
                { name: 'Due Diligence v3.docx',    size: '1.8 MB', color: 'bg-blue-500/20 border-blue-500/30' },
              ].map((f) => (
                <div key={f.name} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${f.color}`}>
                  <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${f.color}`}>
                    <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-white/80 truncate">{f.name}</p>
                    <p className="text-[9px] text-zinc-500">{f.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
