// The confirmation email a barangay receives after registering: the ocean-and-gold launch header,
// the event pass with one scannable QR ticket per attendee, calendar buttons and the event details.
// Barangays that replied "No" get a short acknowledgement instead of a pass.
//
// Written as plain tables with inline styles so it holds together in Gmail, Outlook, Apple Mail and
// phone mail apps. Mail apps don't show SVG, so the logos, icons and QR codes are images, and every
// font has a system fallback.
import { EVENT, venueEn, venueFil, withBarangay } from '../config';
import { googleCalendarUrl, inviteFileName, mapsUrl } from '../ics';
import { ticketPayload, type Slot } from '../ticket';

export interface ConfirmationEmailData {
  ref: string;
  barangay: string;
  city: string;
  focalPerson: string;
  focalEmail: string;
  brgyEmail?: string;
  willAttend: string;
  attendees: { slot: Slot; name: string }[];
}

export const ART_IMAGES = ['lockup', 'wave', 'icon-calendar', 'icon-clock', 'icon-pin', 'icon-scan'] as const;
export type ArtImage = (typeof ART_IMAGES)[number];
/** Every image one email uses: the artwork, plus a QR code per attendee ("qr-1", "qr-2"). */
export type EmailImage = ArtImage | `qr-${Slot}`;

export const emailImages = (d: ConfirmationEmailData): EmailImage[] => [
  ...ART_IMAGES,
  ...(attending(d) ? d.attendees.map((a) => `qr-${a.slot}` as const) : []),
];

export interface RenderOptions {
  /** Public address of the site, for links. */
  siteUrl: string;
  /** Where each image comes from: "cid:…" in a sent email, a data: URL in the browser preview. */
  src: (image: EmailImage) => string;
}

const attending = (d: ConfirmationEmailData) => d.willAttend === 'Yes' && d.attendees.length > 0;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const C = {
  page: '#e6f1f9',
  card: '#ffffff',
  soft: '#f2f8fc',
  line: '#d6e4ef',
  ocean: '#04407f',
  ocean9: '#021f45',
  ocean6: '#0a5aa8',
  aqua: '#22b8e8',
  aqua3: '#5fd3f3',
  gold: '#fdc500',
  gold3: '#ffe27a',
  goldInk: '#2b1d00',
  ink: '#0b1f33',
  ink2: '#3c5065',
  ink3: '#62778c',
};
const FONT = "'Plus Jakarta Sans', 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function subjectFor(d: Pick<ConfirmationEmailData, 'ref' | 'barangay' | 'willAttend' | 'attendees'>) {
  return attending(d as ConfirmationEmailData)
    ? `Event pass: WEP Official Launch · ${withBarangay(d.barangay)} · ${d.ref}`
    : `Natanggap ang tugon (Response received): WEP Official Launch · ${d.ref}`;
}

const label = (text: string, color: string = C.ink3) =>
  `<div style="font-family:${FONT};font-size:11px;line-height:15px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${color};">${text}</div>`;

function detailRow(icon: ArtImage, title: string, sub: string, o: RenderOptions, last = false) {
  return `<tr>
  <td width="56" valign="top" style="width:56px;padding:0 0 ${last ? 0 : 18}px 0;">
    <img src="${o.src(icon)}" width="40" height="40" alt="" style="display:block;width:40px;height:40px;border:0;">
  </td>
  <td valign="top" style="padding:0 0 ${last ? 0 : 18}px 0;font-family:${FONT};">
    <div style="font-size:16px;line-height:22px;color:${C.ink};font-weight:bold;">${title}</div>
    <div style="font-size:14px;line-height:20px;color:${C.ink2};padding-top:2px;">${sub}</div>
  </td>
</tr>`;
}

