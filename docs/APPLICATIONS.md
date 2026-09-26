# Paste from Ravenna

A command for the **applications spreadsheet**, so application information
copied out of Ravenna lands in the right columns without being retyped or
refigured.

This is separate from the Wednesday tour scheduler. It is one file,
`build/Applications.gs`, pasted into the applications spreadsheet's own
Apps Script project. Nothing in it touches the tour spreadsheet, and
nothing in the tour spreadsheet touches it.

## Getting it in

1. Open the applications spreadsheet.
2. **Extensions > Apps Script**.
3. Delete whatever is in `Code.gs` and paste in all of
   `build/Applications.gs`.
4. Save, then reload the spreadsheet.
5. An **Admissions** menu appears next to Help. The first run asks for
   permission to work on the file, which is Google asking once per
   script.

## Using it

**Admissions > Paste from Ravenna...**

1. Copy the applicants out of Ravenna.
2. Get it into the box, whichever way works:
   - **Paste from the clipboard**, the button. Where the browser allows
     it, this is the whole thing in one click.
   - **Cmd+V** (Ctrl+V on Windows) anywhere in the dialog. It does not
     matter whether the cursor is in the box.
3. The rows appear on their own, sorted into your columns, with the names
   worked out. There is nothing else to press first.
4. Read them over.
5. **Add N to <tab>** writes them.

A Google Sheets dialog is a frame inside the page, and a browser will
often not let a button inside one read the clipboard. When that happens
the button says so, puts the cursor in the box, and asks for Cmd+V. That
is a browser rule, not a fault.

If Cmd+V used to do nothing, this is why: the keystroke goes wherever the
cursor is, and if it was not in the dialog it went to the spreadsheet
behind it. The dialog now catches the paste wherever the cursor is.

Nothing reaches the sheet until that last button.

There is no column-by-column setting up to do. The top line says how many
columns it sorted for you, and **Check the columns** opens the detail if
you want to see it, or to move one. It opens itself when there is
something it wants you to look at.

## When nothing seems to happen

The dialog now says what it is doing, so a failure is never invisible.

Under the paste box there is a line reading, for instance,
`1,240 characters, 5 lines.` That single line answers the question:

- **"Nothing in the box yet."** The paste never arrived. The keystroke
  went somewhere else, or the clipboard is empty.
- **A character count, then nothing below.** The paste arrived but the
  rows could not be drawn. The reason is printed in an orange box, and
  that message is what to pass on.
- **A character count and rows.** It worked.

**Sort the rows** beside that line does by hand what pasting does on its
own, for when the automatic read does not fire.

The version is printed at the right of the same line. Quoting it says
exactly which script is running, which saves guessing after an update.

## The columns

It works them out for itself, three ways, in this order:

1. **Ravenna's heading.** `Entry Grade`, `Current School`,
   `Core Application Submitted` and the rest of the usual wording.
2. **Your own corrections**, remembered from last time.
3. **The values themselves**, for anything the first two could not place.
   This is what lets a paste with no heading row at all still sort
   itself. What it reads:

        Male, Female, M, F                   Gender
        1-5, 1st-5th, K-5, PK-4, 1 to 5      Grades Attended
        6, 6th, Grade 6, K                   App. Grade
        Middle School, 5,6                   App. Grade
        2026-09-14 14:32:00, 9/16/2026       Core Submitted
        Rivera, Samuel (Sam)                 Name
        Samuel (Sam) Rivera                  Name
        PS 321, St Anns Academy              School

   A **range** is always what they have already done, so it is Grades
   Attended. A **single grade**, or a division with its years after it,
   is what they are applying to, so it is App. Grade. That is the one
   distinction the two grade columns turn on.

A column placed from its values is labelled *read from the values, worth
a look*, and the column panel opens itself so you see it.

The sheet's own row 1 is what it matches against, so a heading that is
worded differently, or a column that has been moved or added, changes
nothing about where values land. `App. Grade` and `App Grade` are the
same column to it, and so are `Notes:` and `Notes`.

Six columns are filled in by hand after an applicant is on the sheet:

    PI Date:    AT Date:    AT with:    AT uploaded    AT Notes    PI Notes

**Nothing pasted can ever be written to those.** They are not offered in
the dropdowns at all, and a paste that adds new rows leaves every
existing row alone, so work already done on a row cannot be overwritten
by a later paste.

## Names

The one thing that always needed redoing by hand. The sheet wants three
cells, `Name`, `First Name` and `Last Name`, and Ravenna may give any of:

    Rivera, Sam            -> Sam Rivera   / Sam / Rivera
    Sam Rivera             -> Sam Rivera   / Sam / Rivera
    a first and last column -> joined into Name

Whatever the paste carries is kept as it came; only the missing cells are
worked out from it. So a report that already has proper first and last
columns is never second-guessed.

### The name they go by

A name in brackets is the name the child actually answers to, so it is
the one that goes in **First Name**:

    Rivera, Samuel (Sam)     Name        Samuel (Sam) Rivera
                             First Name  Sam
                             Last Name   Rivera

It reads `Samuel "Sam"` the same way, and picks it up from a First Name
column as readily as from a whole name.

The brackets stay in the **Name** column, so the name on the application
is still on the sheet, while First Name and Last Name hold the name and
nothing else. Every one it used is listed above the rows, as *Went by the
name in brackets: Sam, not Samuel*, so you can see it at a glance.

Not everything in brackets is a name. `(sibling)`, `(2026)`, and anything
longer than two words are left alone, and First Name stays as it was.

### Two smaller things it handles

- **Capitals.** A report that comes out as `RIVERA` is put back to
  `Rivera`. A name already in mixed case is somebody's own spelling of
  their own name, so `McDonald`, `DeShawn` and `van der Berg` are never
  touched.
- **Surnames in several words.** `van der Berg` and `de la Cruz` go into
  Last Name whole, and `Jr.` stays on the end rather than becoming a
  surname.

## Dates

Ravenna gives the submission as a timestamp, `2026-09-14 14:32:00`. The
time is dropped and the day is written as a real date, formatted
`9/14/2026`, so the column sorts as dates rather than as text.

Anything it does not recognise as a date, `Rolling` for instance, is left
exactly as it came.

## How the rows look

A copy out of Ravenna is a copy out of a web page, and it arrives
carrying the web page with it: links come in blue and underlined, table
cells bring their own borders, headings bring their own size. Every row
this command writes is set, as it lands, to:

    Lato, size 12, black, no underline, no border

For rows pasted in by hand before this existed, which are still carrying
all of that: **Admissions > Tidy the formatting on this tab** applies the
same to everything below row 1 on the tab you are looking at. Row 1 is
left alone, since headings are meant to look different.

## What it will not do quietly

- A column it does not recognise is **named back to you** rather than
  dropped, so you can point it somewhere or confirm it is not wanted.
- An applicant already on the sheet is **shown greyed out and skipped**,
  with the reason, rather than added twice. Matching is on the whole
  name.
- A line with no name in it is **reported by line number**, not silently
  passed over.
- Two pasted columns aimed at the same sheet column is **flagged**.

## It learns your report

Correcting a column is a one-off. When you press Add, the corrections are
remembered against Ravenna's own heading, so next week the same report
maps itself and the dropdown says "remembered from last time".

**Admissions > Forget my column corrections** clears that, if Ravenna
changes what a heading means.

## If the tab is not there yet

**Admissions > Set up the Applications tab** creates one called
`Applications` with the sixteen columns in order. On a spreadsheet that
already has its own tab, you do not need this: the command reads whatever
headings are in row 1, and the tab picker at the top of the dialog is
where you choose which tab to add to.
