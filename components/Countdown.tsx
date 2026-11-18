'use client';

import { useEffect, useState } from 'react';
import { EVENT } from '@/lib/config';

const START = Date.parse(EVENT.startsAt);
const END = Date.parse(EVENT.endsAt);

const UNITS = [
  { key: 'd', fil: 'Araw', en: 'Days', ms: 86_400_000 },
  { key: 'h', fil: 'Oras', en: 'Hours', ms: 3_600_000 },
  { key: 'm', fil: 'Minuto', en: 'Minutes', ms: 60_000 },
  { key: 's', fil: 'Segundo', en: 'Seconds', ms: 1000 },
] as const;

function split(ms: number) {
  let rest = Math.max(0, ms);
  return UNITS.map((u) => {
    const v = Math.floor(rest / u.ms);
    rest -= v * u.ms;
    return { ...u, v };
  });
}

/** Live countdown to the launch (Philippine time). Renders nothing until mounted, so server and client agree. */
export default function Countdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  if (now === null) return <div className="countdown is-pending" aria-hidden="true" />;

  if (now >= END) {
    return (
      <p className="countdown-note">
        Salamat sa lahat ng dumalo! <small>Thank you to everyone who joined the Official Launch.</small>
      </p>
    );
  }
  if (now >= START) {
    return (
      <p className="countdown-note is-live">
        <span className="live-dot" aria-hidden="true" />
        Nagaganap na ngayon <small>Happening now</small>
      </p>
    );
  }

  const parts = split(START - now);
  const days = parts[0].v;
  return (
    <div className="countdown" role="timer" aria-label={`${days} days until the Official Launch`}>
      <p className="countdown-label">
        Bilang ng araw bago ang paglulunsad <small>Countdown to the launch</small>
      </p>
      <ol className="countdown-tiles" aria-hidden="true">
        {parts.map((p) => (
          <li key={p.key}>
            <b key={p.v}>{String(p.v).padStart(2, '0')}</b>
            <span>{p.fil}</span>
            <small>{p.en}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}
