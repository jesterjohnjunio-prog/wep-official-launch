'use client';

import { useCallback, useEffect, useState } from 'react';
import { LAYERS } from '@/lib/brand-layers';
import { EVENT } from '@/lib/config';
import { WavePath } from './WaterBackground';

const SHOW_MS = 5300;
const SHOW_MS_REDUCED = 1100;
const LEAVE_MS = 950;

/**
 * Streams that spiral into the logo's drop like water into a whirlpool. Drawn in a 1000×1000 box
 * centred on the drop: each starts beyond the edge of the screen and turns about a quarter-circle
 * inwards, all in the same direction.
 */
function spiral(start: number, sweep: number, wobble: number) {
  const pts: string[] = [];
  for (let k = 0; k <= 28; k++) {
    const s = k / 28;
    const r = 520 * (1 - s) ** 1.15 + 4;
    const a = start + sweep * s + Math.sin(s * Math.PI * 2) * wobble;
    pts.push(`${(500 + r * Math.cos(a)).toFixed(1)} ${(500 + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')}`;
}
const STREAMS = Array.from({ length: 9 }, (_, i) => ({
  d: spiral((i / 9) * Math.PI * 2 + 0.3 * (i % 2), 1.5 + (i % 3) * 0.25, 0.08 + (i % 2) * 0.05),
  hue: (['aqua', 'gold', 'sky', 'blue', 'aqua', 'gold', 'sky', 'white', 'blue'] as const)[i],
  w: [4.5, 4, 3.5, 3, 4, 3.5, 3, 2, 3.5][i],
  t: 1.0 + ((i * 5) % 9) * 0.035,
}));

/** Drops of light drifting up through the water, like fine bubbles. */
const MOTES = Array.from({ length: 22 }, (_, i) => ({
  x: (i * 41 + 9) % 100,
  y: 20 + ((i * 29) % 80),
  s: 2 + ((i * 7) % 4),
  d: ((i * 13) % 40) / 10,
  dur: 6 + ((i * 11) % 5),
}));
/** Fountain spray: sideways reach and height (px) of each droplet. */
const SPRAY = [
  [-130, 100], [-100, 150], [-72, 196], [-44, 230], [-18, 252], [0, 262], [18, 248], [44, 226], [74, 190], [104, 146],
  [134, 96], [-156, 60], [158, 56], [-58, 140], [60, 132], [8, 205],
] as const;
const FOUNTAINS = [
  { side: 'left', t: 3.35 },
  { side: 'right', t: 3.55 },
  { side: 'left', t: 3.9 },
  { side: 'right', t: 4.1 },
] as const;

const box = (name: string) => {
  const l = LAYERS.find((x) => x.name === name)!;
  return { left: `${l.left}%`, top: `${l.top}%`, width: `${l.width}%`, height: `${l.height}%` };
};

/**
 * The launch intro, "Daloy" (flow): three drops count down 3-2-1 in their ripples; the last one
 * breaks the surface and streams spiral in from every edge, pouring the MWSS RO · Water Efficiency
 * Program logo together — the blue and gold streams, the navy drop filling, the seal rolling in on
 * the current, "MWSS" rising from the waterline, "RO" and the tagline — while the tide rises and
 * fountains celebrate. Then a ripple opens onto the form. Click, tap, Enter, Space or Escape skips it.
 */
export default function Splash() {
  const [phase, setPhase] = useState<'show' | 'leaving' | 'gone'>('show');

  const skip = useCallback(() => setPhase((p) => (p === 'show' ? 'leaving' : p)), []);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(skip, reduce ? SHOW_MS_REDUCED : SHOW_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [skip]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('splash-active', phase === 'show');
    if (phase !== 'leaving') return;
    const t = window.setTimeout(() => setPhase('gone'), LEAVE_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div
      className={`splash${phase === 'leaving' ? ' is-leaving' : ''}`}
      onClick={skip}
      role="status"
      aria-live="polite"
      aria-label="Loading the registration form"
    >
      {/* deep water: shifting light and fine bubbles drifting up */}
      <div className="sp-deep" aria-hidden="true" />
      <div className="sp-caustics" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="sp-motes" aria-hidden="true">
        {MOTES.map((m, i) => (
          <i
            key={i}
            style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.s, height: m.s, animationDelay: `-${m.d}s`, animationDuration: `${m.dur}s` }}
          />
        ))}
      </div>

      <div className="sp-stage">
        <div className="lk" role="img" aria-label="MWSS RO Water Efficiency Program">
          {/* streams spiralling into the drop */}
          <svg className="lk-streams" viewBox="0 0 1000 1000" aria-hidden="true">
            {STREAMS.map((s, i) => (
              <g key={i} className={`lk-stream is-${s.hue}`} style={{ '--t': `${s.t}s` } as React.CSSProperties}>
                <path d={s.d} pathLength={1} className="lk-stream-glow" style={{ strokeWidth: s.w * 3 }} />
                <path d={s.d} pathLength={1} className="lk-stream-core" style={{ strokeWidth: s.w }} />
              </g>
            ))}
          </svg>

          {/* the countdown: three drops, three ripples, 3 · 2 · 1 */}
          <div className="lk-count" aria-hidden="true">
            {[3, 2, 1].map((n, i) => (
              <div key={n} className="lk-tick" style={{ '--k': i } as React.CSSProperties}>
                <span className="lk-tick-drop" />
                <span className="lk-tick-ring" />
                <span className="lk-tick-ring is-late" />
                <b>{n}</b>
              </div>
            ))}
            {/* the last drop breaks the surface */}
            <span className="lk-break" />
            <span className="lk-break is-wide" />
            <div className="lk-crown">
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} style={{ '--a': `${i * 30}deg` } as React.CSSProperties} />
              ))}
            </div>
          </div>

          {/* the logo, built piece by piece (the pieces line up exactly into the official lockup) */}
          <div className="lk-float" aria-hidden="true">
            {LAYERS.map((l) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={l.name}
                className={`lk-layer lk-${l.name}`}
                src={l.src}
                alt=""
                draggable={false}
                style={{ left: `${l.left}%`, top: `${l.top}%`, width: `${l.width}%`, height: `${l.height}%` }}
              />
            ))}
            {/* a waterline rising through the navy drop as it fills */}
            <span className="lk-fillline" style={box('navy')}>
              <i />
            </span>
            {/* the current the seal rides in on, and the ripples when it lands */}
            <span className="lk-seal-wake" style={box('seal')} />
            <span className="lk-seal-ring" style={box('seal')} />
            <span className="lk-seal-ring" style={box('seal')} />
            <span className="lk-shine" />
            <span className="lk-drip" />
          </div>
        </div>

        <p className="sp-ribbon">
          <span>Official Launch</span>
        </p>
        <p className="sp-date">
          <span>{EVENT.dateEn} ·</span> <span>{EVENT.time}</span>
        </p>
      </div>

      {/* the tide rises, and fountains celebrate */}
      <div className="sp-tide" aria-hidden="true">
        <div className="wave-track sp-tide-back">
          <WavePath />
          <WavePath />
        </div>
        <div className="wave-track sp-tide-mid">
          <WavePath />
          <WavePath />
        </div>
        <div className="wave-track sp-tide-front">
          <WavePath />
          <WavePath />
        </div>
        <div className="sp-tide-body" />
      </div>
      <div className="sp-fountains" aria-hidden="true">
        {FOUNTAINS.map((f, i) => (
          <div key={i} className={`sp-fountain is-${f.side}`} style={{ '--t': `${f.t}s` } as React.CSSProperties}>
            {SPRAY.map(([dx, dy], j) => (
              <span key={j} style={{ '--dx': `${dx}px`, '--dy': `${-dy}px`, '--j': j } as React.CSSProperties}>
                <i className={j % 5 === 2 ? 'is-gold' : undefined} />
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* the exit: a ripple opens onto the form */}
      <span className="sp-portal" aria-hidden="true" />
      <span className="sp-skip" aria-hidden="true">
        Tap to skip
      </span>
    </div>
  );
}
