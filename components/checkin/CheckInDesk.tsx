'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LOCKUP } from '@/lib/brand-layers';
import { EVENT, withBarangay } from '@/lib/config';
import { parseTicket, REF_PREFIX, type Slot } from '@/lib/ticket';
import type { CheckInResult, DeskRecord } from '@/lib/types';
import { Alert, Check, ClipboardList, Info, LogOut, Search, X } from '../Icons';
import Scanner, { type Flash } from './Scanner';

type Mode = 'checkin' | 'verify';
type Outcome = CheckInResult | 'error';
type Action = Mode | 'undo';

interface Result {
  kind: Outcome;
  ref?: string | null;
  slot?: Slot;
  record?: DeskRecord;
  message?: string;
  at: number;
}

interface HistoryItem {
  key: number;
  kind: Outcome;
  ref: string;
  name: string;
}

const REPEAT_MS = 4000; // ignore the same code while it is still in front of the camera
const COUNT_REFRESH_MS = 30_000;
const HISTORY_KEY = 'wep-ol-desk-history';
const SOUND_KEY = 'wep-ol-desk-sound';

const timeFmt = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' });
const time = (iso: string) => (iso ? timeFmt.format(new Date(iso)) : '');
const fmt = (n: number) => n.toLocaleString('en-PH');

const FLASH: Record<Outcome, Flash> = {
  'checked-in': 'ok',
  valid: 'ok',
  choose: 'warn',
  undone: 'warn',
  already: 'warn',
  'not-attending': 'bad',
  'not-found': 'bad',
  invalid: 'bad',
  error: 'bad',
};

const HISTORY_LABEL: Record<Outcome, string> = {
  'checked-in': 'Checked in',
  valid: 'Genuine (verified)',
  choose: 'Barangay code — pick attendee',
  already: 'Already checked in',
  undone: 'Check-in undone',
  'not-attending': 'Replied “not attending”',
  'not-found': 'Not registered',
  invalid: 'Not a ticket',
  error: 'Error',
};

// ---------------------------------------------------------------- feedback (sound + vibration)

