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

Everything about tours is on the left; contact details (student email,
both parents' names and emails) sit to the right of it. First-Time Setup
moves them there once, carrying their formatting, and does nothing on
later runs.

Three columns are written by the script, not typed:

    Signed Up   jobs she has given them, the number to look at before a tour
    Confirmed   jobs she has ticked off afterwards, the one that counts
    Jobs Done   those confirmed jobs broken out, "2 Tour Guide, 1 Lobby Greeter"

### Prospective Students

Only the tour date and the name are needed. Every other column is a rule
she can leave out by leaving it blank:

- **Grade** blank: any grade will do, and the dialog says so on that row.
- **Gender** blank: no gender rule for that visitor.
- **Race** blank: no student of color is required for them. The separate
  rule that a pair is never two students of color still applies, because
  that one is about the pair, not about the visitor.
- **Borough** blank: borough stops being a tiebreak for them.
- **Full Pay / Well Connected** blank: an ordinary family.
- **Class Visit** blank: no class visit.

A blank column never means the family gets nobody.

    Name | School | Gender | Borough | Grade

Grade is the one addition to what was asked for: guide pairing matches on
borough, grade and gender, so without it the grade rule cannot run.

### Tour Tracker
One row per ambassador per tour. This is the record of who did what.

    Tour Date | Ambassador | Job | Prospective Student(s) | Notes

`Prospective Student(s)` is filled in only for Tour Guides. Running totals
per ambassador (tours done, jobs done, last tour) are computed from this,
not typed.

### Keep Apart

Pairs of ambassadors who are never put together: never the same pair of
tour guides, never the same greeting crew. They can both work the same
tour, and both guide, as long as they are with different families.

Rows can be added at any point in the season. The sheet is read afresh
at every staffing run, so a pair added on a Tuesday holds that Wednesday
with no setup run in between.

First names are enough, and a double first name is matched on either
part, so "Afia" finds Afia-Kusiwaa Twumasi. A name matching nobody, or
matching two people, is reported in the warnings rather than guessed at.

The rule never bends. Where it leaves a place unfilled, the dialog says
that is why. Panelists are exempt, since those are picked by hand.

### Jobs and Eligibility

Every ambassador gets an Eligibility row automatically - staffing tops
the sheet up before it plans, so a name typed onto the Ambassadors sheet
is never quietly left out. New rows default to Yes for every job; a No
set by hand is never overwritten.
Unchanged: Panelist, Lobby Greeter, Table Greeter, Tour Guide, and the
matrix of who can do which.

## What the staffing command does

One command, run once the prospective students are entered. It assigns:

- **Tour Guides** - two per prospective student, matched on borough,
  grade and gender. Grade and gender are requirements; borough is a
  preference. Most tours are rising 6th graders, so that pair reads
  `6 and 6 or 8`: a 6th grader first, and a second 6th grader where
  there is one free, an 8th grader where there is not. Only if a place
  would otherwise go empty does it widen further, since one guide and a
  gap is worse than a guide from another year.

  The pair always includes at least one guide of the visitor's own
  gender while anyone of that gender is free. That outranks every other
  preference, including "never two students of color" and "no Low for a
  priority family"; only the grade comes first. Where nobody of that
  gender is free at all, the pair is made anyway and the dialog says so.

  A visitor marked **Full Pay** or **Well Connected** on Prospective
  Students is paired first, and their guides come from the **High**
  Strength ambassadors, then Medium (which is what a blank counts as).
  A Low is used only if nobody else fits at all, and the dialog says so
  when that happens. It never overrides grade, gender or race - it only
  decides who is picked among the ones who already fit. Each guide pair is assigned a **tour route** (one family
  per route, seven routes available), for the Wednesday morning slot.
  With more families than routes, the list starts again at route 1 and
  the sharing is flagged in the dialog.
- **Lobby Greeters** - three.
- **Table Greeters** - two.

It does **not** assign **Panelists**. Those are chosen by hand - but by
ticking them in the dialog rather than typing them onto the tracker. The
command offers everyone still free (and anyone already on the panel,
ticked), marks the yellow lights, and whoever is ticked when she saves is
written to the Tour Tracker as a Panelist. That is what puts them in the
Tuesday and Wednesday emails with everybody else.

Unticking somebody takes their row off again. A name typed straight onto
the tracker that the dialog never offered is left alone.

Because of that, the command finishes by listing every ambassador it did
not use, so the panel can be picked from that list without double-booking
anyone who is already guiding or greeting.

Nobody is given two jobs in the same slot. Whoever has done fewest jobs
so far is offered first, so the work spreads evenly across the year.

### Reference sheets
Bell Schedule, Teachers, Tour Routes, Settings.

Jobs also carries `Out of Class From` and `Out of Class To` - how long
each job really keeps somebody away, which is not the length of the
period they are missing. A greeter is back before the bell.

    Panelist        8:25 AM - 9:05 AM
    Lobby Greeter   8:25 AM - 8:55 AM
    Table Greeter   8:25 AM - 8:55 AM
    Tour Guide      8:25 AM - 9:05 AM
    Class Buddy     9:05 AM - 9:25 AM

The teacher email prints this window, the student email uses the end of
it for "back in class by", and it is also what decides which class the
email goes to - a panelist back at 9:05 is not reported absent from a
period starting after that. All of it follows the sheet, so changing a
time there changes what goes out.

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

### Staffing again after a late sign-up

"Keep what is already assigned" is ticked by default. Ticked, the
command leaves every pair, route, crew and class visit already on the
Tour Tracker exactly as it is, and staffs only students who have no
guides yet - routes carry on from the last one used, and nobody already
working gets a second job. Untick it to start that date over.

Panelists are never touched either way: the command does not assign
them, so it does not delete them.

## Confirming a tour afterwards

"Confirm a Tour Afterwards..." lists everyone staffed for a date, all
ticked. She unticks whoever did not work and saves. A tour that never
happened has its own box, which marks everyone at once.

Anyone left unticked is written as No rather than blank, so "not yet
confirmed" and "did not turn up" stay different things. Re-opening the
date brings her own answers back rather than a fresh list.

A no-show is not charged against the child: fairness counts every job
except one marked No, so a child pulled on the day goes first next time.

## Writing an email by hand

"Write an Email..." is her own correspondence, not the automatic
reminders. She picks an audience, ticks the people, types the message,
and it **opens in Gmail** with the addresses, subject and text already
in it, for her to read over and send. Nothing in this dialog ever sends.

It works through a compose link, which is only a URL. Nothing here
touches a mail service, deliberately: the moment one is named anywhere
in the file, Apps Script demands access to her whole mailbox and
refuses to run anything at all until it is granted, which a school
account may not be allowed to do. A list too long for a URL is flagged,
and the addresses come back as text to copy instead.

    Teachers                        from the Teachers sheet
    Ambassadors                     their own addresses
    Ambassadors and their parents   both, per child
    Parents only                    labelled by the child, addressed to the parents

Everyone goes in Bcc by default, so a family never sees another family's
address; one untick puts them all in the To line instead. Anybody ticked
who has no address on file is named back to her rather than quietly
dropped.

## Printouts

Two documents, both built as Google Docs so they can be corrected on the
morning before they reach the printer.

- **Print Tour Routes** - one page per tour guide, addressed to them by
  name, ordered route 1, route 1, route 2, route 2, so the stack comes
  off the printer ready to hand out. Double spaced, short sentences, and
  it always ends by saying whether they are done. Their copy carries who
  they are taking, who is with them, the walk itself, and what to do at
  9:06 - which differs between the two guides, so each is told only
  their own part.
- **Print Locker Slips** - one slip per ambassador, several to a page in
  bordered boxes so the page cuts into strips. They go up on lockers on
  Tuesday morning, so each one is four lines and no more: name (with
  homeroom and advisor, for sorting the pile), the date in full, the job
  with the visitor and route, and where to be and when they are back.
  The 5th grade class visit buddies are left out, the same as the emails
  - they are told in person, and their instructions print on the
  visitor's route sheet.

      AURELIA WALKER   (CCM - Marco)
      Wednesday, October 7
      Tour Guide for Visitor 1 - route 1
      Cafeteria 8:25 AM. Back in class by 9:25 AM.

## Emails

Two audiences, on separate schedules.

### Teachers and advisors - two sends

    Tuesday    8:30 AM
    Wednesday  7:45 AM

Every ambassador on the Tour Tracker is treated the same, whatever the
job - a panelist gets their own email, their advisor hears, and so does
the teacher whose class they walk out of.

Three rounds go out together each time:

- the advisor - "your advisee(s) are out"
- the teacher whose class the student is missing - worked out from the
  student's split, not their homeroom
- the teacher whose class is receiving visitors

### Students - two sends

    Tuesday   12:00 PM
    Wednesday  7:45 AM

One round: the student's own job, and to be in the cafeteria at 8:25.
No route number: they are handed their route on paper on the morning,
and a number in an email the day before only confuses them. The locker
slips leave it out for the same reason.

### How the wording adapts

The same message goes out on two different days, so it never says a
flat "today". It reads Today, Tomorrow, or the weekday by name, worked
out from when it is actually being sent.

### Timing in practice

Apps Script takes whole hours, so the times that are not on the hour use
`nearMinute`, and Google runs every time-based trigger within about
fifteen minutes either side of the time asked for. So:

    Tuesday 8:30 AM ->  roughly 8:15 - 8:45 AM
    Tuesday noon    ->  roughly 11:45 AM - 12:15 PM
    Wednesday 7:45  ->  roughly 7:30 - 8:00 AM

Tuesday's two sends are three and a half hours apart, so the teachers
always hear well before the students. The Wednesday send is the tight
one: at the late end it arrives 8:00 AM, still twenty-five minutes before
ambassadors are due in the cafeteria at 8:25.

### Testing them

"Send Emails Now..." opens with **Test** ticked. Ticked, every copy goes
to whoever is running the script - or to a `Preview Email To` address on
Settings, if one is typed there - with a line at the top naming the
address it would really have gone to. Nothing reaches a student or a
teacher. Untick it to send for real.

A test runs **both sends**, each worded for the day it goes out, so one
click shows everything that will really arrive:

    [TEST - Students, Tuesday 12:00 PM] Your Tour Job - Tomorrow
    [TEST - Students, Wednesday 7:45 AM] Your Tour Job - Today

A test sends **one copy per kind**, not one per person - one of each job
for the students, and one advisor, one class teacher and one host
teacher - twice over for the two days. Who would have been skipped for
want of an address is still worked out for everybody and still reported,
so the test says what a real send would do without filling her inbox
with the same message thirty times.

### The roster

Every send, test or real, and the automatic teacher send on Tuesday and
Wednesday morning, also builds a Google Doc and mails her the link:

    Student                Role                        Class teacher       Advisor
    Afia-Kusiwaa Twumasi   Lobby Greeter               Lila, Eliza         Eliza
    Aurelia Walker         Tour Guide for Sam Visitor  Jeremiah            Marco

One line per ambassador on duty, so the office has in one place what the
emails only say one person at a time. The 5th grade buddies are not on
it, the same as the emails.

The redirect works inside `mailOptions_`, which every message is built
by, so a send cannot get past it - and it is cleared in a `finally`, so
a test run that fails part way cannot leave the next real send pointing
at the wrong place.

### Who they come from

Whichever account authorizes the script and switches the triggers on, so
setup must be done signed in as mhelmacy@lrei.org. Display name and
Reply-To are both set on the Settings sheet.

A tour that has not been staffed yet is skipped rather than mailed to
nobody, so staff the tour before Tuesday morning for the first send to
go out.

## Still needed from the office

- `Gender` for all 31 ambassadors - not present in any file supplied.
- Teacher email addresses on the Teachers sheet; names and initials are
  filled in automatically. Nothing sends without these.
Ozzy Gutmann is Oscar Gutmann - confirmed by the office and corrected,
so all 31 ambassadors now match the roster.
