# Setup

This is a Google Apps Script project. It needs to be attached to an actual
Google Sheet before it does anything — pick one of the two options below.

**Paste [`dist/`](dist/), not [`src/`](src/).** `src/` is the modular
source, split up so it's easy to work on. `dist/` is the same code merged
into 4 script files instead of 21, which is what you actually paste — Apps
Script puts every `.gs` file in one shared namespace, so merging them
changes nothing about how the code runs. Regenerate `dist/` after editing
`src/` with:

```bash
python3 tools/bundle.py
```

## Option A — Copy/paste into the Apps Script editor (no tools needed)

1. Create a new Google Sheet (sheets.new).
2. **Extensions → Apps Script**. Delete the default empty `Code.gs`.
3. Create the 4 script files — click **+ → Script file**, name it, paste
   the contents (leave the `.gs` off the name; the editor adds it):
   `Core`, `SeedData`, `Logic`, `Menu`.
4. Create the 8 dialogs — click **+ → HTML file** and name each one with
   the `ui/` prefix included, e.g. `ui/AddTourDialog`. Apps Script allows a
   `/` in a file name, and the code loads them by that exact name
   (`HtmlService.createHtmlOutputFromFile('ui/AddTourDialog')`).
5. Open **Project Settings** (gear icon), tick **Show "appsscript.json"
   manifest file in editor**, then paste in `dist/appsscript.json`.
6. Save, reload the Google Sheet. You'll be asked to authorize the script
   the first time you use the menu — approve it (it only touches this
   spreadsheet and sends email on your behalf for the digests).
7. Use the **Tour & Ambassador Scheduler** menu → **First-Time Setup**.

## Option B — Push with `clasp` (recommended if you'll keep editing code here)

1. Install clasp once: `npm install -g @google/clasp`
2. `clasp login` (opens a browser to authorize your Google account).
3. From the repo root:
   ```bash
   clasp create --type sheet --title "Master Ambassador Scheduler" --rootDir ./dist
   ```
   This creates a brand-new Google Sheet + bound script and writes a
   `.clasp.json` with the new `scriptId` (that file is gitignored since the
   ID is per-user — see `.clasp.json.example` for the shape).
4. `clasp push` to upload everything in `dist/`.
5. `clasp open` to open the Apps Script editor, or open the Sheet directly
   from your Google Drive.
6. Reload the Sheet, approve the authorization prompt, then use the
   **Tour & Ambassador Scheduler** menu → **First-Time Setup**.

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
