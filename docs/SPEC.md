# Master Tour & Ambassador Scheduler - agreed design

Decisions confirmed with the admissions office. This is the spec the
rebuild is built from; `data/school-data.json` holds the data it runs on.

## Sheets

### Ambassadors
Seeded with the 31 student names and nothing else - every other column
is entered by the office.

    First Name | Last Name | Homeroom | Split | Grade | Advisor | Borough |
    Gender | Race (Presenting) | Light | Strength | Can Solo |
    Active (Yes/No dropdown)

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
  decides who is picked among the ones who already fit.

  **Can Solo.** A Yes in that column on Ambassadors says this one is
  steady enough to walk a family round by themselves. It is not a
  shortcut: everybody is paired up first, and only when the second place
  has nobody in it at all does it come into play. Then, rather than
  reach outside the rules for a second body, the family goes out with
  the one guide, and the dialog says who is on their own. Blank or No
  and they are never sent out alone. Each guide pair is assigned a **tour route** (one family
  per route, seven routes available), for the Wednesday morning slot.
  With more families than routes, the list starts again at route 1 and
  the sharing is flagged in the dialog.
- **Lobby Greeters** - three.
- **Table Greeters** - two.

It does **not** assign **Panelists**. Those are chosen by hand, and they
are chosen **first**: the staffing dialog opens on the panel, and only
once she has submitted it (or said there is no panel this week) does the
rest appear. Everything after that is assigned around her panel, so a
panelist is never handed a second job - including when she unticks
"keep what is already assigned" and starts the date over, because the
panel is hers and a re-run never clears it.

She ticks them in the dialog rather than typing them onto the tracker. The
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

### Changing a guide before it is saved

Every guide in the preview is a dropdown holding that person plus
everybody still free to guide (active, allowed the job, not already
working that tour), each shown with grade, gender, race, strength and
how many jobs they have done, least busy first. Change as many as she
likes and press Save: what she picked is what reaches the Tour Tracker
and Prospective Students.

The swap is refused only where it would break the sheet rather than a
matching rule: a name not on the Ambassadors sheet, somebody not
Active, somebody already working that tour, or two people the Keep
Apart list says cannot walk the same family. Anything else goes
through, and the Saved message says what each swap did to the pair.

Each dropdown also offers **nobody**, which takes that place off and
sends the family out with one guide: two down to one, decided there
rather than left to the Can Solo rule. The option names whoever would
be left, and says so where that student is not marked Can Solo. It
re-labels itself as the other dropdowns change, so after swapping one
guide it names the new one rather than the one who has gone. The only
thing refused is emptying a pair altogether.

The **Lobby Greeter** and **Table Greeter** crews work the same way: a
dropdown per place, offering everyone free who is allowed that job, and
**nobody** to leave the place empty and let the crew run one short.

"Change Who Is Working..." carries the same **nobody** option for a
guide on a tour that is already saved. It deletes that Tour Tracker row
and writes the remaining guide back onto Prospective Students. It will
not take the last guide off a family, and it is guides only: a greeter
is cleared on the sheet.

A pair already on the tracker from an earlier run gets dropdowns too,
with "keep what is already assigned" still ticked. Saving then takes the
row it replaces off the Tour Tracker before writing the new one, so the
old name never sits there beside it. Only the pairs and crews actually
changed are touched; the rest of the tour is left exactly as it was.

A Yes/No column reads Yes, yes, Y, TRUE or a ticked box as yes.
Anything else, blank included, is a no.

## Changing who is working

"Change Who Is Working..." opens the whole roster for a date: every job,
who has it, who they are working with, and a list of everybody free to
take it over. Free means active, allowed that job on Eligibility, not
already working that tour, and not kept apart from anyone on the same
pair. Each name is shown with grade, gender, race, strength and how many
jobs they have done, least busy first.

Pick a name, press Swap, and it is written to the Tour Tracker there and
then. Every email, route sheet and locker slip is built from the tracker
at the moment it goes out, so they all follow the change without
anything else being re-run.

After a guide swap it says what the new pair looks like: a gender or
race rule no longer met, a Low on a priority family, a guide from the
wrong year. It swaps anyway. The decision is hers; the note is so she
sees what she has done.

### Reference sheets
Bell Schedule 5, Bell Schedule 6, Bell Schedule 7, Bell Schedule 8,
Teachers, Tour Routes, Settings.

