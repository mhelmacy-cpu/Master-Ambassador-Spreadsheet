# Working on this project

## Writing in Maren's voice

Maren (mhelmacy@lrei.org) drafts and edits admissions emails here.

- **No em dashes or en dashes in her emails, ever.** They are not her voice.
  Use a comma, a colon, parentheses or a full stop instead. A plain hyphen
  in a range (8:15-8:45) is fine.
- Warm but not effusive. One exclamation point in a paragraph, not three.

## The code

Two spreadsheets, two Apps Script projects, and they share nothing.

- **The Wednesday tour scheduler.** `build/Data.gs` and `build/App.gs`,
  pasted by hand into that spreadsheet's Apps Script editor.
  `docs/SPEC.md` is the agreed design.
- **The applications spreadsheet.** `build/Applications.gs` on its own,
  pasted into that spreadsheet's editor. `docs/APPLICATIONS.md` is how it
  works. It is standalone on purpose: it carries its own helpers rather
  than calling anything in `App.gs`, because the two never run in the
  same project.

Plain ASCII only in the source: anything else corrupts on paste.

## What a dialog can be handed

Whatever a script returns to a dialog is turned into plain data first.
A **Date does not survive it**, and when any part of the answer cannot be
converted the dialog receives `null` rather than a partial answer, then
throws on the first property it reads. Nothing in the logs, nothing on
screen.

So an `api_` function returns strings, numbers and arrays of them, and
nothing else. Dates stay on the script's side, where writing to the
sheet needs them, and the dialog is sent the printed form. This has cost
a day once already.
