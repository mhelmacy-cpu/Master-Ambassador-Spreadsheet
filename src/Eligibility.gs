/**
 * Ambassador x Job eligibility matrix.
 * Row = ambassador full name, Column = job name, cell = checkbox.
 * rebuildEligibilityMatrix() keeps existing checked values while
 * adding rows/columns for new ambassadors/jobs.
 */

function rebuildEligibilityMatrix() {
  const sheet = getOrCreateSheet(SHEETS.ELIGIBILITY);
  const { rows: ambassadorRows } = readSheet(SHEETS.AMBASSADORS);
  const { rows: jobRows } = readSheet(SHEETS.JOBS);
  const ambassadorHeaders = HEADERS[SHEETS.AMBASSADORS];
  const jobHeaders = HEADERS[SHEETS.JOBS];
  const firstCol = colNum_(ambassadorHeaders, 'First Name') - 1;
  const lastCol = colNum_(ambassadorHeaders, 'Last Name') - 1;
  const jobNameCol = colNum_(jobHeaders, 'Job Name') - 1;

  const ambassadorNames = ambassadorRows
    .map(r => fullName_(r[firstCol], r[lastCol]))
    .filter(n => n.trim() !== '');
  const jobNames = jobRows
    .map(r => String(r[jobNameCol] || '').trim())
    .filter(n => n !== '');

  // Preserve existing checked state before rewriting.
  const existing = readExistingEligibility_(sheet);

  const numRows = ambassadorNames.length;
  const numCols = jobNames.length;
  sheet.clear();

  const headerRow = ['Ambassador'].concat(jobNames);
  sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow])
    .setFontWeight('bold').setBackground('#4a86e8').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);

  if (numRows === 0 || numCols === 0) {
    if (numRows > 0) {
      sheet.getRange(2, 1, numRows, 1).setValues(ambassadorNames.map(n => [n]));
    }
    toast_('Eligibility matrix rebuilt. Add at least one job and one ambassador to enable checkboxes.');
    return;
  }

  const nameCol = ambassadorNames.map(n => [n]);
  sheet.getRange(2, 1, numRows, 1).setValues(nameCol);

  const grid = ambassadorNames.map(name => jobNames.map(job => {
    const key = normalizeName_(name) + '|' + normalizeName_(job);
    return existing[key] === true;
  }));
  const dataRange = sheet.getRange(2, 2, numRows, numCols);
  dataRange.setValues(grid);
  dataRange.insertCheckboxes();

  sheet.autoResizeColumns(1, numCols + 1);
  toast_('Eligibility matrix rebuilt (' + numRows + ' ambassadors x ' + numCols + ' jobs).');
}

function readExistingEligibility_(sheet) {
  const map = {};
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 2) return map;
  const jobNames = sheet.getRange(1, 2, 1, lastCol - 1).getValues()[0];
  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  data.forEach(row => {
    const ambassadorName = row[0];
    jobNames.forEach((job, i) => {
      const key = normalizeName_(ambassadorName) + '|' + normalizeName_(job);
      map[key] = row[i + 1] === true;
    });
  });
  return map;
}

/** Returns true if the given ambassador (full name) is eligible for the given job. */
function isEligible_(ambassadorName, jobName) {
  const sheet = getOrCreateSheet(SHEETS.ELIGIBILITY);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 2) return false;
  const jobNames = sheet.getRange(1, 2, 1, lastCol - 1).getValues()[0];
  const jobIdx = jobNames.findIndex(j => normalizeName_(j) === normalizeName_(jobName));
  if (jobIdx === -1) return false;
  const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const rowIdx = names.findIndex(r => normalizeName_(r[0]) === normalizeName_(ambassadorName));
  if (rowIdx === -1) return false;
  return sheet.getRange(2 + rowIdx, 2 + jobIdx).getValue() === true;
}

/** Returns list of ambassador full names eligible AND active for a given job. */
function getEligibleActiveAmbassadors(jobName) {
  const { rows } = readSheet(SHEETS.AMBASSADORS);
  const headers = HEADERS[SHEETS.AMBASSADORS];
  const firstCol = colNum_(headers, 'First Name') - 1;
  const lastCol = colNum_(headers, 'Last Name') - 1;
  const activeCol = colNum_(headers, 'Active') - 1;

  return rows
    .filter(r => String(r[activeCol]).trim().toLowerCase() === 'yes')
    .map(r => fullName_(r[firstCol], r[lastCol]))
    .filter(name => name.trim() !== '' && isEligible_(name, jobName));
}
