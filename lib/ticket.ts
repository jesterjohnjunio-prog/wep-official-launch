// Reference numbers and ticket codes, shared by the form, the event pass, the email and the check-in desk.
//
// A registration is one barangay with up to two attendees. Its reference number is "WEP-OL-7KQ3MX";
// each attendee has their own ticket code, the reference number plus their slot: "WEP-OL-7KQ3MX-1"
// and "WEP-OL-7KQ3MX-2". So attendees can arrive separately and each scan checks in one person.

/** Characters used in reference numbers — no 0/O or 1/I, so a code read aloud or typed by hand can't be mixed up. */
export const REF_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const REF_CODE_LENGTH = 6;
export const REF_PREFIX = 'WEP-OL';

const [P1, P2] = REF_PREFIX.split('-'); // "WEP", "OL"
// A ticket anywhere in a longer text (e.g. a QR code with extra words around it).
const EMBEDDED = new RegExp(`${P1}-?${P2}-?([A-Z0-9]{${REF_CODE_LENGTH}})(?:-?([12]))?(?![A-Z0-9])`);
// What a person types at the desk: the whole code, or just the end ("7KQ3MX", "7KQ3MX-2", "OL-7KQ3MX").
const TYPED = new RegExp(`^(?:${P1})?-?(?:${P2})?-?([A-Z0-9]{${REF_CODE_LENGTH}})(?:-?([12]))?$`);

export type Slot = 1 | 2;

/** What each attendee's QR code contains: the reference number and their slot. */
export const ticketPayload = (ref: string, slot: Slot) => `${ref}-${slot}`;

/**
 * Turns whatever a scanner read or a person typed into a reference number like "WEP-OL-7KQ3MX",
 * plus the attendee slot when the code has one. Accepts lower case, spaces and missing dashes.
 * Returns null when the text is not a WEP Official Launch ticket.
 */
export function parseTicket(input: string): { ref: string; slot?: Slot } | null {
  const s = input.toUpperCase().replace(/[\s_]+/g, '');
  const m = s.match(EMBEDDED) ?? s.match(TYPED);
  if (!m) return null;
  return { ref: `${REF_PREFIX}-${m[1]}`, ...(m[2] ? { slot: Number(m[2]) as Slot } : {}) };
}
