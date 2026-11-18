export type YesNo = 'Yes' | 'No';
export type Gender = 'Female' | 'Male' | 'Prefer not to say';

export interface AttendeeInput {
  name: string;
  contact: string;
  gender: Gender | '';
  pwd: YesNo | '';
}

/** What the browser sends to /api/submit. */
export interface RegistrationInput {
  consent: 'Agree' | 'Not Agree' | '';
  city: string;
  barangay: string;
  hallAddress: string;
  brgyContact: string;
  brgyEmail: string;
  chairperson: string;
  focalPerson: string;
  focalContact: string;
  focalEmail: string;
  willAttend: YesNo | '';
  attendees: AttendeeInput[];
  /** Honeypot — real people never fill this in. */
  website?: string;
}

export interface Attendee {
  /** 1 or 2: which attendee columns in Airtable, and the "-1"/"-2" ending of their ticket code. */
  slot: 1 | 2;
  name: string;
  contact: string;
  gender: string;
  pwd: string;
  /** Ticked by the check-in desk when this attendee's ticket is scanned at the launch. */
  attended: boolean;
  checkedInAt: string;
}

/** A registration as read back from Airtable for the dashboard. */
export interface Registration {
  id: string;
  ref: string;
  submittedAt: string;
  consent: string;
  province: string;
  city: string;
  barangay: string;
  hallAddress: string;
  brgyContact: string;
  brgyEmail: string;
  chairperson: string;
  focalPerson: string;
  focalContact: string;
  focalEmail: string;
  willAttend: string;
  attendeeCount: number;
  attendees: Attendee[];
}

/** What the check-in desk sees about a registration — no contact numbers, emails or addresses. */
export interface DeskRecord {
  id: string;
  ref: string;
  barangay: string;
  city: string;
  willAttend: string;
  attendees: Pick<Attendee, 'slot' | 'name' | 'pwd' | 'attended' | 'checkedInAt'>[];
}

export type CheckInResult =
  /** Ticket is genuine and the attendee was just marked "Attended". */
  | 'checked-in'
  /** Ticket is genuine but was already scanned earlier. */
  | 'already'
  /** Verify-only mode: ticket is genuine and not yet checked in. */
  | 'valid'
  /** A check-in was undone. */
  | 'undone'
  /** The barangay's reference number without an attendee: the desk picks who arrived. */
  | 'choose'
  /** The barangay replied that no one would attend, so there is no one to check in. */
  | 'not-attending'
  /** No registration (or no such attendee) has this reference number. */
  | 'not-found'
  /** The code isn't a WEP Official Launch reference number at all. */
  | 'invalid';

export interface SchemaStatus {
  ok: boolean;
  tableName?: string;
  missing: string[];
  error?: string;
}

export type FieldErrors = Record<string, string>;
