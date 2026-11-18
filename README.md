# Official Launch — MWSS RO Water Efficiency Program

Registration form and results dashboard for the **Water Efficiency Program Official Launch** of the
MWSS Regulatory Office (December 3, 2026 · 1:00–5:00 PM · venue to be announced).

Live site: https://wep-official-launch-registration.vercel.app/

It has the same structure as the Barangay Consultative Meeting form (`../wep-consultative-meeting`),
with a launch look:

- **`/`** — "Daloy" (flow), an intro where the MWSS RO · Water Efficiency Program logo is made of
  moving water: three drops count down 3 · 2 · 1 in their ripples, the last breaks the surface and
  streams spiral in from every edge like a whirlpool, pouring the logo together (the blue and gold
  streams, the navy drop filling, the seal rolling in on the current, "MWSS" rising from the
  waterline, "RO" and the tagline); the tide rises and fountains spray, then a ripple opens onto
  the page (tap to skip). The page itself is headed by
  the same logo, then a live countdown and the same two-section bilingual (Filipino / English) form.
  Responses are saved to Airtable.
- After a barangay registers as attending, it gets an **event pass** (reference number, barangay,
  date, time, venue, and **one QR ticket per attendee**) with **Add to calendar (.ics)**,
  **Print / Save pass**, and a confetti burst.
- **Confirmation email** (once Gmail is set up): the focal person gets the same pass by email, with
  each attendee's QR ticket, an Add to Google Calendar button and the `.ics` invite; the barangay's
  own email address, if given, is copied. Barangays that answer "No" get a short acknowledgement.
- **`/checkin`** — the **check-in desk** for the registration table on the day: a camera scanner
  that checks each QR ticket against Airtable and marks that attendee "Attended", with verify-only
  mode, undo, typed codes, a lost-ticket search by barangay or name, and a live head count.
- **`/dashboard`** — password-protected results dashboard: key figures (including how many have
  checked in), charts, searchable table, and exports to **Excel (.xlsx)**, **CSV**, an **attendee
  list CSV**, and **Print / PDF**. Each registration can resend or preview its confirmation email.

Reference numbers start with `WEP-OL-` (the Consultative Meeting uses `WEP-CM-`). Each attendee's
ticket is the reference number plus their number: `WEP-OL-7KQ3MX-1`, `WEP-OL-7KQ3MX-2`.

## Check-in desk

Open **`/checkin`** on a phone, tablet or laptop at the registration table and sign in with:

- the **dashboard password**, or
- the **desk password** (`CHECKIN_PASSWORD`), for volunteers. It opens only the scanner: it can
  verify a ticket and mark attendance, but never sees the dashboard, contact details or exports.

Each attendee shows their own QR ticket (on the event pass, in the email, or printed). One scan
checks in one person, so representatives of the same barangay can arrive at different times. The
desk shows whether the ticket is genuine, already used, or not registered, and flags PWD attendees
who may need assistance. If someone has no ticket, type the code (`7KQ3MX-1`) or search for the
barangay or name. Typing a barangay's reference number without `-1`/`-2` lists both attendees
to choose from. Attendance is saved to the `Attendee 1/2 Attended` and `Checked In At` columns.

## Confirmation email (Gmail)

1. Use the Gmail account the emails should come from (ideally a WEP or event account).
2. Turn on **2-Step Verification** for it, then create an **App password** at
   https://myaccount.google.com/apppasswords (16 letters).
3. In Vercel → Settings → Environment Variables, add `SMTP_USER` (the Gmail address) and `SMTP_PASS`
   (the App password) for Production, then redeploy — or put them in `.env.local` and run
   `npm run setup:vercel`.
4. Open `/api/health`: `"email": { "configured": true }` means it is on. In the dashboard, open a
   registration and use **Preview email** or **Resend confirmation email**.

Gmail sends up to about 500 emails a day. To use another provider, also set `SMTP_HOST`,
`SMTP_PORT` and, if its login isn't an email address, `EMAIL_FROM`. The email images live in
`public/email`; rebuild them with `node scripts/make-email-art.mjs` after changing a logo.

## Tech stack

| Part | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) + React 19, TypeScript |
| Styling | Plain CSS (water theme with gold launch accents, light & dark mode, responsive) |
| Database | Airtable (Web API, called only from the server) |
| Excel export | ExcelJS |
| Hosting | Vercel, deployed from GitHub |

The Airtable token never reaches the browser: the form posts to `/api/submit`, and the
dashboard reads through `/api/responses`, both running on Vercel's servers.

## Environment variables

| Name | Required | Description |
| --- | --- | --- |
| `AIRTABLE_TOKEN` | yes | Airtable personal access token with scopes `data.records:read`, `data.records:write`, `schema.bases:read`, `schema.bases:write`, and access to the WEP base. The same token as the Consultative Meeting works |
| `AIRTABLE_BASE_ID` | no | Defaults to the WEP base `appBTvrLNv8i0QLkX`. Set only to use a different base |
| `AIRTABLE_TABLE_ID` | no | Defaults to the "WEP Official Launch" table `tbl5pLa2GQIMpxLZq` in the WEP base |
| `DASHBOARD_PASSWORD` | yes | Password for `/dashboard` — share only with the WEP team |
| `CHECKIN_PASSWORD` | optional | Desk password for volunteers: opens only the scanner at `/checkin`. Changing it signs out every desk that used the old one |
| `SESSION_SECRET` | optional | Long random string used to sign dashboard sessions |
| `SMTP_USER` | for email | Account that sends the confirmation emails (a Gmail address by default) |
| `SMTP_PASS` | for email | Its password — for Gmail, an **App password**, not the normal one |
| `SMTP_HOST`, `SMTP_PORT` | optional | Mail server for providers other than Gmail (default `smtp.gmail.com`, `465`) |
| `EMAIL_FROM` | optional | Sender name and address; needed only when `SMTP_USER` isn't an email address |
| `EMAIL_REPLY_TO` | optional | Where replies go, if not to the sender |

