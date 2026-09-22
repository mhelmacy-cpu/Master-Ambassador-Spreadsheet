/**
 * Keeps "Total Tours" and "Last Tour Date" on the Ambassadors sheet
 * current, so staff can see workload at a glance and the staffing
 * suggestion algorithm can spread duty fairly. Cancelled assignments
 * don't count; everything else (Scheduled, Completed, No-Show) does,
 * since it reflects time the ambassador was actually committed.
 */

function refreshAmbassadorStats() {
  const sheet = getOrCreateSheet(SHEETS.AMBASSADORS);
  const headers = HEADERS[SHEETS.AMBASSADORS];
  const firstCol = colNum_(headers, 'First Name') - 1;
  const lastCol = colNum_(headers, 'Last Name') - 1;
  const totalCol = colNum_(headers, 'Total Tours');
  const lastDateCol = colNum_(headers, 'Last Tour Date');
  const { rows } = readSheet(SHEETS.AMBASSADORS);
  if (rows.length === 0) return;

  const stats = getAmbassadorAssignmentStats_();

  const totalValues = [];
  const dateValues = [];
  rows.forEach(r => {
    const name = fullName_(r[firstCol], r[lastCol]);
    const s = stats[normalizeName_(name)];
    totalValues.push([s ? s.count : 0]);
    dateValues.push([s && s.lastDate ? formatDate_(s.lastDate) : '']);
  });

  sheet.getRange(2, totalCol, rows.length, 1).setValues(totalValues);
  sheet.getRange(2, lastDateCol, rows.length, 1).setValues(dateValues);
}

/** Map of normalized ambassador name -> {count, lastDate}, from non-cancelled Assignments rows. */
function getAmbassadorAssignmentStats_() {
  const headers = HEADERS[SHEETS.ASSIGNMENTS];
  const ambassadorCol = colNum_(headers, 'Ambassador') - 1;
  const dateCol = colNum_(headers, 'Date') - 1;
  const statusCol = colNum_(headers, 'Status') - 1;
  const { rows } = readSheet(SHEETS.ASSIGNMENTS);

  const stats = {};
  rows.forEach(r => {
    if (!r[ambassadorCol]) return;
    if (String(r[statusCol]).trim() === 'Cancelled') return;
    const key = normalizeName_(r[ambassadorCol]);
    const d = toDate_(r[dateCol]);
    if (!stats[key]) stats[key] = { count: 0, lastDate: null };
    stats[key].count++;
    if (d && (!stats[key].lastDate || d > stats[key].lastDate)) stats[key].lastDate = d;
  });
  return stats;
}
