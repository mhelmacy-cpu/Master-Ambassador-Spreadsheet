# The tests

    sh tests/run.sh

Node only. No browser, no Google account, no internet: `mock.js` stands in
for the Apps Script services (SpreadsheetApp, DocumentApp, MailApp,
HtmlService, Session, ScriptApp) and records what the script did on a few
globals, which the tests then read:

| global | what it holds |
| --- | --- |
| `__sent` | every email, as it was passed to `MailApp.sendEmail` |
| `__doc` | a Google Doc's paragraphs in order, with heading, bold, size, and whether each is in a table cell |
| `__docTables` | each table on the page, with any column widths and row heights |
| `__dialogs` | each dialog, with the HTML it was given |
| `__reads` | how many times a sheet was read, for the cost guard |
| `__triggers` | the time-based triggers the script created |

Each test loads the two build files with `eval`, having rewritten their
top-level `const`/`var`/`function` into globals, so the script under test
is the exact text that gets pasted into the Apps Script editor. The files
are numbered in the order they were written; the comment at the top of
each says what it watches and, usually, which bug it came from.

**These lived in /tmp until a container restart wiped them.** They are in
the repository now, which is the only place they survive. Anything added
to the suite belongs here, committed with the change it covers.