In Vercel, make sure each variable is enabled for **Production** (not only Development).

Copy `.env.example` to `.env.local` for local development. **Never commit `.env.local`** — it is
already in `.gitignore`.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 (form) and http://localhost:3000/dashboard (dashboard).

## Check the connection

Open **`/api/health`** on any deployment, e.g.
https://wep-official-launch-registration.vercel.app/api/health. It reports whether the Airtable
token is present and working, whether the dashboard and desk passwords are set, and whether
email is configured, without showing any secret values. `"ok": true` means everything is connected.

## Deploy to Vercel through GitHub

1. **Create a GitHub repository** (private is recommended), e.g. `wep-official-launch-registration`,
   without a README.
2. **Push this folder** to it:
   ```bash
   git init -b main
   git add .
   git commit -m "WEP Official Launch registration form and dashboard"
   git remote add origin https://github.com/<your-account>/wep-official-launch-registration.git
   git push -u origin main
   ```
3. In **Vercel** → *Add New… → Project* → *Import* the GitHub repository and name the project
   `wep-official-launch-registration` (that gives the `wep-official-launch-registration.vercel.app`
   address). The framework is detected as Next.js; keep the default build settings.
4. Before clicking *Deploy*, open **Environment Variables** and add `AIRTABLE_TOKEN` and
   `DASHBOARD_PASSWORD` for Production — or skip this and run `npm run setup:vercel` afterwards.
5. Click **Deploy**. Every later `git push` to `main` redeploys automatically.

### Connect Vercel to Airtable automatically

With your token in `.env.local`, run:

```bash
npm run setup:vercel
```

It signs you in to Vercel (browser), links this folder to the Vercel project (choose
`wep-official-launch-registration`), saves `AIRTABLE_TOKEN` and the email settings (`SMTP_USER`, `SMTP_PASS`…) for Production
and Preview (plus `DASHBOARD_PASSWORD` / `CHECKIN_PASSWORD` / `SESSION_SECRET` only if Vercel
doesn't have them yet) as encrypted variables, and redeploys production.

## Airtable

Registrations go to the **"WEP Official Launch"** table in the same WEP base as the
Consultative Meeting's "BCG WEP" table. The columns are the same as the Consultative Meeting:

`Reference No.` (primary), `Submitted At`, `Data Privacy Consent`, `Province`,
`City/Municipality`, `Barangay`, `Barangay Hall Address`, `Barangay Contact Number`,
`Barangay Email`, `Barangay Chairperson`, `Focal Person`, `Focal Person Contact Number`,
`Focal Person Email`, `Will Attend`, `No. of Attendees`, and for attendees 1 and 2:
`Name`, `Contact Number`, `Gender`, `PWD`, plus the check-in desk's `Attended` (checkbox) and
`Checked In At`.

If the table or any column goes missing, the dashboard shows a **"Create fields now"** button,
and the form also repairs the schema on its first submission. Don't rename these columns in
Airtable (the app looks them up by name; if you must, update `lib/fields.ts`). Extra columns you
add — e.g. a status or remarks column for the secretariat — are ignored by the app.

## Customising

| What | Where |
| --- | --- |
| Event date, time, **venue** (empty = "to be announced"), seat target | `lib/config.ts` → `EVENT` |
| City / municipality list | `lib/config.ts` → `LOCATIONS` |
| Questions, labels, Data Privacy Notice text | `components/form/RegistrationForm.tsx` |
| Event pass, confetti | `components/form/LaunchPass.tsx` |
| Calendar invite | `lib/ics.ts` |
| Confirmation email | `lib/email/template.ts` (images in `public/email`) |
| Check-in desk | `components/checkin/CheckInDesk.tsx`, `app/checkin/checkin.css` |
| Countdown | `components/Countdown.tsx` |
| Intro animation | `components/Splash.tsx`, "Splash screen" section of `app/globals.css` |
| Validation rules and messages | `lib/validation.ts` |
| Colours and animation | `app/globals.css`, `app/dashboard/dashboard.css` |
| Logo | `assets/brand/mwss-ro-wep-logo.png` (the official artwork). After replacing it, run `node scripts/make-brand-art.mjs`: it makes the white-lettered version for the ocean backgrounds (`public/brand/lockup.png`), the pieces the intro animates (`public/brand/layers`, `lib/brand-layers.ts`), the email copy and the link-preview image |

## Security notes

- The Airtable token and dashboard password live only in Vercel environment variables.
- Dashboard sessions use a signed, HTTP-only cookie that expires after 12 hours.
- The form has server-side validation, a size limit, and a hidden honeypot field against bots.
- The check-in desk only receives barangay, city, attendee names and PWD status — never contact
  numbers, emails or addresses. The camera is allowed on `/checkin` only.
- The Gmail App password lives only in Vercel (`SMTP_PASS`) and `.env.local`; revoke it at
  https://myaccount.google.com/apppasswords if it leaks.
- Form drafts are kept in the browser tab only (`sessionStorage`) and are cleared when the
  tab closes or the form is submitted — safer on shared barangay computers.
