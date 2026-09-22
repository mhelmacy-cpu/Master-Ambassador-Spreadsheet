/**
 * Running tallies, refreshed whenever assignments change.
 *
 * On Ambassadors: Total Tours, Last Tour Date, and a per-job breakdown,
 * so staff can see both how much duty a kid has done and what kind.
 * On Tours: how many jobs are filled and which roles they are, so an
 * under-staffed tour is obvious without opening the Assignments sheet.
 *
 * Cancelled assignments never count. Everything else (Scheduled,
 * Completed, No-Show) does, since it reflects time the ambassador was
 * actually committed.
 */

function refreshAmbassadorStats() {
  const sheet = getOrCreateSheet(SHEETS.AMBASSADORS);
  const headers = HEADERS[SHEETS.AMBASSADORS];
  const firstCol = colNum_(headers, 'First Name') - 1;
  const lastCol = colNum_(headers, 'Last Name') - 1;
  const totalCol = colNum_(headers, 'Total Tours');
  const lastDateCol = colNum_(headers, 'Last Tour Date');
  const breakdownCol = colNum_(headers, 'Jobs Breakdown');
  const { rows } = readSheet(SHEETS.AMBASSADORS);
  if (rows.length === 0) return;

  const stats = getAmbassadorAssignmentStats_();

  const totalValues = [];
  const dateValues = [];
  const breakdownValues = [];
  rows.forEach(r => {
    const name = fullName_(r[firstCol], r[lastCol]);
    const s = stats[normalizeName_(name)];
    totalValues.push([s ? s.count : 0]);
    dateValues.push([s && s.lastDate ? formatDate_(s.lastDate) : '']);
    breakdownValues.push([s ? formatJobCounts_(s.byJob) : '']);
  });

  sheet.getRange(2, totalCol, rows.length, 1).setValues(totalValues);
  sheet.getRange(2, lastDateCol, rows.length, 1).setValues(dateValues);
  sheet.getRange(2, breakdownCol, rows.length, 1).setValues(breakdownValues);
}

/** {Panelist: 2, Tour Guide: 5} -> "Panelist x2, Tour Guide x5" (busiest first). */
function formatJobCounts_(byJob) {
  const jobs = Object.keys(byJob || {});
  if (jobs.length === 0) return '';
  jobs.sort((a, b) => byJob[b] - byJob[a] || (a < b ? -1 : 1));
  return jobs.map(j => j + ' x' + byJob[j]).join(', ');
}

/** Map of normalized ambassador name -> {count, lastDate, byJob}, from non-cancelled Assignments. */
function getAmbassadorAssignmentStats_() {
  const headers = HEADERS[SHEETS.ASSIGNMENTS];
  const ambassadorCol = colNum_(headers, 'Ambassador') - 1;
  const dateCol = colNum_(headers, 'Date') - 1;
  const jobCol = colNum_(headers, 'Job') - 1;
  const statusCol = colNum_(headers, 'Status') - 1;
  const { rows } = readSheet(SHEETS.ASSIGNMENTS);

  const stats = {};
  rows.forEach(r => {
    if (!r[ambassadorCol]) return;
    if (String(r[statusCol]).trim() === 'Cancelled') return;
    const key = normalizeName_(r[ambassadorCol]);
    const d = toDate_(r[dateCol]);
    if (!stats[key]) stats[key] = { count: 0, lastDate: null, byJob: {} };
    stats[key].count++;
    const job = String(r[jobCol] || '').trim();
    if (job) stats[key].byJob[job] = (stats[key].byJob[job] || 0) + 1;
    if (d && (!stats[key].lastDate || d > stats[key].lastDate)) stats[key].lastDate = d;
  });
  return stats;
}

/** Per-tour tallies: how many jobs are filled, and which roles. */
function refreshTourTallies() {
  const sheet = getOrCreateSheet(SHEETS.TOURS);
  const headers = HEADERS[SHEETS.TOURS];
  const idCol = colNum_(headers, 'Tour ID') - 1;
  const filledCol = colNum_(headers, 'Jobs Filled');
  const rolesCol = colNum_(headers, 'Roles Filled');
  const { rows } = readSheet(SHEETS.TOURS);
  if (rows.length === 0) return;

  const aHeaders = HEADERS[SHEETS.ASSIGNMENTS];
  const aTourCol = colNum_(aHeaders, 'Tour ID') - 1;
  const aJobCol = colNum_(aHeaders, 'Job') - 1;
  const aStatusCol = colNum_(aHeaders, 'Status') - 1;
  const { rows: aRows } = readSheet(SHEETS.ASSIGNMENTS);

  const byTour = {};
  aRows.forEach(r => {
    const tourId = r[aTourCol];
    if (!tourId) return;
    if (String(r[aStatusCol]).trim() === 'Cancelled') return;
    if (!byTour[tourId]) byTour[tourId] = { count: 0, byJob: {} };
    byTour[tourId].count++;
    const job = String(r[aJobCol] || '').trim();
    if (job) byTour[tourId].byJob[job] = (byTour[tourId].byJob[job] || 0) + 1;
  });

  const filledValues = [];
  const rolesValues = [];
  rows.forEach(r => {
    const t = byTour[r[idCol]];
    filledValues.push([t ? t.count : 0]);
    rolesValues.push([t ? formatJobCounts_(t.byJob) : '']);
  });

  sheet.getRange(2, filledCol, rows.length, 1).setValues(filledValues);
  sheet.getRange(2, rolesCol, rows.length, 1).setValues(rolesValues);
}
