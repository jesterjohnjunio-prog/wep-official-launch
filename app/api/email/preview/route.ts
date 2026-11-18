import { NextResponse } from 'next/server';
import { findById } from '@/lib/airtable';
import { isAuthenticated } from '@/lib/auth';
import { confirmationDataFrom, previewConfirmationEmail, recipientsOf, siteUrl } from '@/lib/email/send';
import type { ConfirmationEmailData } from '@/lib/email/template';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SAMPLE: ConfirmationEmailData = {
  ref: 'WEP-OL-7KQ3MX',
  barangay: 'Blue Ridge B',
  city: 'Quezon City',
  focalPerson: 'Maria Santos',
  focalEmail: 'maria.santos@example.com',
  brgyEmail: 'blueridgeb@example.com',
  willAttend: 'Yes',
  attendees: [
    { slot: 1, name: 'Maria Santos' },
    { slot: 2, name: 'Jose Reyes' },
  ],
};

/**
 * The confirmation email as a web page, for organizers: /api/email/preview shows it with sample
 * details (?no for the "not attending" version), /api/email/preview?id=rec… with a real
 * registration's. Dashboard sign-in required.
 */
export async function GET(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ message: 'Sign in to the dashboard first.' }, { status: 401 });
  }
  const params = new URL(req.url).searchParams;
  const id = params.get('id');
  let data: ConfirmationEmailData = params.has('no') ? { ...SAMPLE, willAttend: 'No', attendees: [] } : SAMPLE;
  if (id) {
    const reg = await findById(id).catch(() => null);
    if (!reg) return NextResponse.json({ message: 'Registration not found.' }, { status: 404 });
    data = confirmationDataFrom(reg);
  }
  const { subject, html } = await previewConfirmationEmail(data, siteUrl(req));
  const { to, cc } = recipientsOf(data);
  const e = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // Show the subject and recipients above the email, the way a mail app would.
  const banner = `<div style="font:13px/1.6 system-ui,sans-serif;color:#d6e4ef;background:#021f45;padding:10px 16px;border-bottom:3px solid #fdc500">
    <b style="color:#fff">Email preview</b>${id ? '' : ' (sample details)'} &middot; To: ${e(to)}${cc ? ` &middot; Cc: ${e(cc)}` : ''}<br>Subject: ${e(subject)}</div>`;
  return new NextResponse(html.replace(/<body([^>]*)>/, `<body$1>${banner}`), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      // Self-contained page: inline styles and images only; the fonts are the email's own.
      'Content-Security-Policy':
        "default-src 'none'; img-src data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; base-uri 'none'; form-action 'none'",
    },
  });
}
