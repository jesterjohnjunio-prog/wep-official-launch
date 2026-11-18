import { NextResponse } from 'next/server';
import { AirtableError, ConfigError, findById, findByRef, listRegistrations, setAttendance } from '@/lib/airtable';
import { canCheckIn, sameOrigin } from '@/lib/auth';
import { parseTicket, type Slot } from '@/lib/ticket';
import type { CheckInResult, DeskRecord, Registration } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: noStore });

/** Only what the person at the door needs to greet the barangay's representatives. */
const toDesk = (r: Registration): DeskRecord => ({
  id: r.id,
  ref: r.ref,
  barangay: r.barangay,
  city: r.city,
  willAttend: r.willAttend,
  attendees: r.attendees.map(({ slot, name, pwd, attended, checkedInAt }) => ({ slot, name, pwd, attended, checkedInAt })),
});

const expected = (rows: Registration[]) => rows.filter((r) => r.willAttend === 'Yes').flatMap((r) => r.attendees);

function failure(e: unknown) {
  console.error('[checkin]', e instanceof AirtableError ? `${e.status} ${e.type}: ${e.message}` : e);
  const message =
    e instanceof ConfigError
      ? 'Airtable is not connected (AIRTABLE_TOKEN is missing in this deployment).'
      : e instanceof AirtableError
        ? e.status === 429
          ? 'Airtable is receiving too many requests. Wait about 30 seconds, then scan again.'
          : e.type === 'INVALID_VALUE_FOR_COLUMN'
            ? 'The “Attended” columns in Airtable must be checkboxes.'
            : `Airtable: ${e.message}`
        : 'Could not reach the registration database. Check the internet connection and try again.';
  return json({ message }, 502);
}

/** Head count for the desk, plus a search for representatives who lost their ticket (?q=). */
export async function GET(req: Request) {
  if (!(await canCheckIn())) return json({ message: 'Not signed in.' }, 401);
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().toLowerCase().slice(0, 80);
  try {
    const rows = await listRegistrations();
    const people = expected(rows);
    const body: { total: number; attended: number; matches?: DeskRecord[] } = {
      total: people.length,
      attended: people.filter((a) => a.attended).length,
    };
    if (q.length >= 2) {
      const words = q.split(/\s+/);
      body.matches = rows
        .filter((r) => {
          const hay = `${r.barangay} ${r.city} ${r.ref} ${r.attendees.map((a) => a.name).join(' ')}`.toLowerCase();
          return words.every((w) => hay.includes(w));
        })
        .sort((a, b) => a.barangay.localeCompare(b.barangay, 'en', { sensitivity: 'base' }))
        .slice(0, 8)
        .map(toDesk);
    }
    return json(body);
  } catch (e) {
    return failure(e);
  }
}

/**
 * Verifies a ticket against Airtable and, unless only verifying, marks the attendee "Attended".
 * Body: { code } (what the scanner read or the desk typed) or { id, slot } (a search result),
 * plus action "checkin" (default), "verify" (look only) or "undo".
 * A barangay's reference number without an attendee slot checks in its only attendee, or asks the
 * desk to choose when two are registered.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ message: 'Forbidden.' }, 403);
  if (!(await canCheckIn())) return json({ message: 'Not signed in.' }, 401);

  const body = (await req.json().catch(() => ({}))) as { code?: unknown; id?: unknown; slot?: unknown; action?: unknown };
  const action = body.action === 'verify' || body.action === 'undo' ? body.action : 'checkin';
  const code = typeof body.code === 'string' ? body.code.slice(0, 500) : '';
  const id = typeof body.id === 'string' ? body.id : '';

  try {
    let ref: string | null = null;
    let slot: Slot | undefined = body.slot === 1 || body.slot === 2 ? body.slot : undefined;
    let reg: Registration | null;
    if (id) {
      reg = await findById(id);
    } else {
      const ticket = parseTicket(code);
      if (!ticket) return json({ result: 'invalid' satisfies CheckInResult });
      ref = ticket.ref;
      slot = ticket.slot;
      reg = await findByRef(ticket.ref);
    }
    if (!reg) return json({ result: 'not-found' satisfies CheckInResult, ref });
    const reply = (result: CheckInResult, r: Registration) => json({ result, ref: r.ref || ref, slot, record: toDesk(r) });

    if (reg.willAttend !== 'Yes' || !reg.attendees.length) return reply('not-attending', reg);
    if (!slot) {
      if (reg.attendees.length > 1) return reply('choose', reg);
      slot = reg.attendees[0].slot;
    }
    const person = reg.attendees.find((a) => a.slot === slot);
    if (!person) return json({ result: 'not-found' satisfies CheckInResult, ref: `${reg.ref}-${slot}` });

    if (action === 'verify') return reply(person.attended ? 'already' : 'valid', reg);
    if (action === 'undo') {
      if (person.attended) reg = await setAttendance(reg.id, slot, false);
      return reply('undone', reg);
    }
    if (person.attended) return reply('already', reg);
    return reply('checked-in', await setAttendance(reg.id, slot, true));
  } catch (e) {
    return failure(e);
  }
}
