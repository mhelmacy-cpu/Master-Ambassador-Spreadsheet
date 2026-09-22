# Master Tour & Ambassador Scheduler

A Google Apps Script app, bound to a Google Sheet, for running a school's
visitor-tour and student-ambassador program end to end:

- **Schedule tours** from prospective families / visiting groups — including
  a one-click generator for the recurring Wednesday-morning tour slate.
- **Record touring-student info** (name, grade, borough, gender, school,
  allergies, chaperone) and assign each one of the 7 fixed walking **Tour
  Routes**, so no two families collide on the same path at the same time.
- **Assign student ambassadors** to jobs on those tours — only ambassadors
  who are marked **Active** and **Eligible** for that job are selectable,
  and the tool blocks double-booking.
- **Staff an entire tour in one click**: the 4 roles (Panelist, Lobby
  Greeter, Table Greeter, Tour Guide) are suggested automatically —
  spread fairly across the roster, and Tour Guides matched to each
  visiting student by grade/borough/gender — for staff to review and
  confirm before anything is saved.
- **See where ambassadors are right now** on a live **Dashboard** tab:
  "Happening Now," "Starting Soon," and "Today's Full Schedule" — built so
  front-office staff can glance at it and go pull the right kid.
- **Track each ambassador's tour history** — Total Tours and Last Tour
  Date columns on the Ambassadors sheet, kept current automatically.
- **Email teachers automatically, once a week**, a list of when their
  student(s) will be pulled for ambassador duty — plus a per-tour-day
  send covering ambassadors, the teachers they're missing class from,
  and the teachers receiving touring visitors (headcount only).
- **Manage job eligibility** per ambassador with a simple checkbox matrix.

## How it's organized

Everything lives as a Google Sheet with an attached Apps Script project.
The script source lives in [`src/`](src/) in this repo so it's version
controlled; see [`SETUP.md`](SETUP.md) for how to get it into an actual
Google Sheet (two options: paste into the Apps Script editor, or push with
`clasp`).

### Sheets it creates

| Sheet | Purpose |
|---|---|
| **Dashboard** | Auto-generated, read-only live view. Don't edit by hand — it's rebuilt on every refresh. |
| **Tours** | One row per scheduled visit/tour. |
| **Tour Routes** | Reference sheet: the 7 fixed walking routes (direction, Humanities teacher, language stop, full stop-by-stop itinerary), all running 8:30-9:25. Not edited day-to-day. |
| **Touring Students** | Visiting students tied to a Tour ID, each optionally assigned one of the 7 Routes (blocked from double-booking a route on the same tour). |
| **Assignments** | The master schedule: which ambassador is doing which job, for which tour, when. |
| **Ambassadors** | Your roster of student ambassadors (name, grade, homeroom pod, borough, gender, both parents' contact info, teacher/advisor, active status, and auto-computed Total Tours / Last Tour Date). Ships pre-seeded with the current roster. |
| **Eligibility** | Checkbox matrix: ambassador rows × job columns. |
| **Jobs** | The 4 tour roles: Panelist, Lobby Greeter, Table Greeter, Tour Guide. |
| **Teachers** | Teacher names + email addresses, used for the weekly email and as the "Teacher" dropdown on Ambassadors. |
| **Settings** | Key/value settings: school name, email schedule, dashboard refresh window. |

### Menu

Opening the spreadsheet adds a **🎓 Tour & Ambassador Scheduler** menu with:

- **First-Time Setup** — creates every sheet, headers, dropdowns, and sample rows. Safe to re-run any time.
- **Schedule a Tour…**, **Add Touring Student…**, **Assign Ambassador…** — form dialogs, so staff never has to hand-edit raw rows.
- **Generate Wednesday Tours…** — bulk-creates recurring Wednesday-morning tours (8:30-9:25, matching the Tour Routes schedule) for however many weeks you ask for, starting from a given date (default 9/30). Rolls a non-Wednesday date forward and skips any week that already has a tour, so it's safe to re-run.
- **Staff This Tour…** — pick a tour and it suggests one Panelist, one Lobby Greeter, one Table Greeter, and (for every touring student added to that tour) 2 Tour Guides each. Every dropdown is editable before you click Confirm & Save — nothing is written until you do. See **Staffing algorithm** below for exactly how picks are ranked.
- **Sync Homerooms / Advisors** — re-matches Ambassadors against the official Homeroom/Advisories roster (`HOMEROOM_DATA_` in `HomeroomSeedData.gs`) by name, refreshing Grade/Homeroom Pod/Teacher. Re-run it after pasting in a new year's roster data. A student who was 8th grade and no longer matches is assumed to have graduated Middle School and is marked Inactive with a note — check and undo if that's wrong.
- **Import / Update Ambassadors…** — paste a roster (Name, Grade, Borough, Parent 1 Name/Email, Parent 2 Name/Email — tab- or comma-separated, straight out of a spreadsheet) and it upserts the Ambassadors sheet. Matches on name **and** borough, since a student can legitimately have two rows (one per borough they're paired with). Fields you've hand-set per student — Teacher, Student Email, Active, Notes — are never overwritten by an import.
- **Rebuild Eligibility Matrix** — re-syncs the checkbox grid after you add ambassadors or jobs (keeps existing checkmarks).
- **Refresh Dashboard Now** — manually rebuild the live view.
- **Send Tour Day Emails…** — pick a tour that's already been staffed and sends 3 rounds of email: each participating ambassador gets their own schedule; each ambassador's teacher is told which student(s) they'll miss and when; each teacher receiving touring visitors (the grade-matched guide's own class) is told how many to expect — no names, per instruction.
- **Send Weekly Teacher Emails Now** — trigger the rolling weekly digest immediately (good for testing).
- **Automation** submenu — turn the weekly email and/or 10-minute dashboard auto-refresh on or off.

## Everyday usage

1. Add teachers (**Teachers** sheet) and jobs (**Jobs** sheet) first.
2. Add ambassadors (**Ambassadors** sheet), then run **Rebuild Eligibility
   Matrix** and check off which jobs each ambassador is eligible for.
3. Use **Schedule a Tour…** when a visit is booked.
4. Use **Assign Ambassador…** to staff that tour — the dropdown only shows
   eligible, active, and free (non-conflicting) ambassadors.
5. Check the **Dashboard** tab any time to see who's out right now or about
   to go out, so the front office can send a pass / call the classroom.
6. Turn on **Automation → weekly teacher emails** once, and teachers get a
   heads-up email every week listing when their student(s) will step out.

## Staffing algorithm

**Panelist / Lobby Greeter / Table Greeter** — one pick each, from
ambassadors who are Active, marked Eligible for that job (Eligibility
sheet), and free at the tour's time. Ranked by fairness (fewest **Total
Tours** first, so duty rotates), with a within-pass tiebreak so the same
kid isn't suggested for two roles on the same tour unless the pool is too
small to avoid it.