function ticketCell(d: ConfirmationEmailData, a: { slot: Slot; name: string }, o: RenderOptions, width: string) {
  const code = esc(ticketPayload(d.ref, a.slot));
  return `<td class="ticket-td" valign="top" align="center" width="${width}" style="padding:8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.line};border-radius:16px;background:${C.soft};" bgcolor="${C.soft}">
      <tr><td align="center" style="padding:16px 12px 14px;font-family:${FONT};">
        <img src="${o.src(`qr-${a.slot}`)}" width="168" height="168" alt="QR ticket ${code}" style="display:block;margin:0 auto;width:168px;height:168px;border:0;border-radius:10px;">
        <div style="padding-top:12px;">${label(`Dadalo ${a.slot} &middot; Attendee ${a.slot}`, C.ocean6)}</div>
        <div style="padding-top:4px;font-size:17px;line-height:23px;font-weight:bold;color:${C.ink};word-break:break-word;">${esc(a.name)}</div>
        <div style="padding-top:4px;font-family:Consolas,Menlo,monospace;font-size:13px;line-height:18px;letter-spacing:.5px;color:${C.ink3};">${code}</div>
      </td></tr>
    </table>
  </td>`;
}

export function renderConfirmationEmail(d: ConfirmationEmailData, o: RenderOptions) {
  const yes = attending(d);
  const ref = esc(d.ref);
  const brgy = esc(withBarangay(d.barangay));
  const city = esc(d.city);
  const focal = esc(d.focalPerson.trim());
  const site = esc(o.siteUrl);
  const siteLabel = esc(o.siteUrl.replace(/^https?:\/\//, ''));
  const maps = mapsUrl();
  const venueLine = EVENT.venue ? esc(EVENT.venue) : `${esc(venueFil())} <span style="color:${C.ink3};">(${esc(venueEn())})</span>`;
  const preheader = yes
    ? `Rehistrado na ang ${withBarangay(d.barangay)} — ${EVENT.dateEn}, ${EVENT.time}. Ipakita ang QR ticket sa registration desk.`
    : `Natanggap na ang tugon ng ${withBarangay(d.barangay)}. Salamat sa pagpapaalam.`;
  const tickets = d.attendees.length > 1
    ? `<tr>${d.attendees.map((a) => ticketCell(d, a, o, '50%')).join('')}</tr>`
    : `<tr><td width="20%" class="ticket-pad"></td>${ticketCell(d, d.attendees[0] ?? { slot: 1, name: '' }, o, '60%')}<td width="20%" class="ticket-pad"></td></tr>`;

  const html = `<!doctype html>
<html lang="fil" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(subjectFor(d))}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap" rel="stylesheet">
<style>
  body { margin:0 !important; padding:0 !important; width:100% !important; background:${C.page}; }
  a { color:${C.ocean6}; }
  .btn:hover { opacity:.92; }
  @media (max-width: 520px) {
    .px { padding-left:20px !important; padding-right:20px !important; }
    .h1 { font-size:26px !important; line-height:30px !important; }
    .meta-td { display:block !important; width:100% !important; padding:0 0 12px 0 !important; }
    .ticket-td { display:block !important; width:100% !important; padding:6px 0 !important; }
    .ticket-pad { display:none !important; }
    .btn { display:block !important; margin:8px 0 !important; text-align:center !important; }
    .lockup { width:170px !important; height:auto !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page};" bgcolor="${C.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${C.page};">${esc(preheader)}${'&#8199;&#847; '.repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background:${C.page};">
<tr><td align="center" style="padding:24px 10px 32px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;">

  <!-- header: the MWSS RO · Water Efficiency Program logo, gold launch ribbon, date -->
  <tr><td align="center" bgcolor="${C.ocean}" style="padding:28px 24px 0;border-radius:24px 24px 0 0;background:${C.ocean};background-image:radial-gradient(520px 220px at 50% -20%, rgba(253,197,0,.28), transparent 70%),linear-gradient(180deg,#0b6cbd 0%,${C.ocean} 55%,#03316a 100%);font-family:${FONT};">
    <img class="lockup" src="${o.src('lockup')}" width="200" height="185" alt="MWSS RO Water Efficiency Program" style="display:block;margin:0 auto;width:200px;height:185px;border:0;color:#ffffff;font-family:${FONT};font-size:18px;font-weight:bold;">
    <div style="padding-top:20px;">
      <span style="display:inline-block;padding:7px 16px;border-radius:999px;background:${C.gold};background-image:linear-gradient(110deg,#f5b800,${C.gold3} 45%,${C.gold});font-size:12px;line-height:16px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:${C.goldInk};">&#10022;&nbsp; Official Launch &nbsp;&#10022;</span>
    </div>
    <div style="padding-top:12px;font-size:14px;line-height:20px;font-weight:bold;color:${C.gold3};">${esc(EVENT.dateEn)} &middot; ${esc(EVENT.time)}</div>
    <img src="${o.src('wave')}" width="600" height="36" alt="" style="display:block;width:100%;max-width:600px;height:36px;border:0;margin-top:22px;">
  </td></tr>

  <!-- greeting -->
  <tr><td class="px" style="padding:12px 36px 4px;background:${C.card};font-family:${FONT};" bgcolor="${C.card}">
    <div style="font-size:15px;line-height:22px;color:${C.ocean6};font-weight:bold;">Magandang araw po, ${focal}!</div>
    <h1 class="h1" style="margin:6px 0 0;font-size:28px;line-height:33px;font-weight:800;color:${C.ink};">${
      yes ? 'Rehistrado na ang inyong barangay!' : 'Natanggap na ang inyong tugon.'
    }</h1>
    <div style="padding-top:2px;font-size:16px;line-height:22px;color:${C.ink3};font-weight:bold;">${
      yes ? 'Your barangay is registered.' : 'Your response has been received.'
    }</div>
    <p style="margin:14px 0 0;font-size:15px;line-height:24px;color:${C.ink2};">${
      yes
        ? `Salamat sa pagpaparehistro ng <b style="color:${C.ink};">${brgy}, ${city}</b> sa ${esc(EVENT.titleFil)}. Nasa ibaba ang inyong event pass &mdash; bawat dadalo ay may sariling QR ticket. Ipakita ito sa registration desk sa araw ng paglulunsad, sa cellphone man o naka-print.<br><span style="color:${C.ink3};">Thank you for registering ${brgy} for the ${esc(EVENT.title)}. Below is your event pass &mdash; each attendee has their own QR ticket. Show it at the registration desk on the day, on a phone or printed.</span>`
        : `Salamat sa pagpapaalam na hindi makadadalo ang kinatawan ng <b style="color:${C.ink};">${brgy}, ${city}</b> sa ${esc(EVENT.titleFil)}. Patuloy pa rin namin kayong aabisuhan tungkol sa Water Efficiency Program.<br><span style="color:${C.ink3};">Thank you for letting us know that ${brgy} will not be able to send representatives to the ${esc(EVENT.title)}. We will keep you updated about the Water Efficiency Program.</span>`
    }</p>
  </td></tr>
${
  yes
    ? `
  <!-- event pass -->
  <tr><td class="px" style="padding:22px 28px 6px;background:${C.card};" bgcolor="${C.card}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border:1px solid ${C.line};border-radius:20px;background:${C.card};" bgcolor="${C.card}">
      <tr><td style="padding:12px 20px;border-radius:20px 20px 0 0;background:${C.ocean};background-image:linear-gradient(120deg,#0b6cbd,${C.ocean} 55%,${C.ocean9});" bgcolor="${C.ocean}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="font-family:${FONT};font-size:11px;line-height:16px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#ffffff;">&#10022;&nbsp; Event pass &middot; Paanyaya</td>
          <td align="right" style="font-family:Consolas,Menlo,monospace;font-size:13px;line-height:16px;font-weight:bold;letter-spacing:1px;color:${C.gold};">${ref}</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:18px 20px 4px;font-family:${FONT};">
        ${label('Barangay', C.ocean6)}
        <div style="padding-top:3px;font-size:24px;line-height:29px;font-weight:800;color:${C.ink};word-break:break-word;">${brgy}</div>
        <div style="padding-top:2px;font-size:14px;line-height:20px;color:${C.ink3};">${city}</div>
      </td></tr>
      <tr><td style="padding:12px 20px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};"><tr>
          <td class="meta-td" valign="top" width="34%" style="padding-top:12px;font-family:${FONT};">${label('Petsa (Date)')}<div style="padding-top:2px;font-size:15px;line-height:21px;font-weight:bold;color:${C.ink};">${esc(EVENT.dateEn)}</div></td>
          <td class="meta-td" valign="top" width="30%" style="padding-top:12px;font-family:${FONT};">${label('Oras (Time)')}<div style="padding-top:2px;font-size:15px;line-height:21px;font-weight:bold;color:${C.ink};">${esc(EVENT.time)}</div></td>
          <td class="meta-td" valign="top" style="padding-top:12px;font-family:${FONT};">${label('Lugar (Venue)')}<div style="padding-top:2px;font-size:15px;line-height:21px;font-weight:bold;color:${C.ink};">${venueLine}</div></td>
        </tr></table>
      </td></tr>
      <!-- tear line -->
      <tr><td style="padding:12px 0 0;font-size:0;line-height:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="14" style="width:14px;font-size:0;line-height:0;"><div style="width:14px;height:28px;background:${C.page};border-radius:0 14px 14px 0;"></div></td>
          <td style="padding:0 8px;font-size:0;line-height:0;"><div style="height:0;border-top:2px dashed ${C.line};font-size:0;line-height:0;">&nbsp;</div></td>
          <td width="14" style="width:14px;font-size:0;line-height:0;"><div style="width:14px;height:28px;background:${C.page};border-radius:14px 0 0 14px;"></div></td>
        </tr></table>
      </td></tr>
      <!-- one QR ticket per attendee -->
      <tr><td style="padding:6px 12px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${tickets}</table>
      </td></tr>
      <tr><td align="center" style="padding:4px 20px 20px;font-family:${FONT};font-size:13px;line-height:19px;color:${C.ink3};">
        Ipakita ang QR ticket sa registration desk.<br>Show each attendee&rsquo;s QR ticket at the registration desk.
      </td></tr>
    </table>
  </td></tr>

  <!-- buttons -->
  <tr><td class="px" align="center" style="padding:20px 28px 4px;background:${C.card};font-family:${FONT};" bgcolor="${C.card}">
    <a class="btn" href="${esc(googleCalendarUrl(o.siteUrl))}" target="_blank" style="display:inline-block;margin:6px;padding:14px 24px;border-radius:14px;background:${C.gold};background-image:linear-gradient(135deg,${C.gold3},${C.gold} 50%,#e9a800);color:${C.goldInk};font-family:${FONT};font-size:15px;line-height:20px;font-weight:bold;text-decoration:none;">Idagdag sa Google Calendar</a>${
      maps
        ? `
    <a class="btn" href="${esc(maps)}" target="_blank" style="display:inline-block;margin:6px;padding:12px 24px;border-radius:14px;border:2px solid ${C.ocean6};color:${C.ocean};font-family:${FONT};font-size:15px;line-height:20px;font-weight:bold;text-decoration:none;">Get directions</a>`
        : ''
    }
    <div style="padding-top:10px;font-size:13px;line-height:19px;color:${C.ink3};">Outlook o Apple Calendar? Buksan ang naka-attach na invite (<span style="color:${C.ink2};">.ics</span> file).</div>
  </td></tr>

  <!-- event details -->
  <tr><td class="px" style="padding:28px 36px 6px;background:${C.card};" bgcolor="${C.card}">
    <div style="font-family:${FONT};font-size:13px;line-height:16px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${C.ocean6};">Mga Detalye &middot; Event details</div>
    <div style="height:1px;line-height:1px;font-size:0;background:${C.line};margin:12px 0 20px;">&nbsp;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${detailRow('icon-calendar', esc(EVENT.dateEn), `${esc(EVENT.dateFil)} &mdash; naka-attach ang calendar invite (the invite is attached).`, o)}
      ${detailRow('icon-clock', esc(EVENT.time), 'Oras sa Pilipinas. Dumating nang mas maaga para sa check-in (Come a little early to check in).', o)}
      ${detailRow('icon-pin', EVENT.venue ? esc(EVENT.venue) : esc(venueEn()), EVENT.venue ? esc(EVENT.titleFil) : 'Iaanunsyo pa ang lugar. Aabisuhan namin kayo sa email na ito (We will email you once it is confirmed).', o)}
      ${detailRow('icon-scan', 'Sa registration desk (At the door)', 'Buksan ang email na ito o ang naka-save na pass. I-scan ang QR ticket ng bawat dadalo (Each attendee&rsquo;s QR ticket is scanned on arrival).', o, true)}
    </table>
  </td></tr>`
    : ''
}

  <!-- summary -->
  <tr><td class="px" style="padding:26px 36px 32px;background:${C.card};font-family:${FONT};" bgcolor="${C.card}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.soft};border-radius:14px;" bgcolor="${C.soft}">
      <tr><td style="padding:16px 18px;">
        ${label('Buod ng rehistro &middot; Registration summary', C.ocean6)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;font-family:${FONT};font-size:14px;line-height:21px;color:${C.ink2};">
          <tr><td width="42%" style="padding:3px 0;color:${C.ink3};">Reference No.</td><td style="padding:3px 0;font-weight:bold;color:${C.ink};">${ref}</td></tr>
          <tr><td style="padding:3px 0;color:${C.ink3};">Barangay</td><td style="padding:3px 0;font-weight:bold;color:${C.ink};">${brgy}, ${city}</td></tr>
          <tr><td style="padding:3px 0;color:${C.ink3};">Focal person</td><td style="padding:3px 0;font-weight:bold;color:${C.ink};">${focal}</td></tr>
          <tr><td style="padding:3px 0;color:${C.ink3};">Dadalo (Attending)</td><td style="padding:3px 0;font-weight:bold;color:${C.ink};">${
            yes ? `Oo (Yes) &middot; ${d.attendees.map((a) => esc(a.name)).join(', ')}` : 'Hindi (No)'
          }</td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- closing bar -->
  <tr><td height="6" style="height:6px;font-size:0;line-height:0;border-radius:0 0 24px 24px;background:${C.aqua};background-image:linear-gradient(90deg,${C.aqua3},${C.ocean6} 35%,${C.gold} 65%,${C.gold3});" bgcolor="${C.aqua}">&nbsp;</td></tr>

  <!-- footer -->
  <tr><td align="center" style="padding:24px 24px 0;font-family:${FONT};font-size:12px;line-height:19px;color:${C.ink3};">
    <div style="font-size:13px;font-weight:bold;color:${C.ink2};">Metropolitan Waterworks and Sewerage System &ndash; Regulatory Office</div>
    <div>Water Efficiency Program &middot; Official Launch &middot; 2026</div>
    <div style="padding-top:8px;">Natanggap ninyo ito dahil ginamit ang ${esc(d.focalEmail)} sa pagpaparehistro sa <a href="${site}" target="_blank" style="color:${C.ocean6};text-decoration:underline;">${siteLabel}</a>. May tanong? I-reply lamang ang email na ito.<br>You received this because this address was used to register at ${siteLabel}. Questions? Just reply to this email.</div>
  </td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;

  const text = [
    `Magandang araw po, ${d.focalPerson.trim()}!`,
    '',
    yes
      ? `Rehistrado na ang ${withBarangay(d.barangay)}, ${d.city} sa ${EVENT.titleFil}. (Your barangay is registered.)`
      : `Natanggap na ang tugon ng ${withBarangay(d.barangay)}, ${d.city}. Salamat sa pagpapaalam. (Your response has been received.)`,
    '',
    `${EVENT.program} — Official Launch`,
    `Reference No.: ${d.ref}`,
    ...(yes
      ? [
          `When:  ${EVENT.dateEn}, ${EVENT.time} (Philippine time)`,
          `Where: ${venueEn()}`,
          '',
          'Attendees and their ticket codes (show the QR code in this email at the registration desk):',
          ...d.attendees.map((a) => `  ${a.slot}. ${a.name} — ${ticketPayload(d.ref, a.slot)}`),
          '',
          `Calendar: open the attached ${inviteFileName(d.ref)}, or add it to Google Calendar: ${googleCalendarUrl(o.siteUrl)}`,
          ...(maps ? [`Directions: ${maps}`] : []),
        ]
      : []),
    '',
    'Salamat po!',
    'Metropolitan Waterworks and Sewerage System – Regulatory Office',
    o.siteUrl,
  ].join('\n');

  return { subject: subjectFor(d), html, text };
}
