// Event details and reference lists for the Water Efficiency Program Official Launch.

export const EVENT = {
  title: 'Water Efficiency Program Official Launch',
  titleFil: 'Opisyal na Paglulunsad ng Water Efficiency Program',
  program: 'MWSS RO Water Efficiency Program',
  dateFil: 'Disyembre 3, 2026',
  dateEn: 'December 3, 2026',
  dateIso: '2026-12-03',
  time: '1:00 PM – 5:00 PM',
  /** Start and end in Philippine time — drive the countdown and the calendar invite. */
  startsAt: '2026-12-03T13:00:00+08:00',
  endsAt: '2026-12-03T17:00:00+08:00',
  /** Leave empty until the venue is confirmed; the form then shows "to be announced". */
  venue: '',
  /** Target headcount for the launch. */
  capacity: 70,
  /** Maximum representatives per barangay. */
  maxAttendees: 2,
} as const;

export const VENUE_TBA = { fil: 'Iaanunsyo pa ang lugar', en: 'Venue to be announced' } as const;
export const venueEn = () => EVENT.venue || VENUE_TBA.en;
export const venueFil = () => EVENT.venue || VENUE_TBA.fil;

export const PROVINCES = ['Metro Manila', 'Cavite', 'Rizal'] as const;
export type Province = (typeof PROVINCES)[number];

/** Cities and municipalities within the MWSS concession areas (WEP Plan, "Case 5"). */
export const LOCATIONS: Record<Province, string[]> = {
  'Metro Manila': [
    'Caloocan',
    'Las Piñas',
    'Makati',
    'Malabon',
    'Mandaluyong',
    'Manila',
    'Marikina',
    'Muntinlupa',
    'Navotas',
    'Parañaque',
    'Pasay',
    'Pasig',
    'Pateros',
    'Quezon City',
    'San Juan',
    'Taguig',
    'Valenzuela',
  ],
  Cavite: ['Bacoor', 'Cavite City', 'Imus', 'Kawit', 'Noveleta', 'Rosario'],
  Rizal: [
    'Angono',
    'Antipolo',
    'Baras',
    'Binangonan',
    'Cainta',
    'Cardona',
    'Jalajala',
    'Morong',
    'Pililla',
    'Rodriguez (Montalban)',
    'San Mateo',
    'Tanay',
    'Taytay',
    'Teresa',
  ],
};

export const ALL_CITIES = PROVINCES.flatMap((p) => LOCATIONS[p]);

export function provinceOf(city: string): Province | '' {
  for (const p of PROVINCES) if (LOCATIONS[p].includes(city)) return p;
  return '';
}

/** 'Blue Ridge B' → 'Barangay Blue Ridge B'; leaves 'Brgy. …' / 'Barangay …' as typed. */
export function withBarangay(name: string) {
  return /^(barangay|brgy\.?)\s/i.test(name.trim()) ? name.trim() : `Barangay ${name.trim()}`;
}

export const GENDERS = [
  { value: 'Female', fil: 'Babae', en: 'Female' },
  { value: 'Male', fil: 'Lalaki', en: 'Male' },
  { value: 'Prefer not to say', fil: 'Mas piniling hindi sabihin', en: 'Prefer not to say' },
] as const;

export const YES_NO = [
  { value: 'Yes', fil: 'Oo', en: 'Yes' },
  { value: 'No', fil: 'Hindi', en: 'No' },
] as const;