**Tour Guide** — 2 per touring student (from the Touring Students rows
added to that tour), ranked by grade fit + borough fit + fairness, but
**Grade and Gender are hard constraints, not just weighted scores**: at
least one of the 2 guides must be the *exact* same grade as the grade
the student is applying to (this applies to every grade, not just one),
and at least one must match Gender, whenever the eligible/available pool
allows it. A single guide covering both is preferred; otherwise the two
constraints are split across guide 1 and guide 2. So a 5th-grade
applicant touring with a 5th and 6th grader is paired with the 5th
grader for both guide duty and the class visit; a boy touring might get
one girl guide and one boy guide, or two boys — the rule only guarantees
*at least one* match on each axis, never that both guides must match.

**The "bring visitors to class" step isn't a separately-computed
room** — it's simply wherever the grade-matched guide's own class
already is (their Homeroom Pod + Teacher, from the roster sync). Up to 3
touring students are steered toward the same class before spreading to
another one of that grade's classes; if there aren't enough
grade-matched guides available to stay under that, it goes over rather
than leaving a student without a grade match — flagged in the dialog for
staff to rebalance by hand. The dialog also reminds staff to verify the
class isn't PE, Music, or Choices before walking a family over: the
school's bell-schedule PDF splits each subject into parallel sections
(A/B/C) without saying which named student is in which section, so
there's no reliable way to compute a specific ambassador's live subject
automatically — this is a manual check, not a bug.

Nothing is ever saved by the suggestion step itself — **Staff This
Tour…** always shows an editable slate first, and only writes to
Assignments when you click Confirm & Save. If a suggested pick turns out
to conflict with something saved after the suggestion was generated,
that one row is skipped with an error shown in the results (the rest of
the slate still saves). Each touring student's assigned Route (if any) is
shown alongside their name so guides know which itinerary to walk —
route matching itself has nothing to do with grade/borough/gender; it's
purely "which of the 7 physical paths is free," picked when the student
is added on the **Add Touring Student…** dialog.

## Notes on the design

- Ambassadors are matched by full name (First + Last) across sheets rather
  than a synthetic ID, since this is meant to be edited directly by
  non-technical staff and row-based IDs break when rows are
  sorted/deleted. The Import feature matches on name **+ borough**
  specifically to allow the same student to appear twice (see Blake Glenn
  in the seed data) without the second row being treated as a duplicate.
- Borough uses single-letter codes (M/B/Q/X/S/J) with a dropdown and a
  note on the header cell explaining the legend — hover the **Borough**
  header on the Ambassadors sheet to see it.
- The **Dashboard** sheet is fully regenerated on refresh — anything typed
  into it directly will be wiped on the next refresh.
- All the "business logic" (eligibility checks, conflict detection,
  ID generation) lives in the `.gs` files, not in spreadsheet formulas, so
  it keeps working even if someone reorders or reformats columns.