Jobs also carries `Out of Class From` and `Out of Class To` - how long
each job really keeps somebody away, which is not the length of the
period they are missing. A greeter is back before the bell.

    Panelist        8:25 AM - 9:05 AM
    Lobby Greeter   8:25 AM - 8:55 AM
    Table Greeter   8:25 AM - 8:55 AM
    Tour Guide      8:25 AM - 9:05 AM
    Class Buddy     9:05 AM - 9:25 AM

## Class visits at the end

At 9:06 every family is walked into a class. Most weeks that is one of
their own guides' classes; where she has handed them off it is somebody
else's.

The script counts how many families land in each teacher's room and
reports it, and **it never moves anybody to even them out**. A class
over `Max Visitors Per Class` on Settings (3) is flagged in the
staffing dialog, on that family's own row and in a summary of every
class taking visitors. Fixing it is hers.

Every family gets a hand-off dropdown listing everybody else who could
take them, each with the room they would be in and how many are there
already, ordered emptiest first and with the people working the tour
before the rest. Whatever she picks is written to **Class Visit To** on
Prospective Students, and **Pass Off** on the same sheet says Yes where
the family is handed to somebody who was not guiding them.

Class Visit To is also the override: type any ambassador's name in it
and they take the family, whatever the script worked out. **Pass Off**
is what makes it an instruction rather than a record, since the script
fills Class Visit To in on every family. A name that still belongs to
one of the visitor's own guides is honoured either way; anything else
needs Pass Off set to Yes. That is what stops a name left over from a
guide she has since swapped out on the tracker quietly putting them back
in charge.

The Tour Tracker carries a **Class Visit** column, next to Route, saying
on each row where that row's family goes at the end:

    Tour Guide     Takes them to Math in M311 (Chantilly)
    Tour Guide     PASS OFF to Jane Moss - Science in M307
    Tour Guide     Goes back to class - Jane Moss takes them to Math in M311
    Tour Guide     Hands over to Alexander Rogoff - Spanish in M209
    Pass Off       Given Robin Visitor in Science in M307
    Class Buddy    Spanish with Mary Katherine in M209

A greeter's row is left blank, because they take nobody anywhere.

It is rewritten whenever anything changes it: saving the staffing
dialog, a swap or a hand-off on "Change Who Is Working...", or saving a
job by hand. It is read entirely off the sheets rather than off a plan,
so it is right whichever of those did the changing, and a row that no
longer takes anybody anywhere is cleared rather than left saying
yesterday's answer.

**Typing a name into Class Visit To works on its own.** The script
always writes the long form, "Jane Moss - Math in M311 (Chantilly)", so
a bare name is hers and is followed at once, with no need to set Pass
Off. The long form is only followed where Pass Off says it is meant, or
where it still names one of the visitor's own guides, which is what
stops a name left over from a swapped-out guide putting them back in
charge.

Whoever is handed a family gets a **Pass Off** row on the Tour Tracker,
so they are on the roster, in the counts and there to tick off
afterwards. Handing the family on again moves the row; saving twice
does not duplicate it.

They also get their own **email and locker slip**, whether or not they
had a job that morning. Someone with no other job is told to stay in
class until 9:06 rather than to report to the cafeteria at 8:25.

The hand-off list puts the people working the tour first, since they are
out of class anyway and know how the morning runs, and within that the
emptiest room first.

Three things follow from it:

- **The route sheet.** The guide's page ends, in large type, with
  "Robin Visitor is going to Science in M307 with Jane Moss." and "Give
  them the tour route, the clock, and YOUR NAME TAG. Then go back to
  your own class. You are finished." Underneath, a block headed FOR
  JANE MOSS tells the receiving student to take them to class and bring
  them down to the cafeteria at 9:25.
- **The teacher whose room it is** gets their own email, naming the
  visiting student, who is bringing them up and who they will be
  sitting with.
- **The test** shows that email too, on both days.

Where the two guides go to different rooms, only one of them walks the
family to class, and that is the one in an academic class: Humanities,
Maths, Science, English, History or a world language. Anything else,
Art, Music, PE, Band, counts as the other kind. Where both or neither
are academic it stays with the first guide, and where they share a class
they both go.