let audio: AudioContext | null = null;
function feedback(kind: Flash, sound: boolean) {
  const pattern = kind === 'ok' ? [40] : kind === 'warn' ? [70, 60, 70] : [220];
  // Browsers only allow vibration (and sound) after someone has touched the page.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  navigator.vibrate?.(pattern);
  if (!sound) return;
  try {
    audio ??= new AudioContext();
    const tones = kind === 'ok' ? [880, 1320] : kind === 'warn' ? [620, 620] : [196];
    tones.forEach((f, i) => {
      const o = audio!.createOscillator();
      const g = audio!.createGain();
      const t = audio!.currentTime + i * 0.14;
      const len = kind === 'bad' ? 0.42 : 0.11;
      o.type = kind === 'bad' ? 'square' : 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(kind === 'bad' ? 0.08 : 0.2, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(audio!.destination);
      o.start(t);
      o.stop(t + len + 0.02);
    });
  } catch {
    /* no audio on this device */
  }
}

// ---------------------------------------------------------------- attendees of one barangay

/** The barangay's representatives, each with their check-in state and a button to change it. */
function AttendeeRows({
  record,
  highlight,
  mode,
  busy,
  onAct,
}: {
  record: DeskRecord;
  highlight?: Slot;
  mode: Mode;
  busy: boolean;
  onAct: (r: DeskRecord, slot: Slot, action: Action) => void;
}) {
  return (
    <ul className="desk-people">
      {record.attendees.map((a) => (
        <li key={a.slot} className={`${a.slot === highlight ? 'is-target' : ''}${a.attended ? ' is-in' : ''}`}>
          <span className="desk-slot" aria-hidden="true">
            {a.slot}
          </span>
          <span className="desk-person">
            <strong>{a.name || '—'}</strong>
            <span className="cell-sub">
              <span className="ticket-code">
                Ticket {record.ref}-{a.slot}
              </span>
              {a.pwd === 'Yes' && <em className="pwd-chip">PWD · assist</em>}
            </span>
          </span>
          {a.attended ? (
            <span className="desk-person-act">
              <span className="status status-good">
                <Check width={13} height={13} /> In at {time(a.checkedInAt)}
              </span>
              <button type="button" className="btn-mini btn-ghosty" disabled={busy} onClick={() => onAct(record, a.slot, 'undo')}>
                Undo
              </button>
            </span>
          ) : (
            <button type="button" className="btn-mini btn-mini-solid" disabled={busy} onClick={() => onAct(record, a.slot, mode)}>
              {mode === 'checkin' ? (
                <>
                  <Check width={15} height={15} /> Check in
                </>
              ) : (
                'Verify'
              )}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- result card

function ResultCard({
  result,
  mode,
  busy,
  onAct,
}: {
  result: Result | null;
  mode: Mode;
  busy: boolean;
  onAct: (r: DeskRecord, slot: Slot, action: Action) => void;
}) {
  if (!result) {
    return (
      <div className="result result-idle">
        <span className="result-icon">
          <Info />
        </span>
        <div>
          <p className="result-title">Ready</p>
          <p className="result-note">
            {mode === 'checkin'
              ? 'Scan an attendee’s QR ticket. Genuine tickets are checked against the registration database and marked “Attended”.'
              : 'Verify only: scanning checks a ticket against the database without marking attendance.'}
          </p>
        </div>
      </div>
    );
  }

  const r = result.record;
  const person = r?.attendees.find((a) => a.slot === result.slot);
  const who = person?.name ?? 'This attendee';
  const copy: Record<Outcome, { tone: string; title: string; note: string }> = {
    'checked-in': { tone: 'ok', title: 'Checked in', note: `Genuine ticket · ${who} marked “Attended” at ${time(person?.checkedInAt ?? '')}.` },
    valid: { tone: 'ok', title: 'Genuine ticket', note: `${who} is registered and not checked in yet.` },
    already: {
      tone: 'warn',
      title: 'Already checked in',
      note: `${who}’s ticket was scanned at ${time(person?.checkedInAt ?? '') || 'an earlier time'}. If this isn’t the same person, ask for an ID.`,
    },
    undone: { tone: 'neutral', title: 'Check-in undone', note: `“Attended” was cleared for ${who}.` },
    choose: {
      tone: 'neutral',
      title: 'Who has arrived?',
      note: 'This is the barangay’s reference number. Tap the attendee who is here — or scan their own QR ticket.',
    },
    'not-attending': {
      tone: 'bad',
      title: 'Replied “not attending”',
      note: 'This barangay said no one would attend, so it has no attendee tickets. Please refer them to the WEP secretariat.',
    },
    'not-found': {
      tone: 'bad',
      title: 'Not registered',
      note: `No registration has the code ${result.ref ?? ''}. The ticket may be fake or mistyped — try typing it, or search by barangay or name.`,
    },
    invalid: { tone: 'bad', title: 'Not a WEP Official Launch ticket', note: `This code does not contain a ${REF_PREFIX} reference number.` },
    error: { tone: 'bad', title: 'Couldn’t check this ticket', note: result.message ?? 'Please try again.' },
  };
  const c = copy[result.kind];
  const Icon = c.tone === 'ok' ? Check : c.tone === 'bad' ? X : c.tone === 'warn' ? Alert : Info;

  return (
    <div className={`result result-${c.tone}`} key={result.at}>
      <span className="result-icon">
        <Icon />
      </span>
      <div className="result-body">
        <p className="result-title">{c.title}</p>
        {r && (
          <>
            <p className="result-name">{person && result.kind !== 'choose' ? person.name : withBarangay(r.barangay)}</p>
            <p className="result-org">
              {person && result.kind !== 'choose' ? `${withBarangay(r.barangay)}, ${r.city}` : r.city}
              {person?.pwd === 'Yes' && result.kind !== 'choose' && <em className="pwd-chip">PWD · may need assistance</em>}
            </p>
            <p className="result-ref mono">
              {r.ref}
              {person && result.kind !== 'choose' ? `-${person.slot}` : ''}
            </p>
          </>
        )}
        <p className="result-note">{c.note}</p>
        {r && r.attendees.length > 0 && <AttendeeRows record={r} highlight={result.slot} mode={mode} busy={busy} onAct={onAct} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- desk

export default function CheckInDesk({ isAdmin }: { isAdmin: boolean }) {
  const [mode, setMode] = useState<Mode>('checkin');
  const [counts, setCounts] = useState<{ total: number; attended: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [typed, setTyped] = useState('');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<DeskRecord[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [sound, setSound] = useState(true);
  const [loadError, setLoadError] = useState('');
  const last = useRef({ text: '', at: 0 });
  const busyRef = useRef(false);
  const modeRef = useRef<Mode>('checkin');
  const soundRef = useRef(true);

  useEffect(() => {
    modeRef.current = mode;
    // Switching between "Verify only" and "Check in" re-reads a ticket that is still in front of the camera.
    last.current = { text: '', at: 0 };
  }, [mode]);
  useEffect(() => {
    soundRef.current = sound;
    try {
      localStorage.setItem(SOUND_KEY, sound ? '1' : '0');
    } catch {
      /* storage blocked */
    }
  }, [sound]);

  // Restore this tab's recent scans and the sound setting.
  useEffect(() => {
    try {
      const h = sessionStorage.getItem(HISTORY_KEY);
      if (h) setHistory(JSON.parse(h) as HistoryItem[]);
      if (localStorage.getItem(SOUND_KEY) === '0') setSound(false);
    } catch {
      /* storage blocked */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* storage blocked */
    }
  }, [history]);

  const loadCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/checkin', { cache: 'no-store' });
      if (res.status === 401) return window.location.reload();
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setCounts({ total: json.total, attended: json.attended });
      setLoadError('');
    } catch (e) {
      setLoadError(e instanceof Error && e.message ? e.message : 'Could not reach the registration database.');
    }
  }, []);

  useEffect(() => {
    void loadCounts();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadCounts();
    }, COUNT_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [loadCounts]);

  const submit = useCallback(async (body: { code?: string; id?: string; slot?: Slot; action: Action }) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    let outcome: Result;
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      const json = await res.json().catch(() => ({}));
      outcome = res.ok
        ? { kind: json.result as CheckInResult, ref: json.ref, slot: json.slot, record: json.record, at: Date.now() }
        : { kind: 'error', message: json.message, at: Date.now() };
    } catch {
      outcome = { kind: 'error', message: 'No connection. Check the Wi-Fi or mobile data and scan again.', at: Date.now() };
    } finally {
      busyRef.current = false;
      setBusy(false);
    }

    setResult(outcome);
    feedback(FLASH[outcome.kind], soundRef.current);
    if (outcome.kind === 'checked-in') setCounts((c) => (c ? { ...c, attended: c.attended + 1 } : c));
    if (outcome.kind === 'undone') setCounts((c) => (c ? { ...c, attended: Math.max(0, c.attended - 1) } : c));
    if (outcome.record) {
      const rec = outcome.record;
      setMatches((m) => m?.map((x) => (x.id === rec.id ? rec : x)) ?? m);
    }
    if (outcome.kind !== 'error') {
      const person = outcome.record?.attendees.find((a) => a.slot === outcome.slot);
      setHistory((h) =>
        [
          {
            key: outcome.at,
            kind: outcome.kind,
            ref: outcome.record ? `${outcome.record.ref}${person ? `-${person.slot}` : ''}` : outcome.ref || '—',
            name: person?.name || (outcome.record ? withBarangay(outcome.record.barangay) : ''),
          },
          ...h,
        ].slice(0, 30),
      );
    }
  }, []);

  const onDetect = useCallback(
    (text: string) => {
      const now = Date.now();
      if (busyRef.current) return;
      if (text === last.current.text && now - last.current.at < REPEAT_MS) {
        last.current.at = now; // still in front of the camera
        return;
      }
      last.current = { text, at: now };
      void submit({ code: text, action: modeRef.current });
    },
    [submit],
  );

  const act = useCallback((r: DeskRecord, slot: Slot, action: Action) => void submit({ id: r.id, slot, action }), [submit]);

  function submitTyped(e: React.FormEvent) {
    e.preventDefault();
    if (!typed.trim()) return;
    if (!parseTicket(typed)) {
      setResult({ kind: 'invalid', at: Date.now() });
      feedback('bad', soundRef.current);
      return;
    }
    void submit({ code: typed, action: mode });
    setTyped('');
  }

  // Barangay / name search for representatives without their ticket.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setMatches(null);
      return;
    }
    setSearching(true);
    const ctrl = new AbortController();
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/checkin?q=${encodeURIComponent(q)}`, { cache: 'no-store', signal: ctrl.signal });
        const json = await res.json();
        if (res.ok) {
          setMatches(json.matches ?? []);
          setCounts({ total: json.total, attended: json.attended });
        }
      } catch {
        /* aborted or offline */
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 350);
    return () => {
      ctrl.abort();
      window.clearTimeout(id);
    };
  }, [query]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  }

  const percent = counts && counts.total ? Math.round((counts.attended / counts.total) * 100) : 0;
  const flash = result ? FLASH[result.kind] : null;

  return (
    <div className="dash desk">
      <header className="dash-head desk-head">
        <div className="dash-head-inner">
          <div className="dash-brand">
            <div className="dash-logos">
              <Image
                src={LOCKUP.src}
                alt="MWSS RO Water Efficiency Program"
                width={LOCKUP.width}
                height={LOCKUP.height}
                sizes="90px"
                className="dash-lockup"
                priority
              />
            </div>
            <div>
              <p className="dash-kicker">Check-in desk</p>
              <h1>WEP Official Launch</h1>
              <p className="dash-sub">
                {EVENT.dateEn} · {EVENT.time}
              </p>
            </div>
          </div>
          <div className="desk-count" role="status" aria-live="polite">
            <span className="desk-count-ring" style={{ '--p': `${percent}%` } as React.CSSProperties} aria-hidden="true" />
            <span>
              <strong>{counts ? fmt(counts.attended) : '–'}</strong>
              <span className="desk-count-of"> / {counts ? fmt(counts.total) : '–'}</span>
              <small>attendees checked in</small>
            </span>
          </div>
          <div className="dash-actions">
            {isAdmin && (
              <a className="head-btn" href="/dashboard">
                <ClipboardList width={18} height={18} />
                Dashboard
              </a>
            )}
            <button type="button" className="head-btn" onClick={() => void logout()}>
              <LogOut width={18} height={18} />
              Sign out
            </button>
          </div>
        </div>
        <svg className="dash-wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 30 C 240 0 480 0 720 30 S 1200 60 1440 30 V60 H0 Z" />
        </svg>
      </header>

      <main className="desk-main">
        {loadError && (
          <p className="banner banner-error desk-banner" role="alert">
            <Alert />
            <span>{loadError}</span>
            <button type="button" className="btn-mini" onClick={() => void loadCounts()}>
              Try again
            </button>
          </p>
        )}

        {/* On phones these two wrappers dissolve so the result card sits right under the camera. */}
        <div className="desk-left">
          <section className="card desk-scan" aria-label="Scan tickets">
            <div className="desk-toolbar">
              <div className="seg" role="group" aria-label="What scanning does">
                <button type="button" aria-pressed={mode === 'checkin'} onClick={() => setMode('checkin')}>
                  Check in
                </button>
                <button type="button" aria-pressed={mode === 'verify'} onClick={() => setMode('verify')}>
                  Verify only
                </button>
              </div>
              <label className="sound-toggle">
                <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
                Sound
              </label>
            </div>

            <Scanner onDetect={onDetect} flash={flash} flashKey={result?.at ?? 0} />
          </section>

          <form className="card typed" onSubmit={submitTyped}>
            <label htmlFor="typed-ref">No QR code? Type the ticket or reference number</label>
            <div className="typed-row">
              <span className="typed-control">
                <span className="typed-prefix mono">{REF_PREFIX}-</span>
                <input
                  id="typed-ref"
                  className="mono"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value.toUpperCase())}
                  placeholder="7KQ3MX-1"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={24}
                  enterKeyHint="go"
                />
              </span>
              <button type="submit" className="btn-mini btn-mini-solid" disabled={busy || !typed.trim()}>
                {mode === 'checkin' ? 'Check in' : 'Verify'}
              </button>
            </div>
          </form>
        </div>

        <div className="desk-side">
          <section className={`desk-result${busy ? ' is-busy' : ''}`} aria-live="assertive" aria-label="Last scan">
            {busy && (
              <p className="desk-checking">
                <span className="spinner spinner-dark" aria-hidden="true" /> Checking the database…
              </p>
            )}
            <ResultCard result={result} mode={mode} busy={busy} onAct={act} />
          </section>

          <section className="card desk-search">
            <header className="card-head">
              <h2>Lost ticket?</h2>
              <p>Find the registration by barangay, city or attendee name.</p>
            </header>
            <span className="search-box">
              <Search width={16} height={16} />
              <input type="search" placeholder="e.g. Blue Ridge or Santos" value={query} onChange={(e) => setQuery(e.target.value)} />
            </span>
            {matches && (
              <ul className="matches">
                {matches.length === 0 && !searching && <li className="muted">No registration matches “{query.trim()}”.</li>}
                {matches.map((m) => (
                  <li key={m.id}>
                    <div className="match-head">
                      <strong>{withBarangay(m.barangay)}</strong>
                      <span className="cell-sub">
                        {m.city} · {m.ref}
                      </span>
                    </div>
                    {m.willAttend === 'Yes' && m.attendees.length ? (
                      <AttendeeRows record={m} mode={mode} busy={busy} onAct={act} />
                    ) : (
                      <p className="cell-sub">Replied “not attending” — no attendee tickets.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card desk-history">
            <header className="card-head">
              <h2>Recent scans</h2>
            </header>
            {history.length === 0 ? (
              <p className="muted desk-empty">Nothing scanned yet.</p>
            ) : (
              <ol className="history">
                {history.map((h) => (
                  <li key={h.key} className={`h-${FLASH[h.kind]}`}>
                    <span className="h-dot" aria-hidden="true" />
                    <span className="h-main">
                      <strong>{h.name || h.ref}</strong>
                      <span className="cell-sub">
                        {h.name ? `${h.ref} · ` : ''}
                        {HISTORY_LABEL[h.kind]}
                      </span>
                    </span>
                    <time className="h-time">{timeFmt.format(new Date(h.key))}</time>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
