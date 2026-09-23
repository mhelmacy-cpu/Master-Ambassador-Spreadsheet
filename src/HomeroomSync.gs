/**
 * Matches Ambassadors sheet rows against HOMEROOM_DATA_ by exact
 * (normalized) full name, and fills in Grade / Homeroom Pod / Advisor
 * from the official roster. Re-runnable each year with an
 * updated HOMEROOM_DATA_.
 *
 * A student who isn't found and was last known to be in 8th grade is
 * assumed to have graduated out of Middle School and is marked Inactive
 * (with a note) rather than silently left stale - easy to reverse if
 * that's wrong. Anyone else unmatched is just flagged for a human to
 * check (likely a nickname/spelling mismatch).
 */

function syncAmbassadorHomerooms() {
  const sheet = getOrCreateSheet(SHEETS.AMBASSADORS);
  const headers = HEADERS[SHEETS.AMBASSADORS];
  const { rows } = readSheet(SHEETS.AMBASSADORS);
  const firstCol = colNum_(headers, 'First Name') - 1;
  const lastCol = colNum_(headers, 'Last Name') - 1;
  const gradeCol = colNum_(headers, 'Grade') - 1;
  const podCol = colNum_(headers, 'Homeroom Pod') - 1;
  const teacherCol = colNum_(headers, 'Advisor') - 1;
  const activeCol = colNum_(headers, 'Active') - 1;
  const notesCol = colNum_(headers, 'Notes') - 1;

  const lookup = buildHomeroomLookup_();
  let matched = 0;
  const unmatched = [];
  const flaggedGraduated = [];

  rows.forEach((r, i) => {
    const name = fullName_(r[firstCol], r[lastCol]);
    const hit = lookup[normalizeName_(name)];
    const sheetRow = i + 2;

    if (hit) {
      sheet.getRange(sheetRow, gradeCol + 1).setValue(hit.grade);
      sheet.getRange(sheetRow, podCol + 1).setValue(hit.pod);
      sheet.getRange(sheetRow, teacherCol + 1).setValue(hit.advisor);
      matched++;
      return;
    }

    const existingNotes = String(r[notesCol] || '');
    const wasEighthGrade = String(r[gradeCol] || '').trim().charAt(0) === '8';

    if (wasEighthGrade) {
      sheet.getRange(sheetRow, activeCol + 1).setValue('No');
      if (existingNotes.indexOf('Not in 2026-27 MS roster') === -1) {
        const note = 'Not in 2026-27 MS roster - likely graduated to high school; marked Inactive, verify.';
        sheet.getRange(sheetRow, notesCol + 1).setValue((existingNotes ? existingNotes + ' | ' : '') + note);
      }
      flaggedGraduated.push(name);
    } else {
      if (existingNotes.indexOf('not found in 2026-27 MS roster') === -1) {
        const note = 'Name not found in 2026-27 MS roster - check spelling/nickname or confirm still enrolled.';
        sheet.getRange(sheetRow, notesCol + 1).setValue((existingNotes ? existingNotes + ' | ' : '') + note);
      }
      unmatched.push(name);
    }
  });

  return { matched: matched, unmatched: unmatched, flaggedGraduated: flaggedGraduated };
}

function syncAmbassadorHomeroomsFromMenu_() {
  const result = syncAmbassadorHomerooms();
  let msg = 'Matched ' + result.matched + ' ambassador(s) to the 2026-27 homeroom roster ' +
    '(Grade, Homeroom Pod, and Teacher updated).';
  if (result.flaggedGraduated.length > 0) {
    msg += '\n\nMarked Inactive (not in this year\'s MS roster - likely graduated): ' +
      result.flaggedGraduated.join(', ');
  }
  if (result.unmatched.length > 0) {
    msg += '\n\nCould not find a match (check spelling/nickname): ' + result.unmatched.join(', ');
  }
  SpreadsheetApp.getUi().alert(msg);
}