On a route sheet the handback line names the class the guide is walking
into, read off their own schedule: "Take Robin Visitor with you to Math
in M311." The subject is the words before the first split letter, set of
initials or room, and the room comes from the block itself, so `Hum Bs
ES+SdB M107 M108` prints as "Humanities in M107 or M108". Where the
block cannot be pinned to one class, or the student has no Split, it
falls back to "to class".

A class teacher whose student is guiding is told, in bold, who is about
to arrive with them: **Please expect a visitor in your class as well:
Robin Visitor.**

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

### The schedule sheets

One sheet per grade: **Bell Schedule 5** through **Bell Schedule 8**,
columns `Day | Grade | Homeroom | Split | Start | End | What / Teacher /
Room`. Grade holds the number (`6`), Split the letter (`B`).

A row is one split group at one block, and nothing is left blank. So
filtering Homeroom to AOS and Split to B gives 6B-in-AOS's whole week,
in order, about fifty rows, with nothing to work out. Two consequences:

- A block taught in split groups belongs to the whole grade, so it is
  repeated under each homeroom in that grade. 6A in AOS does the same
  `Math A` as 6A in DJM, even though the school prints it under DJM.
- A block the whole homeroom attends together is written out once per
  group, so correcting one means correcting it under each letter.

Total rows are higher than the single sheet was (104 / 441 / 200 / 200
against 403), because of that repetition. The point is that no one sheet
holds another grade, and any one student's week is a filter away.

First-Time Setup builds a grade's sheet only when it is not there or is
empty, so nothing she has typed is ever overwritten. Where the old single
`Bell Schedule` sheet still exists, its rows are the source it builds
from, so corrections made there carry across. After that nothing reads
the old sheet, and the staffing dialog says so until she deletes it.

A student with no Split on file cannot be placed in a group, so every
version of the block comes back marked as needing her rather than one of
them being guessed at.

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

## Finding a time to see somebody

"Find a Time to See Somebody..." has nothing to do with tours. Pick a
day and a start and finish time, tick whoever she wants to see (tick
nobody and it shows everyone), and it reads the schedule the same way
the tour emails do: split groups followed properly, not the homeroom
assumed.

It reports, per student, what they would be walking out of, the time of
that block and who teaches it. Lunch, recess and homeroom are included
and marked, since those are the answer to "when can I catch them"
rather than something to pull them out of. A block the schedule does
not pin to one class says so, and a student with no Homeroom or Split
is named rather than guessed at.

Nothing is written and nothing is emailed. A button turns the same
answer into a Google Doc for printing or forwarding.

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

### Two commands, not one

**Test Emails...** and **Send Emails Now...** are separate menu items.

Nothing in Test Emails can reach a student or a teacher: every message
goes to her, whichever button she presses. It holds the whole postbag
for a day and the one-of-each-job samples.

Send Emails Now is the real thing and only the real thing. There is no
tick box to forget. It will not send anything until she has pressed
**Show me who would get these** and read the actual list, by name and
address, of every message that is about to go. The send buttons are
disabled until she ticks that she means it, and they say how many are
going: "Send the 11 student email(s)".

That list is produced by running the real send with nothing allowed out
(`DRY_RUN_` on the one function every message passes through), so the
preview cannot drift from what actually happens.

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

**Every Tuesday email** and **Every Wednesday email** are two buttons
of their own. Each sends the whole postbag for that day to her and
nowhere else: students and teachers together, one email per person, no
sampling. It is always a test whatever the tick boxes above it say. The
result is one summary, broken down by who would have heard:

    13 to ambassadors
    1 to advisors
    1 to the teachers whose class they walk out of
    1 to the teachers whose class they walk into

Asked for a weekday nothing goes out on, it says so by name rather than
sending nothing quietly.

**Every one of them** is a second tick box beside Test. Still a test,
still only to her, but one email per person rather than one per job, for
reading what one particular student or teacher gets. On a four-family
tour that is 27 student emails against 9.

A test sends **one example of every job**, not one per person, and it
does so for each kind of reader: the student, their advisor and their
class teacher, plus one host teacher. That is repeated for both days,
so the Tuesday and the Wednesday wording of each can be read side by
side. An email goes out only where it carries a job not shown yet, so a
Lobby Greeter's teacher hears once and a Tour Guide's teacher hears
once, rather than every teacher in the school hearing.

Who would have been skipped for want of an address is still worked out
for everybody and still reported, so the test says what a real send
would do without filling her inbox with the same message thirty times.

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
