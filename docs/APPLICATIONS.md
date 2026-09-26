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

1. Copy the applicants out of Ravenna, headings and all.
2. Paste into the box and press **Read it**.
3. It shows two things: what it made of every column you pasted, and the
   rows exactly as they would be written.
4. Anything it read wrongly, correct with the dropdown beside that
   column. The preview redraws as you do.
5. **Add N to <tab>** writes them.

Nothing reaches the sheet until that last button.

## The columns

The sheet's own row 1 is what the command reads, so a heading that is
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

Two smaller things it handles:

- **Capitals.** A report that comes out as `RIVERA` is put back to
  `Rivera`. A name already in mixed case is somebody's own spelling of
  their own name, so `McDonald`, `DeShawn` and `van der Berg` are never
  touched.
- **Surnames in several words.** `van der Berg` and `de la Cruz` go into
  Last Name whole, and `Jr.` stays on the end rather than becoming a
  surname.

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
