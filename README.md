# Master Tour & Ambassador Scheduler

A Google Apps Script app, bound to a Google Sheet, for running a school's
visitor-tour and student-ambassador program end to end:

- **Schedule tours** from prospective families / visiting groups.
- **Record touring-student info** (name, grade, school, allergies, chaperone).
- **Assign student ambassadors** to jobs on those tours — only ambassadors
  who are marked **Active** and **Eligible** for that job are selectable,
  and the tool blocks double-booking.
- **See where ambassadors are right now** on a live **Dashboard** tab:
  "Happening Now," "Starting Soon," and "Today's Full Schedule" — built so
  front-office staff can glance at it and go pull the right kid.
- **Email teachers automatically, once a week**, a list of when their
  student(s) will be pulled for ambassador duty.
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
| **Touring Students** | Visiting students tied to a Tour ID. |
| **Assignments** | The master schedule: which ambassador is doing which job, for which tour, when. |
| **Ambassadors** | Your roster of student ambassadors (name, grade, teacher, active status). |
| **Eligibility** | Checkbox matrix: ambassador rows × job columns. |
| **Jobs** | The list of jobs ambassadors can be assigned to (Tour Guide, Greeter, etc). |
| **Teachers** | Teacher names + email addresses, used for the weekly email and as the "Teacher" dropdown on Ambassadors. |
| **Settings** | Key/value settings: school name, email schedule, dashboard refresh window. |

### Menu

Opening the spreadsheet adds a **🎓 Tour & Ambassador Scheduler** menu with:

- **First-Time Setup** — creates every sheet, headers, dropdowns, and sample rows. Safe to re-run any time.
- **Schedule a Tour…**, **Add Touring Student…**, **Assign Ambassador…** — form dialogs, so staff never has to hand-edit raw rows.
- **Rebuild Eligibility Matrix** — re-syncs the checkbox grid after you add ambassadors or jobs (keeps existing checkmarks).
- **Refresh Dashboard Now** — manually rebuild the live view.
- **Send Weekly Teacher Emails Now** — trigger the email immediately (good for testing).
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

## Notes on the design

- Ambassadors are matched by full name (First + Last) across sheets rather
  than a synthetic ID, since this is meant to be edited directly by
  non-technical staff and row-based IDs break when rows are
  sorted/deleted.
- The **Dashboard** sheet is fully regenerated on refresh — anything typed
  into it directly will be wiped on the next refresh.
- All the "business logic" (eligibility checks, conflict detection,
  ID generation) lives in the `.gs` files, not in spreadsheet formulas, so
  it keeps working even if someone reorders or reformats columns.
