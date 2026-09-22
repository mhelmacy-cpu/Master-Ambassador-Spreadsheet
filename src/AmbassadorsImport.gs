/**
 * Paste-to-import for the Ambassadors roster, so staff can update the
 * list themselves (e.g. a new master roster export) without editing code.
 *
 * Upserts by (Name, Borough) - not name alone - since the same student
 * can legitimately appear twice under different boroughs (see Blake
 * Glenn). Re-pasting the same list is safe: matching rows are updated
 * in place (grade + parent info only; Teacher/Student Email/Active/Notes
 * are left alone so hand-curated data isn't clobbered), new rows are
 * appended.
 */

function parseAmbassadorImportText_(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
  const rows = [];
  lines.forEach(line => {
    let cells = line.split('\t');
    if (cells.length < 2) cells = line.split(',');
    cells = cells.map(c => c.trim());
    const fullName = cells[0] || '';
    if (!fullName || normalizeName_(fullName) === 'name') return; // blank or header row
    rows.push({
      fullName: fullName,
      grade: cells[1] || '',
      borough: (cells[2] || '').toUpperCase(),
      p1Name: cells[3] || '',
      p1Email: cells[4] || '',
      p2Name: cells[5] || '',
      p2Email: cells[6] || ''
    });
  });
  return rows;
}

function importAmbassadors(text) {
  const parsed = parseAmbassadorImportText_(text);
  if (parsed.length === 0) {
    throw new Error('No rows found. Paste one ambassador per line: Name, Grade, Borough, ' +
      'Parent 1 Name, Parent 1 Email, Parent 2 Name, Parent 2 Email (tab- or comma-separated).');
  }

  const sheet = getOrCreateSheet(SHEETS.AMBASSADORS);
  const headers = HEADERS[SHEETS.AMBASSADORS];
  const { rows: existingRows } = readSheet(SHEETS.AMBASSADORS);
  const firstCol = colNum_(headers, 'First Name') - 1;
  const lastCol = colNum_(headers, 'Last Name') - 1;
  const boroughCol = colNum_(headers, 'Borough') - 1;
  const gradeCol = colNum_(headers, 'Grade') - 1;
  const p1NameCol = colNum_(headers, 'Parent 1 Name') - 1;
  const p1EmailCol = colNum_(headers, 'Parent 1 Email') - 1;
  const p2NameCol = colNum_(headers, 'Parent 2 Name') - 1;
  const p2EmailCol = colNum_(headers, 'Parent 2 Email') - 1;

  const keyOf = (name, borough) => normalizeName_(name) + '|' + normalizeName_(borough);
  const rowIndexByKey = {};
  existingRows.forEach((r, i) => {
    rowIndexByKey[keyOf(fullName_(r[firstCol], r[lastCol]), r[boroughCol])] = i;
  });

  let added = 0, updated = 0;
  const newRows = [];

  parsed.forEach(item => {
    const key = keyOf(item.fullName, item.borough);
    const idx = rowIndexByKey[key];
    if (idx !== undefined) {
      const sheetRow = idx + 2;
      if (item.grade) sheet.getRange(sheetRow, gradeCol + 1).setValue(item.grade);
      sheet.getRange(sheetRow, p1NameCol + 1).setValue(item.p1Name);
      sheet.getRange(sheetRow, p1EmailCol + 1).setValue(item.p1Email);
      sheet.getRange(sheetRow, p2NameCol + 1).setValue(item.p2Name);
      sheet.getRange(sheetRow, p2EmailCol + 1).setValue(item.p2Email);
      updated++;
    } else {
      const { first, last } = splitFullName_(item.fullName);
      newRows.push(headers.map(h => {
        switch (h) {
          case 'First Name': return first;
          case 'Last Name': return last;
          case 'Grade': return item.grade;
          case 'Borough': return item.borough;
          case 'Parent 1 Name': return item.p1Name;
          case 'Parent 1 Email': return item.p1Email;
          case 'Parent 2 Name': return item.p2Name;
          case 'Parent 2 Email': return item.p2Email;
          case 'Active': return 'Yes';
          default: return '';
        }
      }));
      added++;
    }
  });

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, headers.length).setValues(newRows);
  }

  const lastRow = sheet.getLastRow();
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Active'), YES_NO);
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Borough'), BOROUGH_CODES);
  applyTeacherDropdown_(sheet, lastRow, colNum_(headers, 'Teacher'));
  sheet.autoResizeColumns(1, headers.length);

  rebuildEligibilityMatrix();

  return { added: added, updated: updated, total: parsed.length };
}
