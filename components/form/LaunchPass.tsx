'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { LOCKUP } from '@/lib/brand-layers';
import { EVENT, venueEn, venueFil, withBarangay } from '@/lib/config';
import { buildInvite, inviteFileName } from '@/lib/ics';
import { ticketPayload } from '@/lib/ticket';
import type { RegistrationInput } from '@/lib/types';
import { CalendarPlus, Check, Copy, Mail, Printer, Sparkle } from '../Icons';
import TicketQR from '../TicketQR';

export function CopyRef({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          /* clipboard blocked */
        }
      }}
    >
      {copied ? <Check width={16} height={16} /> : <Copy width={16} height={16} />}
      {copied ? 'Nakopya (Copied)' : 'Kopyahin (Copy)'}
    </button>
  );
}

// ---------------------------------------------------------------- calendar invite

function downloadInvite(refNo: string, data: RegistrationInput) {
  const ics = buildInvite({ ref: refNo, barangay: data.barangay, city: data.city, attendees: data.attendees.map((a) => a.name) });
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = inviteFileName(refNo);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------- confetti

const CONFETTI_COLORS = ['#fdc500', '#ffe27a', '#5fd3f3', '#22b8e8', '#ffffff', '#1677c9'];
// Fixed pseudo-random spread so the burst looks the same every time.
const CONFETTI = Array.from({ length: 44 }, (_, i) => ({
  x: (i * 37) % 100,
  drift: ((i * 53) % 40) - 20,
  delay: ((i * 29) % 70) / 100,
  dur: 2.6 + ((i * 17) % 18) / 10,
  spin: (i % 2 ? 1 : -1) * (360 + ((i * 41) % 360)),
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  shape: i % 3,
}));

/** Rendered into <body> so the card's entry animation (a transform) can't clip it. */
function Confetti() {
  return createPortal(
    <div className="confetti" aria-hidden="true">
      {CONFETTI.map((c, i) => (
        <i
          key={i}
          className={`confetti-${c.shape}`}
          style={
            {
              left: `${c.x}%`,
              background: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.dur}s`,
              '--drift': `${c.drift}vw`,
              '--spin': `${c.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------- pass

interface Props {
  refNo: string;
  data: RegistrationInput;
  /** Whether a copy of the pass was emailed to the focal person. */
  emailed: boolean;
  onReset: () => void;
}

/**
 * Success screen for attending barangays: a printable event pass with one QR ticket per attendee
 * (scanned at the check-in desk) and a calendar invite.
 */
export default function LaunchPass({ refNo, data, emailed, onReset }: Props) {
  return (
    <>
      <Confetti />
      <p className="launch-badge launch-badge-sm">
        <Sparkle width={14} height={14} />
        <span>Rehistrado na! (You&rsquo;re registered!)</span>
        <Sparkle width={14} height={14} />
      </p>
      <h2 className="success-title">Kita-kits sa Paglulunsad!</h2>
      <p className="success-lead">
        Natanggap na ang rehistro ng {withBarangay(data.barangay)}. Narito ang inyong event pass.
        <span>
          Your registration has been received. Here is your event pass — see you at the Official Launch on {EVENT.dateEn}.
        </span>
      </p>
      {emailed && (
        <p className="emailed-note" role="status">
          <Mail width={18} height={18} />
          <span>
            Naipadala rin ang kopya sa <b>{data.focalEmail}</b>
            {data.brgyEmail && data.brgyEmail !== data.focalEmail && (
              <>
                {' '}
                at <b>{data.brgyEmail}</b>
              </>
            )}
            .
            <small>A copy is on its way by email. Not there in a few minutes? Check the Spam or Promotions folder.</small>
          </span>
        </p>
      )}

      <article className="pass" aria-label="Official Launch event pass">
        <div className="pass-main">
          <header className="pass-band">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOCKUP.src} alt="MWSS RO Water Efficiency Program" className="pass-lockup" width={LOCKUP.width} height={LOCKUP.height} />
            <span className="pass-tag">
              <Sparkle width={12} height={12} />
              Official Launch
            </span>
          </header>
          <div className="pass-body">
            <p className="pass-kicker">Event Pass · Paanyaya</p>
            <h3 className="pass-brgy">
              {withBarangay(data.barangay)}
              <small>{data.city}</small>
            </h3>
            <dl className="pass-meta">
              <div>
                <dt>Petsa (Date)</dt>
                <dd>{EVENT.dateEn}</dd>
              </div>
              <div>
                <dt>Oras (Time)</dt>
                <dd>{EVENT.time}</dd>
              </div>
              <div className="pass-venue">
                <dt>Lugar (Venue)</dt>
                <dd>
                  {venueFil()}
                  {!EVENT.venue && <small>{venueEn()}</small>}
                </dd>
              </div>
            </dl>
            <div className="pass-people">
              <p className="pass-label">Mga Dadalo (Attendees)</p>
              <ol>
                {data.attendees.map((a, i) => (
                  <li key={i}>
                    <span className="attendee-badge">{i + 1}</span>
                    {a.name}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
        <div className="pass-stub">
          <span className="pass-perf" aria-hidden="true" />
          <span className="pass-label">Reference No.</span>
          <strong className="pass-ref">{refNo}</strong>
          {/* one scannable ticket per attendee, so each is checked in as they arrive */}
          <ul className="pass-tickets">
            {data.attendees.map((a, i) => (
              <li key={i}>
                <TicketQR className="pass-qr" value={ticketPayload(refNo, (i + 1) as 1 | 2)} />
                <span className="pass-ticket-name">
                  <span className="attendee-badge">{i + 1}</span>
                  {a.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </article>

      <p className="ref-note">
        Bawat dadalo ay may sariling QR ticket. Ipakita ito sa registration desk, sa cellphone man o naka-print.
        <span>Each attendee has their own QR ticket. Show it at the registration desk, on a phone or printed.</span>
      </p>

      <div className="pass-actions no-print">
        <button type="button" className="btn btn-gold" onClick={() => downloadInvite(refNo, data)}>
          <CalendarPlus />
          Idagdag sa Kalendaryo (Add to calendar)
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
          <Printer />
          I-print / I-save (Print / Save pass)
        </button>
        <CopyRef value={refNo} />
      </div>

      <button type="button" className="btn btn-primary no-print" onClick={onReset}>
        Magsumite ng panibagong tugon (Submit another response)
      </button>
    </>
  );
}
