# Master Tour & Ambassador Scheduler - agreed design

Decisions confirmed with the admissions office. This is the spec the
rebuild is built from; `data/school-data.json` holds the data it runs on.

## Sheets

### Ambassadors
Seeded with the 31 student names. Everything else is entered by the office.

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

## Emails

Four rounds, sent Monday 2pm, Tuesday 8am and Wednesday 7:30am (Google
spreads these over roughly fifteen minutes either side):

1. the student - their job, and to be in the cafeteria at 8:25
2. their advisor - "your advisee(s) are out"
3. the teacher whose class they are missing - worked out from the split
4. the teacher receiving visitors

Sent from whichever account authorizes the script and switches the
triggers on, so setup must be done signed in as mhelmacy@lrei.org.
Display name and Reply-To are both set on the Settings sheet.

## Still needed from the office

- `Gender` for all 31 ambassadors - not present in any file supplied.
- Teacher email addresses on the Teachers sheet; names and initials are
  filled in automatically. Nothing sends without these.
- Confirm whether Ozzy Gutmann is Oscar Gutmann (6th, DJM).
