# Setup

The code in [`src/`](src/) is a Google Apps Script project. It needs to be
attached to an actual Google Sheet before it does anything — pick one of
the two options below.

## Option A — Copy/paste into the Apps Script editor (no tools needed)

1. Create a new Google Sheet (sheets.new).
2. **Extensions → Apps Script**. Delete the default empty `Code.gs`.
3. For every file in `src/` (including the two files inside `src/ui/`):
   - Click **+ → Script file** (for `.gs` files) or **+ → HTML file** (for
     `.html` files under `ui/`), name it to match exactly (e.g. `Constants`,
     `Utils`, `ui/AssignAmbassadorDialog`), and paste in the contents.
   - Apps Script file names can include a `/` — create the HTML files as
     `ui/AssignAmbassadorDialog`, `ui/AddTourDialog`,
     `ui/AddTouringStudentDialog` so they line up with the code that loads
     them (`HtmlService.createHtmlOutputFromFile('ui/AddTourDialog')`).
4. Open **Project Settings** (gear icon) and paste the contents of
   `src/appsscript.json` into the manifest (enable "Show appsscript.json"
   first), or just set the timezone/scopes to match by hand.
5. Save, reload the Google Sheet. You'll be asked to authorize the script
   the first time you use the menu — approve it (it only touches this
   spreadsheet and sends email on your behalf for the weekly digest).
6. Use the **🎓 Tour & Ambassador Scheduler** menu → **First-Time Setup**.

## Option B — Push with `clasp` (recommended if you'll keep editing code here)

1. Install clasp once: `npm install -g @google/clasp`
2. `clasp login` (opens a browser to authorize your Google account).
3. From the repo root:
   ```bash
   clasp create --type sheet --title "Master Ambassador Scheduler" --rootDir ./src
   ```
   This creates a brand-new Google Sheet + bound script and writes a
   `.clasp.json` with the new `scriptId` (that file is gitignored since the
   ID is per-user — see `.clasp.json.example` for the shape).
4. `clasp push` to upload everything in `src/`.
5. `clasp open` to open the Apps Script editor, or open the Sheet directly
   from your Google Drive.
6. Reload the Sheet, approve the authorization prompt, then use the
   **🎓 Tour & Ambassador Scheduler** menu → **First-Time Setup**.

After the first push, `clasp push` again any time you change files here to
sync your changes to the live Sheet.

## After setup, either way

Run **First-Time Setup** from the menu (safe to re-run any time — it won't
wipe data you've already entered, it only creates what's missing and
refreshes dropdowns/checkboxes). Then:

1. Fill in the **Teachers** and **Jobs** sheets.
2. Fill in the **Ambassadors** sheet, then run **Rebuild Eligibility
   Matrix** and check off eligible jobs per ambassador.
3. Adjust the **Settings** sheet (school name, weekly email day/hour,
   lookahead window).
4. Turn on **Automation → Turn ON weekly teacher emails** when you're
   ready to go live with the digest.

## Permissions this script requests

- Read/write access to **this spreadsheet only** (not your whole Drive).
- Send email **on your behalf** (`script.send_mail`) — used only for the
  weekly teacher digest triggered by you or the schedule you set.
- Manage its own time-driven triggers (`script.scriptapp`) — used for the
  weekly email and optional dashboard auto-refresh.
