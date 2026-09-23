# Master Tour & Ambassador Scheduler - agreed design

Decisions confirmed with the admissions office. This is the spec the
rebuild is built from; `data/school-data.json` holds the data it runs on.

## Sheets

### Ambassadors
Seeded with the 31 student names and nothing else - every other column
is entered by the office.

    First Name | Last Name | Homeroom | Split | Grade | Advisor | Borough |
    Gender | Parent 1 Name | Parent 1 Email | Parent 2 Name |
    Parent 2 Email | Active (Yes/No dropdown)

- `Split` is A/B/C and is load-bearing: it decides which class a student
  is missing on any lettered period. See "Reading the schedule" below.
- `Grade` is needed to pair guides with visiting students of the same grade.
- No Language column - dropped. The only language block inside an
  8:30-9:25 tour window all week is MMS (5th grade) on Wednesday, and
  there are no 5th grade ambassadors.

### Prospective Students

    Name | School | Gender | Borough | Grade

Grade is the one addition to what was asked for: guide pairing matches on
borough, grade and gender, so without it the grade rule cannot run.

### Tour Tracker
One row per ambassador per tour. This is the record of who did what.

    Tour Date | Ambassador | Job | Prospective Student(s) | Notes

`Prospective Student(s)` is filled in only for Tour Guides. Running totals
per ambassador (tours done, jobs done, last tour) are computed from this,
not typed.

### Jobs and Eligibility
Unchanged: Panelist, Lobby Greeter, Table Greeter, Tour Guide, and the
matrix of who can do which.

## What the staffing command does

One command, run once the prospective students are entered. It assigns:

- **Tour Guides** - two per prospective student, matched on borough,
  grade and gender. Grade and gender are requirements; borough is a
  preference. Each guide pair is assigned a **tour route** (one family
  per route, seven routes available), for the Wednesday morning slot.
  With more families than routes, the list starts again at route 1 and
  the sharing is flagged in the dialog.
- **Lobby Greeters** - three.
- **Table Greeters** - two.

It does **not** assign **Panelists**. Those are chosen by hand.

Because of that, the command finishes by listing every ambassador it did
not use, so the panel can be picked from that list without double-booking
anyone who is already guiding or greeting.

Nobody is given two jobs in the same slot. Whoever has done fewest jobs
so far is offered first, so the work spreads evenly across the year.

### Reference sheets
Bell Schedule, Teachers, Tour Routes, Settings.

## Reading the schedule

Every student belongs to two cross-cutting groups: a homeroom pod (their
advisory) and a split (A/B/C, grade-wide). Roughly half the week runs in
each.

- A block carrying a section letter - `Math A`, `Art B`, `Science C` -
  belongs to the SPLIT group that letter names.
- A block with no letter - `Hum DR M211` - belongs to the POD.

Each pod column carries exactly one letter all week (DJM=A, AOS=B, CCM=C,
EEL=A, MSB=B, CJM=A, RSS=B), which is what makes the column look like the
pod until you check a student whose split differs from it. Sixteen of the
thirty rostered ambassadors are that case.

## Printouts

Two documents, both built as Google Docs so they can be corrected on the
morning before they reach the printer.

- **Print Tour Routes** - one page per visiting student: their guides,
  their route, their class visit, and the handoff note at the bottom.
- **Print Locker Slips** - one slip per ambassador, saying what their
  email says, several to a page in bordered boxes so the page cuts into
  strips. Each carries the ambassador's homeroom and advisor, their jobs
  with the visitor and route, and where to report. The 5th grade class
  visit buddies are left out, the same as the emails - they are told in
  person, and their instructions print on the visitor's route sheet.

## Emails

Two audiences, on separate schedules.

### Teachers and advisors - two sends

    Monday    11:00 AM
    Wednesday  7:45 AM

Three rounds go out together each time:

- the advisor - "your advisee(s) are out"
- the teacher whose class the student is missing - worked out from the
  student's split, not their homeroom
- the teacher whose class is receiving visitors

### Students - three sends

    Monday     3:30 PM
    Tuesday   12:00 PM
    Wednesday  7:45 AM

One round: the student's own job, and to be in the cafeteria at 8:25.

### How the wording adapts

The same message goes out on three different days, so it never says a
flat "today". It reads Today, Tomorrow, or the weekday by name, worked
out from when it is actually being sent.

### Timing in practice

Apps Script takes whole hours, so the times that are not on the hour use
`nearMinute`, and Google runs every time-based trigger within about
fifteen minutes either side of the time asked for. So:

    Monday 11:00 AM ->  roughly 10:45 - 11:15 AM
    Monday 3:30 PM  ->  roughly 3:15 - 3:45 PM
    Tuesday noon    ->  roughly 11:45 AM - 12:15 PM
    Wednesday 7:45  ->  roughly 7:30 - 8:00 AM

Monday's two sends are four and a half hours apart, so the teachers
always hear well before the students. The Wednesday send is the tight
one: at the late end it arrives 8:00 AM, still twenty-five minutes before
ambassadors are due in the cafeteria at 8:25.

### Who they come from

Whichever account authorizes the script and switches the triggers on, so
setup must be done signed in as mhelmacy@lrei.org. Display name and
Reply-To are both set on the Settings sheet.

A tour that has not been staffed yet is skipped rather than mailed to
nobody, so staff the tour before Monday afternoon for the first send to
go out.

## Still needed from the office

- `Gender` for all 31 ambassadors - not present in any file supplied.
- Teacher email addresses on the Teachers sheet; names and initials are
  filled in automatically. Nothing sends without these.
Ozzy Gutmann is Oscar Gutmann - confirmed by the office and corrected,
so all 31 ambassadors now match the roster.
