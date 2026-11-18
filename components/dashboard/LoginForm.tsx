'use client';

import Image from 'next/image';
import { useState } from 'react';
import { LOCKUP } from '@/lib/brand-layers';
import { Alert, ArrowRight, Eye, EyeOff, Lock } from '../Icons';

const COPY = {
  dashboard: {
    kicker: 'Results dashboard',
    lead: 'For MWSS RO Water Efficiency Committee use only. Sign in to view and export registrations.',
    label: 'Dashboard password',
  },
  checkin: {
    kicker: 'Check-in desk',
    lead: 'Ticket scanner for the launch. For the WEP team and registration-desk volunteers — sign in with the desk password or the dashboard password.',
    label: 'Desk password',
  },
};

export default function LoginForm({ configured, area = 'dashboard' }: { configured: boolean; area?: 'dashboard' | 'checkin' }) {
  const copy = COPY[area];
  const [password, setPassword] = useState('');
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    // Hide it again while signing in, so it isn't left on screen at a shared desk.
    setShown(false);
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, area }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Sign-in failed.');
      if (json.next) window.location.assign(json.next);
      else window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
      setBusy(false);
    }
  }

  return (
    <section className="form-card login-card">
      <div className="login-logos">
        <Image
          src={LOCKUP.src}
          alt="MWSS RO Water Efficiency Program"
          width={LOCKUP.width}
          height={LOCKUP.height}
          sizes="140px"
          className="login-lockup"
          priority
        />
      </div>
      <p className="section-kicker">{copy.kicker}</p>
      <h1 className="login-title">WEP Official Launch</h1>
      <p className="login-lead">{copy.lead}</p>

      {configured ? (
        <form onSubmit={submit} noValidate>
          <div className={`field${error ? ' has-error' : ''}`}>
            <label htmlFor="dash-password" className="label">
              <span className="label-fil">{copy.label}</span>
            </label>
            <div className="control with-icon">
              <span className="control-icon">
                <Lock />
              </span>
              <input
                id="dash-password"
                type={shown ? 'text' : 'password'}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'dash-password-err' : undefined}
                autoFocus
              />
              <button
                type="button"
                className="reveal-btn"
                onClick={() => setShown((v) => !v)}
                // keep the cursor in the password field when the eye is clicked or tapped
                onMouseDown={(e) => e.preventDefault()}
                aria-label={shown ? 'Hide password' : 'Show password'}
                aria-pressed={shown}
                aria-controls="dash-password"
                title={shown ? 'Hide password' : 'Show password'}
              >
                {shown ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {error && (
              <p className="field-error" id="dash-password-err" role="alert">
                <Alert width={16} height={16} />
                {error}
              </p>
            )}
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={busy || !password}>
            {busy ? <span className="spinner" aria-hidden="true" /> : null}
            {busy ? 'Signing in…' : 'Sign in'}
            {!busy && <ArrowRight />}
          </button>
        </form>
      ) : (
        <p className="callout callout-warn">
          <Alert />
          <span>
            The dashboard is not set up yet.
            <small>Add a DASHBOARD_PASSWORD environment variable in Vercel (Project → Settings → Environment Variables), then redeploy.</small>
          </span>
        </p>
      )}
    </section>
  );
}
