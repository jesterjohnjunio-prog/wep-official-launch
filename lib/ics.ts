// The calendar invite (.ics) for the Official Launch: downloaded from the event pass and attached to
// the confirmation email. Works in the browser and on the server.
import { EVENT, venueEn, withBarangay } from './config';

const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
const icsTime = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export const inviteFileName = (ref: string) => `WEP-Official-Launch-${ref}.ics`;

export function buildInvite({ ref, barangay, city, attendees }: { ref: string; barangay: string; city: string; attendees: string[] }) {
  const description = [`Reference No.: ${ref}`, `${withBarangay(barangay)}, ${city}`, `Attendees: ${attendees.join(', ')}`].join('\n');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MWSS RO//WEP Official Launch//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ref}@wep-official-launch`,
    `DTSTAMP:${icsTime(new Date().toISOString())}`,
    `DTSTART:${icsTime(EVENT.startsAt)}`,
    `DTEND:${icsTime(EVENT.endsAt)}`,
    `SUMMARY:${icsText(`${EVENT.title} (MWSS RO)`)}`,
    `LOCATION:${icsText(venueEn())}`,
    `DESCRIPTION:${icsText(description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(`${EVENT.title} is tomorrow`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
}

/** "Add to Google Calendar" link — event details only, nothing about the registrant. */
export function googleCalendarUrl(siteUrl: string) {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${EVENT.title} (MWSS RO)`,
    dates: `${icsTime(EVENT.startsAt)}/${icsTime(EVENT.endsAt)}`,
    details: `${EVENT.program}\n${siteUrl}`,
    location: venueEn(),
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Directions, once a venue is set in lib/config.ts. */
export const mapsUrl = () =>
  EVENT.venue ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EVENT.venue)}` : null;
