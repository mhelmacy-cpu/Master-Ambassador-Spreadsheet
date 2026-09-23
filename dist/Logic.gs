/**
 * Everything that decides something: eligibility, scheduling,
 * conflict checks, staffing suggestions, tallies, and the live dashboard.
 *
 * Bundled file - it holds what used to be several separate script
 * files. Apps Script puts every .gs file in one shared namespace, so
 * merging them changes nothing about how the code runs; it just means
 * far less to paste. Each section below starts with a banner.
 */

/* ==========================================================
 * Eligibility
 * ========================================================== */

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

/* ==========================================================
 * Tours
 * ========================================================== */

/**
 * Tour scheduling: create/list tours visiting the school.
 */

function addTour(data) {
  const sheet = getOrCreateSheet(SHEETS.TOURS);
  const headers = HEADERS[SHEETS.TOURS];
  const { rows } = readSheet(SHEETS.TOURS);
  const idCol = colNum_(headers, 'Tour ID') - 1;
  const existingIds = rows.map(r => r[idCol]);

  const dateVal = toDate_(data.date);
  if (!dateVal) throw new Error('A valid tour date is required.');
  const idPrefix = 'TOUR-' + Utilities.formatDate(dateVal, ss_().getSpreadsheetTimeZone(), 'yyyyMMdd');
  const tourId = nextId_(idPrefix, existingIds);

  const row = headers.map(h => {
    switch (h) {
      case 'Tour ID': return tourId;
      case 'Date': return dateVal;
      case 'Start Time': return data.startTime ? combineDateAndTime_(dateVal, data.startTime) : '';
      case 'End Time': return data.endTime ? combineDateAndTime_(dateVal, data.endTime) : '';
      case 'Visiting School / Group': return data.group || '';
      case 'Contact Name': return data.contactName || '';
      case 'Contact Email': return data.contactEmail || '';
      case 'Grade Level': return data.gradeLevel || '';
      case '# of Visitors': return data.numVisitors || '';
      case 'Status': return 'Scheduled';
      case 'Notes': return data.notes || '';
      default: return '';
    }
  });
  sheet.appendRow(row);
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, colNum_(headers, 'Date')).setNumberFormat('yyyy-mm-dd');
  sheet.getRange(lastRow, colNum_(headers, 'Start Time')).setNumberFormat('h:mm AM/PM');
  sheet.getRange(lastRow, colNum_(headers, 'End Time')).setNumberFormat('h:mm AM/PM');
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Status'), TOUR_STATUSES);
  return tourId;
}

function listTours() {
  const { rows } = readSheet(SHEETS.TOURS);
  const headers = HEADERS[SHEETS.TOURS];
  const idCol = colNum_(headers, 'Tour ID') - 1;
  const dateCol = colNum_(headers, 'Date') - 1;
  const groupCol = colNum_(headers, 'Visiting School / Group') - 1;
  const statusCol = colNum_(headers, 'Status') - 1;

  return rows
    .filter(r => r[idCol])
    .filter(r => String(r[statusCol]).trim() !== 'Cancelled')
    .map(r => ({
      id: r[idCol],
      label: r[idCol] + ' - ' + formatDate_(r[dateCol]) + ' - ' + r[groupCol]
    }))
    .sort((a, b) => a.id < b.id ? 1 : -1);
}

/**
 * Bulk-creates recurring Wednesday-morning tours (8:30-9:25, matching the
 * Tour Routes schedule) starting from startDateStr, one per week. Rolls
 * a non-Wednesday start date forward to the next Wednesday rather than
 * silently creating a wrong-weekday tour. Skips any week that already
 * has a non-cancelled tour on that date.
 */
function generateWednesdayTours(startDateStr, weeks) {
  const numWeeks = Math.max(1, Number(weeks) || 1);
  let start = toDate_(startDateStr);
  if (!start) throw new Error('A valid start date is required.');
  const rolledForward = start.getDay() !== 3; // 0=Sun ... 3=Wed
  while (start.getDay() !== 3) {
    start = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  }

  const { rows } = readSheet(SHEETS.TOURS);
  const headers = HEADERS[SHEETS.TOURS];
  const dateCol = colNum_(headers, 'Date') - 1;
  const statusCol = colNum_(headers, 'Status') - 1;
  const existingDates = {};
  rows.forEach(r => {
    if (String(r[statusCol]).trim() !== 'Cancelled') existingDates[toISODate(r[dateCol])] = true;
  });

  const created = [];
  const skipped = [];
  for (let i = 0; i < numWeeks; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i * 7);
    const iso = toISODate(d);
    if (existingDates[iso]) { skipped.push(iso); continue; }
    const tourId = addTour({
      date: iso,
      startTime: '08:30',
      endTime: '09:25',
      group: 'Wednesday Morning Tours',
      notes: ''
    });
    created.push({ date: iso, tourId: tourId });
  }

  return { created: created, skipped: skipped, rolledForward: rolledForward };
}

function getTourById_(tourId) {
  const headers = HEADERS[SHEETS.TOURS];
  const { rows } = readSheet(SHEETS.TOURS);
  const idCol = colNum_(headers, 'Tour ID') - 1;
  const row = rows.find(r => r[idCol] === tourId);
  if (!row) return null;
  return {
    id: row[idCol],
    date: row[colNum_(headers, 'Date') - 1],
    startTime: row[colNum_(headers, 'Start Time') - 1],
    endTime: row[colNum_(headers, 'End Time') - 1],
    group: row[colNum_(headers, 'Visiting School / Group') - 1]
  };
}

/* ==========================================================
 * TouringStudents
 * ========================================================== */

/**
 * Info about visiting/touring students (not ambassadors) tied to a Tour.
 */

function addTouringStudent(data) {
  const sheet = getOrCreateSheet(SHEETS.TOURING_STUDENTS);
  const headers = HEADERS[SHEETS.TOURING_STUDENTS];
  if (!data.tourId) throw new Error('A tour must be selected.');
  if (!data.firstName) throw new Error('First name is required.');

  const availability = getRouteAvailability(data.tourId);
  let route = data.route;
  if (route) {
    const taken = availability.find(r => r.route === route);
    if (taken && taken.taken) {
      throw new Error('Route ' + route + ' is already assigned to ' + taken.takenBy + ' for this tour.');
    }
  } else {
    route = pickNextRoute_(availability);
  }

  const row = headers.map(h => {
    switch (h) {
      case 'Tour ID': return data.tourId;
      case 'First Name': return data.firstName || '';
      case 'Last Name': return data.lastName || '';
      case 'Grade': return data.grade || '';
      case 'Borough': return data.borough || '';
      case 'Gender': return data.gender || '';
      case 'Route': return route || '';
      case 'School': return data.school || '';
      case 'Allergies / Medical Notes': return data.medicalNotes || '';
      case 'Chaperone Name': return data.chaperoneName || '';
      case 'Chaperone Contact': return data.chaperoneContact || '';
      case 'Notes': return data.notes || '';
      default: return '';
    }
  });
  sheet.appendRow(row);
  return true;
}

/**
 * The next route to hand a family: the first free one, or failing that
 * the least-used one.
 *
 * There are 7 routes, so a morning with 8 families has to double one up.
 * That's allowed rather than refused - a family without a route is worse
 * than two families on the same path - and Max Families Per Route on the
 * Settings sheet controls when it starts doubling.
 */
function pickNextRoute_(availability) {
  const maxPerRoute = Number(getSetting('Max Families Per Route', 1)) || 1;
  const underCap = availability.filter(r => r.count < maxPerRoute);
  const pool = underCap.length ? underCap : availability;
  return pool.reduce((best, r) => r.count < best.count ? r : best, pool[0]).route;
}

function listTouringStudentsForTour(tourId) {
  const { rows } = readSheet(SHEETS.TOURING_STUDENTS);
  const headers = HEADERS[SHEETS.TOURING_STUDENTS];
  const idCol = colNum_(headers, 'Tour ID') - 1;
  return rows.filter(r => r[idCol] === tourId);
}

/** For a given tour, which of the 7 routes are already claimed and by whom. */
function getRouteAvailability(tourId) {
  const headers = HEADERS[SHEETS.TOURING_STUDENTS];
  const firstCol = colNum_(headers, 'First Name') - 1;
  const lastCol = colNum_(headers, 'Last Name') - 1;
  const routeCol = colNum_(headers, 'Route') - 1;
  const students = tourId ? listTouringStudentsForTour(tourId) : [];

  const takenBy = {};
  students.forEach(r => {
    const route = String(r[routeCol] || '').trim();
    if (!route) return;
    (takenBy[route] = takenBy[route] || []).push(fullName_(r[firstCol], r[lastCol]));
  });

  const maxPerRoute = Number(getSetting('Max Families Per Route', 1)) || 1;
  return TOUR_ROUTE_NUMBERS.map(route => ({
    route: route,
    count: (takenBy[route] || []).length,
    taken: (takenBy[route] || []).length >= maxPerRoute,
    takenBy: (takenBy[route] || []).join(', ')
  }));
}

/* ==========================================================
 * Assignments
 * ========================================================== */

/**
 * Assigning ambassadors to tours/jobs - the master schedule.
 * Enforces: ambassador is Active, ambassador is Eligible for the job,
 * and no double-booking (overlapping time on the same date).
 */

function assignAmbassador(data) {
  const headers = HEADERS[SHEETS.ASSIGNMENTS];
  const ambassadorHeaders = HEADERS[SHEETS.AMBASSADORS];

  if (!data.tourId) throw new Error('A tour must be selected.');
  if (!data.job) throw new Error('A job must be selected.');
  if (!data.ambassador) throw new Error('An ambassador must be selected.');

  const dateVal = toDate_(data.date);
  if (!dateVal) throw new Error('A valid date is required.');

  const start = combineDateAndTime_(dateVal, data.startTime);
  const end = combineDateAndTime_(dateVal, data.endTime);
  if (!start || !end || end <= start) throw new Error('End time must be after start time.');

  // Active check.
  const { rows: ambassadorRows } = readSheet(SHEETS.AMBASSADORS);
  const firstCol = colNum_(ambassadorHeaders, 'First Name') - 1;
  const lastCol = colNum_(ambassadorHeaders, 'Last Name') - 1;
  const activeCol = colNum_(ambassadorHeaders, 'Active') - 1;
  const teacherCol = colNum_(ambassadorHeaders, 'Advisor') - 1;
  const ambassadorRow = ambassadorRows.find(r => fullName_(r[firstCol], r[lastCol]) === data.ambassador);
  if (!ambassadorRow) throw new Error('Ambassador not found on the Ambassadors sheet.');
  if (String(ambassadorRow[activeCol]).trim().toLowerCase() !== 'yes') {
    throw new Error(data.ambassador + ' is marked inactive and cannot be scheduled.');
  }

  // Eligibility check.
  if (!isEligible_(data.ambassador, data.job)) {
    throw new Error(data.ambassador + ' is not marked eligible for "' + data.job + '". ' +
      'Update the Eligibility sheet first if this is intentional.');
  }

  // Conflict check: no overlapping assignment for this ambassador.
  const { rows: assignmentRows } = readSheet(SHEETS.ASSIGNMENTS);
  const aCols = assignmentCols_();
  const conflict = assignmentRows.find(r => {
    if (r[aCols.ambassador] !== data.ambassador) return false;
    if (String(r[aCols.status]).trim() === 'Cancelled') return false;
    if (toISODate(r[aCols.date]) !== toISODate(dateVal)) return false;
    const existingStart = combineDateAndTime_(r[aCols.date], r[aCols.start]);
    const existingEnd = combineDateAndTime_(r[aCols.date], r[aCols.end]);
    return rangesOverlap_(start, end, existingStart, existingEnd);
  });
  if (conflict) {
    throw new Error(data.ambassador + ' is already scheduled for ' +
      formatTime_(conflict[aCols.start]) + '-' + formatTime_(conflict[aCols.end]) + ' that day.');
  }

  const sheet = getOrCreateSheet(SHEETS.ASSIGNMENTS);
  const idCol = colNum_(headers, 'Assignment ID') - 1;
  const existingIds = assignmentRows.map(r => r[idCol]);
  const assignmentId = nextId_('ASN', existingIds);

  const row = headers.map(h => {
    switch (h) {
      case 'Assignment ID': return assignmentId;
      case 'Tour ID': return data.tourId;
      case 'Date': return dateVal;
      case 'Start Time': return start;
      case 'End Time': return end;
      case 'Job': return data.job;
      case 'Ambassador': return data.ambassador;
      case 'Ambassador Advisor': return ambassadorRow[teacherCol] || '';
      case 'Touring Student': return data.touringStudent || '';
      case 'Status': return 'Scheduled';
      case 'Notes': return data.notes || '';
      default: return '';
    }
  });
  sheet.appendRow(row);
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, colNum_(headers, 'Date')).setNumberFormat('yyyy-mm-dd');
  sheet.getRange(lastRow, colNum_(headers, 'Start Time')).setNumberFormat('h:mm AM/PM');
  sheet.getRange(lastRow, colNum_(headers, 'End Time')).setNumberFormat('h:mm AM/PM');
  applyDropdown_(sheet, lastRow, colNum_(headers, 'Status'), ASSIGNMENT_STATUSES);

  refreshDashboard();
  return assignmentId;
}

/** Column index map for the Assignments sheet, for code that scans many rows in a loop. */
function assignmentCols_() {
  const headers = HEADERS[SHEETS.ASSIGNMENTS];
  return {
    date: colNum_(headers, 'Date') - 1,
    start: colNum_(headers, 'Start Time') - 1,
    end: colNum_(headers, 'End Time') - 1,
    ambassador: colNum_(headers, 'Ambassador') - 1,
    status: colNum_(headers, 'Status') - 1
  };
}

function isAmbassadorBusy_(assignmentRows, cols, ambassadorName, dateVal, start, end) {
  return assignmentRows.some(r => {
    if (r[cols.ambassador] !== ambassadorName) return false;
    if (String(r[cols.status]).trim() === 'Cancelled') return false;
    if (toISODate(r[cols.date]) !== toISODate(dateVal)) return false;
    const existingStart = combineDateAndTime_(r[cols.date], r[cols.start]);
    const existingEnd = combineDateAndTime_(r[cols.date], r[cols.end]);
    return rangesOverlap_(start, end, existingStart, existingEnd);
  });
}

/** Ambassadors eligible+active for a job, annotated with a conflict flag for the given date/time. */
function getAssignableAmbassadors(job, dateStr, startTime, endTime) {
  const candidates = getEligibleActiveAmbassadors(job);
  if (!dateStr || !startTime || !endTime) return candidates.map(name => ({ name, busy: false }));

  const dateVal = toDate_(dateStr);
  const start = combineDateAndTime_(dateVal, startTime);
  const end = combineDateAndTime_(dateVal, endTime);
  const { rows } = readSheet(SHEETS.ASSIGNMENTS);
  const cols = assignmentCols_();

  return candidates.map(name => ({
    name,
    busy: isAmbassadorBusy_(rows, cols, name, dateVal, start, end)
  }));
}

/* ==========================================================
 * AmbassadorStats
 * ========================================================== */

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

/* ==========================================================
 * TourStaffing
 * ========================================================== */

/**
 * Suggests who should staff a tour's 4 roles, for staff to review and
 * confirm (never auto-saved without a human clicking Confirm).
 *
 * Panelist / Lobby Greeter / Table Greeter: one pick each, from
 * ambassadors who are eligible + active + free at the tour's time,
 * ranked by fairness (fewest Total Tours first) so duty rotates.
 *
 * Tour Guide: 2 picks per touring student, ranked by grade fit + borough
 * fit, then fairness. Grade and Gender are hard constraints, not just
 * weighted scores: at least one of the 2 guides must be the exact same
 * grade as the grade the student is applying to (this is generalized -
 * it isn't specific to any one grade), and at least one must match
 * Gender, whenever the eligible/available pool allows it. A single
 * guide covering both is preferred; otherwise the two constraints are
 * split across guide1/guide2. So a 5th-grade applicant touring with a
 * 5th and 6th grader goes to class with the 5th grader; a boy touring
 * might get one girl guide and one boy guide, or two boys, but never
 * two guides picked without checking for at least one grade match and
 * at least one gender match first.
 *
 * The "bring visitors to class" step isn't a separately-computed room -
 * it's simply whichever guide covers the grade match, at wherever their
 * own class already is (their Homeroom Pod + Teacher). Up to 3 touring
 * students are steered toward the same class before spreading to
 * another one of that grade's classes; if there aren't enough
 * grade-matched guides to stay under that, it goes over rather than
 * leaving a student without a grade match - that's flagged for staff to
 * rebalance by hand.
 */

function suggestStaffingForTour(tourId) {
  const tour = getTourById_(tourId);
  if (!tour) throw new Error('Tour not found.');
  const dateVal = toDate_(tour.date);
  if (!dateVal || !tour.startTime || !tour.endTime) {
    throw new Error('This tour is missing a date/start/end time - add one on the Tours sheet first.');
  }
  const start = combineDateAndTime_(dateVal, tour.startTime);
  const end = combineDateAndTime_(dateVal, tour.endTime);

  const directory = getAmbassadorDirectory_();
  const { rows: assignmentRows } = readSheet(SHEETS.ASSIGNMENTS);
  const aCols = assignmentCols_();
  const usedThisPass = {};
  const classVisitCount = {}; // "Pod|Teacher" -> # touring students already sent there this pass
  const CLASS_VISIT_MAX = 3;
  function classKey_(a) { return (a.homeroomPod || '?') + '|' + (a.teacher || '?'); }

  function availableFor(job) {
    return directory.filter(a =>
      a.active &&
      isEligible_(a.name, job) &&
      !isAmbassadorBusy_(assignmentRows, aCols, a.name, dateVal, start, end)
    );
  }

  function byFairness(x, y) {
    const ux = usedThisPass[x.name] || 0, uy = usedThisPass[y.name] || 0;
    if (ux !== uy) return ux - uy;
    if (x.totalTours !== y.totalTours) return x.totalTours - y.totalTours;
    return x.name < y.name ? -1 : 1;
  }

  /**
   * The lobby, table and panel crews staff the morning as a whole rather
   * than any one route, so each needs several people. Picks are taken in
   * fairness order and re-ranked after every pick, so one pass doesn't
   * hand the same kid two of the slots while others sit idle.
   */
  function pickCrew(job, count) {
    const pool = availableFor(job);
    const chosen = [];
    for (let i = 0; i < count; i++) {
      const ranked = pool
        .filter(a => chosen.indexOf(a.name) === -1)
        .sort(byFairness);
      if (ranked.length === 0) break;
      chosen.push(ranked[0].name);
      usedThisPass[ranked[0].name] = (usedThisPass[ranked[0].name] || 0) + 1;
    }
    return {
      chosen: chosen,
      needed: count,
      short: Math.max(0, count - chosen.length),
      alternates: pool.sort(byFairness).map(a => a.name)
    };
  }

  const needed = jobsNeeded_();
  const singleRoles = {};
  [TOUR_JOBS.PANELIST, TOUR_JOBS.LOBBY_GREETER, TOUR_JOBS.TABLE_GREETER].forEach(job => {
    singleRoles[job] = pickCrew(job, needed[job] || 1);
  });

  const guidePool = availableFor(TOUR_JOBS.TOUR_GUIDE);
  const students = getTouringStudentDirectory_(tourId);

  const tourGuides = students.map(s => {
    function fitScore(a) {
      let score = 0;
      if (s.grade != null && a.grade != null) {
        if (a.grade === s.grade) score += 2;
        else if (Math.abs(a.grade - s.grade) === 1) score += 1;
      }
      if (s.borough && a.borough && a.borough === s.borough) score += 2;
      return score;
    }

    // Anyone already holding a slot this morning is out of the running.
    // Every job runs 8:30-9:25, so a second one is a double-booking that
    // assignAmbassador would reject at save time anyway - better to
    // suggest a weaker slate that saves than a stronger one that fails.
    const ranked = guidePool
      .filter(a => !usedThisPass[a.name])
      .sort((x, y) => {
        const diff = fitScore(y) - fitScore(x);
        return diff !== 0 ? diff : byFairness(x, y);
      });

    if (ranked.length === 0) {
      return { studentName: s.name, route: s.route, guide1: null, guide2: null, alternates: [], gradeMatched: false, classWith: null };
    }

    // Hard constraints: at least one guide should match applying Grade
    // (exactly), and at least one should match Gender, when the pool
    // allows it. A single guide covering both is preferred; otherwise
    // split the two constraints across guide1/guide2. Among grade
    // matches, prefer whichever one's class hasn't hit the 3-visitor
    // cap yet - but never exclude someone just for being over it (the
    // grade match is the hard constraint; the cap is a soft, rebalance-
    // it-by-hand preference).
    const gradeMatches = (s.grade != null ? ranked.filter(a => a.grade === s.grade) : [])
      .slice()
      .sort((x, y) => (classVisitCount[classKey_(x)] || 0) - (classVisitCount[classKey_(y)] || 0));
    const genderMatches = s.gender ? ranked.filter(a => a.gender === s.gender) : [];
    const coversBoth = a => gradeMatches.includes(a) && genderMatches.includes(a);

    let guide1 = ranked.find(coversBoth) || gradeMatches[0] || genderMatches[0] || ranked[0];
    const guide1CoversGrade = s.grade != null && guide1.grade === s.grade;
    const guide1CoversGender = !!(s.gender && guide1.gender === s.gender);

    let guide2 = null;
    if (!guide1CoversGrade && gradeMatches.length > 0) {
      guide2 = gradeMatches.find(a => a.name !== guide1.name) || null;
    }
    if (!guide2 && !guide1CoversGender && genderMatches.length > 0) {
      guide2 = genderMatches.find(a => a.name !== guide1.name) || null;
    }
    if (!guide2) guide2 = ranked.find(a => a.name !== guide1.name) || null;

    usedThisPass[guide1.name] = (usedThisPass[guide1.name] || 0) + 1;
    if (guide2) usedThisPass[guide2.name] = (usedThisPass[guide2.name] || 0) + 1;

    const gradeMatched = guide1CoversGrade || (guide2 && guide2.grade === s.grade);
    const classGuide = guide1CoversGrade ? guide1 : (guide2 && guide2.grade === s.grade ? guide2 : null);
    let classOverCap = false;
    if (classGuide) {
      const key = classKey_(classGuide);
      classOverCap = (classVisitCount[key] || 0) >= CLASS_VISIT_MAX;
      classVisitCount[key] = (classVisitCount[key] || 0) + 1;
    }

    return {
      studentName: s.name,
      route: s.route,
      guide1: guide1.name,
      guide2: guide2 ? guide2.name : null,
      alternates: ranked.map(a => a.name),
      gradeMatched: gradeMatched,
      classWith: classGuide ? { guide: classGuide.name, pod: classGuide.homeroomPod, teacher: classGuide.teacher } : null,
      classOverCap: classOverCap
    };
  });

  return {
    tourId: tourId,
    tourLabel: tour.group + ' - ' + formatDate_(dateVal) + ' ' + formatTime_(start) + '-' + formatTime_(end),
    singleRoles: singleRoles,
    tourGuides: tourGuides
  };
}

/** Writes the staff-confirmed slate to Assignments. Never called without an explicit confirm click. */
function confirmTourStaffing(tourId, selections) {
  const tour = getTourById_(tourId);
  if (!tour) throw new Error('Tour not found.');
  const results = { created: [], errors: [] };

  function tryAssign(job, ambassadorName, touringStudentName) {
    if (!ambassadorName) return;
    try {
      const id = assignAmbassador({
        tourId: tourId,
        job: job,
        date: tour.date,
        startTime: tour.startTime,
        endTime: tour.endTime,
        ambassador: ambassadorName,
        touringStudent: touringStudentName || ''
      });
      results.created.push({ job: job, ambassador: ambassadorName, touringStudent: touringStudentName || '', id: id });
    } catch (err) {
      results.errors.push({ job: job, ambassador: ambassadorName, touringStudent: touringStudentName || '', message: err.message });
    }
  }

  (selections.panelist || []).forEach(name => tryAssign(TOUR_JOBS.PANELIST, name));
  (selections.lobbyGreeter || []).forEach(name => tryAssign(TOUR_JOBS.LOBBY_GREETER, name));
  (selections.tableGreeter || []).forEach(name => tryAssign(TOUR_JOBS.TABLE_GREETER, name));
  (selections.tourGuides || []).forEach(g => {
    tryAssign(TOUR_JOBS.TOUR_GUIDE, g.guide1, g.studentName);
    tryAssign(TOUR_JOBS.TOUR_GUIDE, g.guide2, g.studentName);
  });

  return results;
}

function getAmbassadorDirectory_() {
  const headers = HEADERS[SHEETS.AMBASSADORS];
  const { rows } = readSheet(SHEETS.AMBASSADORS);
  const firstCol = colNum_(headers, 'First Name') - 1;
  const lastCol = colNum_(headers, 'Last Name') - 1;
  const gradeCol = colNum_(headers, 'Grade') - 1;
  const homeroomPodCol = colNum_(headers, 'Homeroom Pod') - 1;
  const teacherCol = colNum_(headers, 'Advisor') - 1;
  const splitCol = colNum_(headers, 'Split') - 1;
  const languageCol = colNum_(headers, 'Language') - 1;
  const boroughCol = colNum_(headers, 'Borough') - 1;
  const genderCol = colNum_(headers, 'Gender') - 1;
  const activeCol = colNum_(headers, 'Active') - 1;
  const totalToursCol = colNum_(headers, 'Total Tours') - 1;

  return rows
    .filter(r => fullName_(r[firstCol], r[lastCol]).trim() !== '')
    .map(r => ({
      name: fullName_(r[firstCol], r[lastCol]),
      grade: parseGradeNum_(r[gradeCol]),
      homeroomPod: String(r[homeroomPodCol] || '').trim(),
      teacher: String(r[teacherCol] || '').trim(),
      split: String(r[splitCol] || '').trim(),
      language: String(r[languageCol] || '').trim(),
      borough: String(r[boroughCol] || '').trim().toUpperCase(),
      gender: String(r[genderCol] || '').trim(),
      active: String(r[activeCol]).trim().toLowerCase() === 'yes',
      totalTours: Number(r[totalToursCol]) || 0
    }));
}

function getTouringStudentDirectory_(tourId) {
  const headers = HEADERS[SHEETS.TOURING_STUDENTS];
  const firstCol = colNum_(headers, 'First Name') - 1;
  const lastCol = colNum_(headers, 'Last Name') - 1;
  const gradeCol = colNum_(headers, 'Grade') - 1;
  const boroughCol = colNum_(headers, 'Borough') - 1;
  const genderCol = colNum_(headers, 'Gender') - 1;
  const routeCol = colNum_(headers, 'Route') - 1;

  return listTouringStudentsForTour(tourId).map(r => ({
    name: fullName_(r[firstCol], r[lastCol]),
    grade: parseGradeNum_(r[gradeCol]),
    borough: String(r[boroughCol] || '').trim().toUpperCase(),
    gender: String(r[genderCol] || '').trim(),
    route: String(r[routeCol] || '').trim()
  }));
}

/* ==========================================================
 * HomeroomSync
 * ========================================================== */

/**
 * Matches Ambassadors sheet rows against MS_ROSTER_ by exact
 * (normalized) full name, and fills in Grade / Homeroom Pod / Advisor /
 * Split / Language, plus Student Email where that cell is still empty.
 * Re-runnable each year with an updated MS_ROSTER_.
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
  const splitCol = colNum_(headers, 'Split') - 1;
  const languageCol = colNum_(headers, 'Language') - 1;
  const emailCol = colNum_(headers, 'Student Email') - 1;
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
      sheet.getRange(sheetRow, splitCol + 1).setValue(hit.split || '');
      sheet.getRange(sheetRow, languageCol + 1).setValue(hit.language || '');
      // Don't overwrite an address someone has corrected by hand.
      if (!String(r[emailCol] || '').trim() && hit.email) {
        sheet.getRange(sheetRow, emailCol + 1).setValue(hit.email);
      }
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
  let msg = 'Matched ' + result.matched + ' ambassador(s) to the 2026-27 roster. ' +
    'Grade, Homeroom Pod, Advisor, Split and Language are filled in, and a blank ' +
    'Student Email is filled in too (an address already there is left alone).';
  if (result.flaggedGraduated.length > 0) {
    msg += '\n\nMarked Inactive (not in this year\'s MS roster - likely graduated): ' +
      result.flaggedGraduated.join(', ');
  }
  if (result.unmatched.length > 0) {
    msg += '\n\nCould not find a match (check spelling/nickname): ' + result.unmatched.join(', ');
  }
  SpreadsheetApp.getUi().alert(msg);
}

/* ==========================================================
 * AmbassadorsImport
 * ========================================================== */

/**
 * Paste-to-import for the Ambassadors roster, so staff can update the
 * list themselves (e.g. a new master roster export) without editing code.
 *
 * Upserts by (Name, Borough) - not name alone - since the same student
 * can legitimately appear twice under different boroughs (see Blake
 * Glenn). Re-pasting the same list is safe: matching rows are updated
 *  in place (grade + parent info only; Advisor/Student Email/Split/Language/Active/Notes
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
  applyTeacherDropdown_(sheet, lastRow, colNum_(headers, 'Advisor'));
  sheet.autoResizeColumns(1, headers.length);

  rebuildEligibilityMatrix();

  return { added: added, updated: updated, total: parsed.length };
}

/* ==========================================================
 * StudentSchedule
 * ========================================================== */

/**
 * "What class would this student be in, and what would they miss?"
 *
 * Works off two things: the homeroom roster (which pod each of the 143
 * Middle School students is in) and the bell schedule (what each pod is
 * doing at any given time on any given day).
 *
 * Where the schedule names parallel groups rather than one class - the
 * lettered sections (Math A/B/C), the language choice, Majors/Electives -
 * every option is returned together with needsConfirmation, because the
 * source schedule never says which student is in which group. The UI
 * shows those as "confirm before pulling" rather than pretending to know.
 */

/** Every MS student from the homeroom roster: {name, grade, pod, advisor}. */
function getAllMsStudents() {
  const out = [];
  HOMEROOM_DATA_.forEach(section => {
    Object.keys(section.advisors).forEach(advisor => {
      section.advisors[advisor].forEach(name => {
        out.push({ name: name, grade: section.grade, pod: section.pod, advisor: advisor });
      });
    });
  });
  out.sort((a, b) => a.name < b.name ? -1 : 1);
  return out;
}

function getStudentByName_(name) {
  const key = normalizeName_(name);
  return getAllMsStudents().find(s => normalizeName_(s.name) === key) || null;
}

/** "13:25" / "1:25 PM" / a Date -> minutes past midnight. */
function timeToMinutes_(value) {
  if (value instanceof Date) return value.getHours() * 60 + value.getMinutes();
  const s = String(value || '').trim();
  if (!s) return null;
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?$/.exec(s);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ampm = (m[3] || '').toLowerCase();
  if (ampm === 'pm' && hh < 12) hh += 12;
  if (ampm === 'am' && hh === 12) hh = 0;
  // Bare hours 1-2 in the bell schedule mean the afternoon, not 1am.
  if (!ampm && hh < 8) hh += 12;
  return hh * 60 + mm;
}

function minutesToLabel_(mins) {
  let hh = Math.floor(mins / 60);
  const mm = mins % 60;
  const ampm = hh >= 12 ? 'PM' : 'AM';
  if (hh > 12) hh -= 12;
  if (hh === 0) hh = 12;
  return hh + ':' + String(mm).padStart(2, '0') + ' ' + ampm;
}

const SUBJECT_WORDS_ = ['Hum', 'Math', 'Science', 'PE', 'Art', 'Music', 'Choices',
  'French', 'Mandarin', 'Spanish'];

/**
 * True when the block names parallel options rather than one class the
 * whole pod attends together.
 *
 * A lettered section on its own ("Math A", "Music B") is not a split:
 * each pod gets one entry per time slot, so the letter says which
 * section that pod attends and there is a single teacher to notify.
 *
 * Several teachers can mean either thing, and the rooms tell them apart.
 * Two teachers in one room ("Science A LL/EZ M307") are co-teaching one
 * class, so both should hear about it. Two teachers across two rooms
 * ("Hum As ES+SdB M107 M108") are separate sections running at the same
 * time, and nothing here says which one a given student sits in.
 *
 * Also ambiguous: two different subjects in one cell, the student-chosen
 * blocks, and anything the PDF transcription could not read.
 */
function isSplitBlock_(text) {
  const t = String(text || '');
  // A half-pod block still carrying its group marker has not been
  // narrowed to this student, so both halves are still on the table.
  if (/\(split [A-C]\)/.test(t)) return true;
  if (t.indexOf('Majors') !== -1 || t.indexOf('Electives') !== -1) return true;
  if (t.indexOf('unclear from PDF') !== -1) return true;
  const distinctSubjects = SUBJECT_WORDS_.filter(s => new RegExp('\\b' + s + '\\b').test(t));
  if (distinctSubjects.length >= 2) return true;
  return extractInitials_(t).length >= 2 && extractRooms_(t).length >= 2;
}

/**
 * Bell schedule rows, preferring the Bell Schedule sheet (so hand edits
 * stick) and falling back to the seeded data before first setup.
 */
function getBellSchedule_() {
  const byDayPod = {};
  const add = (day, pod, start, end, text, initials) => {
    const dayKey = String(day).trim();
    const podKey = String(pod).trim();
    if (!dayKey || !podKey) return;
    if (!byDayPod[dayKey]) byDayPod[dayKey] = {};
    if (!byDayPod[dayKey][podKey]) byDayPod[dayKey][podKey] = [];
    byDayPod[dayKey][podKey].push({
      start: start,
      end: end,
      text: text,
      initials: String(initials || '').split(',').map(s => s.trim()).filter(Boolean)
    });
  };

  const sheet = ss_().getSheetByName(SHEETS.BELL_SCHEDULE);
  if (sheet && sheet.getLastRow() > 1) {
    const { rows } = readSheet(SHEETS.BELL_SCHEDULE);
    const headers = HEADERS[SHEETS.BELL_SCHEDULE];
    const dayCol = colNum_(headers, 'Day') - 1;
    const podCol = colNum_(headers, 'Homeroom Pod') - 1;
    const startCol = colNum_(headers, 'Start') - 1;
    const endCol = colNum_(headers, 'End') - 1;
    const whatCol = colNum_(headers, 'What / Teacher / Room') - 1;
    const initialsCol = colNum_(headers, 'Teacher Initials') - 1;
    rows.forEach(r => add(r[dayCol], r[podCol], r[startCol], r[endCol], r[whatCol], r[initialsCol]));
    return byDayPod;
  }

  SCHEDULE_DAYS.forEach(day => {
    Object.keys(BELL_SCHEDULE_[day]).forEach(pod => {
      BELL_SCHEDULE_[day][pod].forEach(e => add(day, pod, e[0], e[1], e[2]));
    });
  });
  return byDayPod;
}

const WEEKDAY_NAMES_ = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * What each of the given students is scheduled to be doing between
 * startTime and endTime on the given date.
 */
function lookupStudentsAtTime(studentNames, dateStr, startTime, endTime) {
  const dateVal = toDate_(dateStr);
  if (!dateVal) throw new Error('A valid date is required.');
  const startMin = timeToMinutes_(startTime);
  const endMin = timeToMinutes_(endTime);
  if (startMin == null || endMin == null) throw new Error('A valid start and end time are required.');
  if (endMin <= startMin) throw new Error('End time must be after start time.');

  const dayName = WEEKDAY_NAMES_[dateVal.getDay()];
  const schedule = getBellSchedule_();
  const daySchedule = schedule[dayName] || null;

  const results = (studentNames || []).map(name => {
    const student = getStudentByName_(name);
    if (!student) {
      return { name: name, found: false, blocks: [],
        note: 'Not found on the 2026-27 Middle School roster - check the spelling.' };
    }
    if (!daySchedule) {
      return { name: student.name, found: true, grade: student.grade, pod: student.pod,
        advisor: student.advisor, blocks: [],
        note: 'No bell schedule on file for ' + dayName + ' (the schedule covers Monday-Friday).' };
    }
    const podBlocks = daySchedule[student.pod] || [];
    const overlapping = podBlocks
      .map(b => ({ b: b, s: timeToMinutes_(b.start), e: timeToMinutes_(b.end) }))
      .filter(x => x.s != null && x.e != null && x.s < endMin && startMin < x.e)
      .sort((x, y) => x.s - y.s)
      .map(x => ({
        start: minutesToLabel_(x.s),
        end: minutesToLabel_(x.e),
        what: x.b.text,
        needsConfirmation: isSplitBlock_(x.b.text)
      }));

    return {
      name: student.name, found: true, grade: student.grade, pod: student.pod,
      advisor: student.advisor, blocks: overlapping,
      note: overlapping.length === 0 ? 'Nothing scheduled in that window (outside the school day?).' : ''
    };
  });

  return { day: dayName, window: minutesToLabel_(startMin) + ' - ' + minutesToLabel_(endMin), students: results };
}

/** Saves a meeting to the Meetings sheet, recording what each student misses. */
function scheduleMeeting(data) {
  if (!data.students || data.students.length === 0) throw new Error('Pick at least one student.');
  const lookup = lookupStudentsAtTime(data.students, data.date, data.startTime, data.endTime);

  const sheet = getOrCreateSheet(SHEETS.MEETINGS);
  const headers = HEADERS[SHEETS.MEETINGS];
  const { rows } = readSheet(SHEETS.MEETINGS);
  const idCol = colNum_(headers, 'Meeting ID') - 1;
  const meetingId = nextId_('MTG', rows.map(r => r[idCol]));

  const dateVal = toDate_(data.date);
  const missed = lookup.students.map(s => {
    if (!s.found) return s.name + ': not on roster';
    if (s.blocks.length === 0) return s.name + ': nothing scheduled';
    return s.name + ' (' + s.pod + '): ' + s.blocks.map(b => b.what).join(' / ');
  }).join('\n');

  const row = headers.map(h => {
    switch (h) {
      case 'Meeting ID': return meetingId;
      case 'Date': return dateVal;
      case 'Start Time': return combineDateAndTime_(dateVal, data.startTime);
      case 'End Time': return combineDateAndTime_(dateVal, data.endTime);
      case 'Students': return data.students.join(', ');
      case 'Purpose': return data.purpose || '';
      case 'Location': return data.location || '';
      case 'Classes Missed': return missed;
      case 'Status': return 'Scheduled';
      case 'Notes': return data.notes || '';
      default: return '';
    }
  });
  sheet.appendRow(row);
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, colNum_(headers, 'Date')).setNumberFormat('yyyy-mm-dd');
  sheet.getRange(lastRow, colNum_(headers, 'Start Time')).setNumberFormat('h:mm AM/PM');
  sheet.getRange(lastRow, colNum_(headers, 'End Time')).setNumberFormat('h:mm AM/PM');
  sheet.getRange(lastRow, colNum_(headers, 'Classes Missed')).setWrap(true);

  return { meetingId: meetingId, lookup: lookup };
}

/* ==========================================================
 * TeacherInitials
 * ========================================================== */

/**
 * The bell schedule writes teachers as initials ("Math A CB M311"), so
 * emailing the teacher whose class an ambassador is actually missing
 * means resolving CB -> a person -> an address.
 *
 * Two halves:
 * 1. Pulling the initials out of each schedule block, which happens once
 *    at setup and lands in the Teacher Initials column so it can be
 *    corrected by hand rather than re-guessed on every run.
 * 2. Mapping initials to a teacher via the Initials column on the
 *    Teachers sheet.
 *
 * Nothing here guesses at an unknown set of initials. An unresolved one
 * is reported back to whoever sent the emails, so a teacher is never
 * silently skipped.
 */

/**
 * Initials confirmed by the office, keyed by the name on the Teachers
 * sheet. The World Language teachers are keyed by room instead: those
 * blocks print as "French - M207 Mandarin - M208 Spanish - M209" with
 * no initials at all, so the room is the only handle on who teaches it.
 */
const SEEDED_TEACHER_INITIALS_ = {
  'Chris': 'CK',
  'Molly': 'MD',
  'Amanda': 'AG',
  'Dan': 'DR',
  'Marco': 'MS',
  'Luis': 'LH',
  'Elizabeth': 'ES',
  'Sabrina': 'SdB',
  'Chantilly': 'CB',
  'Carrie': 'CN',
  'Mo': 'MN',
  'Oliver': 'OC',
  'Sherezada': 'SA',
  'Momii': 'SMR',
  'Suzanne': 'SC',
  'Eliza': 'EZ',
  'Sharyn': 'M207',
  'Janet': 'M208',
  'Mary Katherine': 'M209',
  'Jeremiah': 'M306'
};

/** Teachers who run classes but do not hold an advisory, so aren't on the roster. */
const EXTRA_TEACHERS_ = [
  { name: 'Layla Alter', initials: 'LA', note: 'Choices.' },
  { name: 'Brian', initials: 'BR', note: 'PE.' },
  { name: 'Lila', initials: 'LL', note: "Subbing for Eliza (EZ) through the first half of the year; the schedule lists them together, so both are emailed." }
];

const ROOM_CODE_ = /^(M\d{3}|L\d{3}|TSAC|PAPAS|Charlton|Thompson|Auditorium)$/;

// "MS" is deliberately absent - it is Marco Sanchez. The "MS Meeting"
// banner is skipped by phrase where blocks are read, not by dropping the
// token here, which would lose every class he teaches.
const SCHEDULE_WORDS_ = ['Hum', 'Math', 'Science', 'PE', 'Art', 'Music', 'Choices', 'Lunch', 'Recess',
  'Morning', 'Homeroom', 'Meeting', 'IWP', 'Majors', 'Electives', 'Affinity', 'Groups', 'Olympic',
  'Teams', 'Dance', 'Drama', 'Instrumental', 'Portfolio', 'Vocal', 'Room', 'Modern', 'Band', 'Animation',
  'Ensemble', 'Movement', 'Lab', 'Storytelling', 'Mix', 'Up', 'Ceramics', 'Photography', 'Production',
  'French', 'Mandarin', 'Spanish', 'A', 'B', 'C', 'As', 'Bs', 'Cs', 'CAP', 'Period', 'Activity',
  'unclear', 'from', 'PDF', 'verify', 'locally', 'long', 'block', 'student', 'choice', 'confirm', 'which'];

/** Room codes in a block, e.g. "Hum As ES+SdB M107 M108" -> ['M107', 'M108']. */
function extractRooms_(text) {
  const found = [];
  String(text || '').split(/[\s(),:+\/]+/).forEach(token => {
    const t = token.trim();
    if (ROOM_CODE_.test(t) && found.indexOf(t) === -1) found.push(t);
  });
  return found;
}

/**
 * Teacher handles for one schedule block: initials where the block has
 * them, falling back to room codes where it doesn't. World Language is
 * the reason for the fallback - those blocks name three rooms and no
 * people, so the room is what identifies the teacher.
 */
function extractInitials_(text) {
  const found = [];
  String(text || '').split(/[\s(),:]+/).forEach(token => {
    const trimmed = token.trim();
    if (!trimmed || ROOM_CODE_.test(trimmed) || SCHEDULE_WORDS_.indexOf(trimmed) !== -1) return;
    trimmed.split(/[+\/]/).forEach(part => {
      if (/^[A-Z][A-Za-z]{0,3}$/.test(part) &&
          SCHEDULE_WORDS_.indexOf(part) === -1 &&
          found.indexOf(part) === -1) {
        found.push(part);
      }
    });
  });
  return found.length ? found : extractRooms_(text);
}

/** Map of initials -> {name, email} from the Teachers sheet. */
function getTeacherByInitials_() {
  const { rows } = readSheet(SHEETS.TEACHERS);
  const headers = HEADERS[SHEETS.TEACHERS];
  const nameCol = colNum_(headers, 'Teacher Name') - 1;
  const initialsCol = colNum_(headers, 'Initials') - 1;
  const emailCol = colNum_(headers, 'Teacher Email') - 1;

  const map = {};
  rows.forEach(r => {
    const name = String(r[nameCol] || '').trim();
    if (!name) return;
    // One teacher can carry several sets of initials, comma separated.
    String(r[initialsCol] || '').split(',').forEach(raw => {
      const initials = raw.trim();
      if (initials) map[initials.toUpperCase()] = { name: name, email: String(r[emailCol] || '').trim() };
    });
  });
  return map;
}

const SPLIT_GROUP_RE_ = /\s*\(split ([A-C])\)\s*$/;

/** 'A' / 'B' for a half-pod block, '' for an ordinary one. */
function splitGroupOf_(text) {
  const m = SPLIT_GROUP_RE_.exec(String(text || ''));
  return m ? m[1] : '';
}

/**
 * "Hum Bs ES+SdB M107 M108" + split "2" -> "Hum Bs SdB M108".
 *
 * Returns null unless the block really is parallel sections: as many
 * rooms as teachers, and more than one of each. Co-teaching ("Science A
 * LL/EZ M307" - two teachers, one room) is deliberately left alone, and
 * so is the language block, whose "initials" are really room codes.
 */
function pickParallelSection_(text, split) {
  const inits = extractInitials_(text);
  const rooms = extractRooms_(text);
  const idx = 'ABC'.indexOf(String(split).toUpperCase());
  if (inits.length < 2 || inits.length !== rooms.length) return null;
  if (inits[0] === rooms[0]) return null;
  if (!(idx >= 0 && idx < inits.length)) return null;
  const tokens = String(text).split(/\s+/);
  const prefix = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (rooms.indexOf(t) !== -1 || inits.some(v => t.split(/[+\/]/).indexOf(v) !== -1)) break;
    prefix.push(t);
  }
  return (prefix.join(' ') + ' ' + inits[idx] + ' ' + rooms[idx]).trim();
}

/** True for the period printed as all three language options at once. */
function isLanguageChoiceBlock_(text) {
  const t = String(text || '');
  return /\bFrench\b/.test(t) && /\bMandarin\b/.test(t) && /\bSpanish\b/.test(t);
}

/**
 * Which class an ambassador is missing during a tour, and who teaches it.
 *
 * Returns [{what, start, end, teachers: [{initials, name, email}],
 * unresolved: [initials], ambiguous}]. Ambiguous means the block is a
 * parallel-group period, so the teachers listed are candidates rather
 * than one answer.
 *
 * prefs is the ambassador's {split, language} from the Ambassadors sheet.
 * Those two answers are exactly what the schedule leaves out, so where
 * they are filled in the period resolves to one class and one teacher;
 * where they are blank nothing is guessed and the period comes back
 * ambiguous for a human to forward.
 */
function findMissedClass_(pod, dateVal, startMin, endMin, prefs) {
  const dayName = WEEKDAY_NAMES_[dateVal.getDay()];
  const schedule = getBellSchedule_();
  const daySchedule = schedule[dayName];
  if (!daySchedule || !daySchedule[pod]) return null;

  const overlapping = daySchedule[pod]
    .map(b => ({ b: b, s: timeToMinutes_(b.start), e: timeToMinutes_(b.end) }))
    .filter(x => x.s != null && x.e != null && x.s < endMin && startMin < x.e)
    .sort((x, y) => x.s - y.s);
  if (overlapping.length === 0) return null;

  const split = String((prefs && prefs.split) || '').trim();
  const language = String((prefs && prefs.language) || '').trim();

  const byInitials = getTeacherByInitials_();
  const results = [];
  overlapping.forEach(x => {
    let text = x.b.text;
    // Homeroom, lunch and recess have no class teacher to notify.
    if (/Morning Homeroom|MS Meeting|Lunch|Recess|IWP/.test(text)) return;

    // Half-pod periods: keep only this student's half where we know it.
    const group = splitGroupOf_(text);
    let narrowed = false;
    if (group && split) {
      if (group.toUpperCase() !== split.toUpperCase()) return;
      text = text.replace(SPLIT_GROUP_RE_, '');
      narrowed = true;
    }
    // Language: turn the three-way block into the one class they take.
    if (isLanguageChoiceBlock_(text) && LANGUAGE_ROOMS_[language]) {
      text = language + ' - ' + LANGUAGE_ROOMS_[language];
      narrowed = true;
    }
    // Paired sections running at the same time in two rooms
    // ("Hum Bs ES+SdB M107 M108"): several teachers, one room each. The
    // schedule lists them in a fixed order, so Split A is the first
    // teacher named and Split B the second. Blank Split leaves it
    // ambiguous rather than picking one.
    if (!group && split) {
      const picked = pickParallelSection_(text, split);
      if (picked) { text = picked; narrowed = true; }
    }

    const initialsList = narrowed || !(x.b.initials && x.b.initials.length)
      ? extractInitials_(text)
      : x.b.initials;
    const teachers = [];
    const unresolved = [];
    initialsList.forEach(i => {
      const hit = byInitials[i.toUpperCase()];
      if (hit && hit.email) teachers.push({ initials: i, name: hit.name, email: hit.email });
      else unresolved.push(i);
    });

    results.push({
      what: text,
      start: minutesToLabel_(x.s),
      end: minutesToLabel_(x.e),
      teachers: teachers,
      unresolved: unresolved,
      ambiguous: isSplitBlock_(text)
    });
  });

  return results.length ? results : null;
}

/* ==========================================================
 * Dashboard
 * ========================================================== */

/**
 * "Where are they right now" live view, built from the Assignments sheet.
 * Rewritten each time refreshDashboard() runs (menu, onEdit, or a
 * time-driven trigger) so it always reflects current time + status.
 */

function refreshDashboard() {
  refreshAmbassadorStats();
  refreshTourTallies();

  const sheet = getOrCreateSheet(SHEETS.DASHBOARD);
  sheet.clear();
  sheet.clearFormats();

  const now = new Date();
  const tz = ss_().getSpreadsheetTimeZone();
  const soonWindowMin = Number(getSetting('Dashboard "Starting Soon" Window (minutes)', 15)) || 15;

  const headers = HEADERS[SHEETS.ASSIGNMENTS];
  const { rows } = readSheet(SHEETS.ASSIGNMENTS);
  const dateCol = colNum_(headers, 'Date') - 1;
  const startCol = colNum_(headers, 'Start Time') - 1;
  const endCol = colNum_(headers, 'End Time') - 1;
  const jobCol = colNum_(headers, 'Job') - 1;
  const ambassadorCol = colNum_(headers, 'Ambassador') - 1;
  const teacherCol = colNum_(headers, 'Ambassador Advisor') - 1;
  const tourCol = colNum_(headers, 'Tour ID') - 1;
  const statusCol = colNum_(headers, 'Status') - 1;

  const todayISO = toISODate(now);
  const todayRows = rows
    .filter(r => r[ambassadorCol] && toISODate(r[dateCol]) === todayISO && String(r[statusCol]).trim() !== 'Cancelled')
    .map(r => ({
      ambassador: r[ambassadorCol],
      teacher: r[teacherCol],
      job: r[jobCol],
      tour: r[tourCol],
      status: r[statusCol],
      start: combineDateAndTime_(r[dateCol], r[startCol]),
      end: combineDateAndTime_(r[dateCol], r[endCol])
    }))
    .sort((a, b) => a.start - b.start);

  const happeningNow = todayRows.filter(r => r.start <= now && now < r.end && r.status !== 'Completed' && r.status !== 'No-Show');
  const soonCutoff = new Date(now.getTime() + soonWindowMin * 60000);
  const startingSoon = todayRows.filter(r => r.start > now && r.start <= soonCutoff && r.status !== 'Cancelled' && r.status !== 'No-Show');

  let row = 1;
  row = writeTitle_(sheet, row, 'Live Ambassador Dashboard', '#1c4587');
  sheet.getRange(row, 1).setValue('Last refreshed: ' + Utilities.formatDate(now, tz, 'EEE, MMM d, yyyy h:mm:ss a'))
    .setFontStyle('italic').setFontColor('#666666');
  row += 2;

  row = writeSection_(sheet, row, 'Happening Now - go pull these students', happeningNow, '#cc0000', '#fce8e6');
  row += 1;
  row = writeSection_(sheet, row, 'Starting Soon (next ' + soonWindowMin + ' min)', startingSoon, '#e69138', '#fff2cc');
  row += 1;
  row = writeSection_(sheet, row, "Today's Full Schedule", todayRows, '#1c4587', '#e8f0fe');

  sheet.autoResizeColumns(1, 6);
  sheet.setColumnWidth(1, 150);
}

function writeTitle_(sheet, row, text, color) {
  sheet.getRange(row, 1).setValue(text).setFontSize(16).setFontWeight('bold').setFontColor(color);
  return row + 1;
}

function writeSection_(sheet, row, title, items, headerColor, bandColor) {
  sheet.getRange(row, 1).setValue(title).setFontSize(12).setFontWeight('bold').setFontColor(headerColor);
  row += 1;

  const tableHeaders = ['Ambassador', 'Advisor', 'Job', 'Tour', 'Start', 'End', 'Status'];
  sheet.getRange(row, 1, 1, tableHeaders.length).setValues([tableHeaders])
    .setFontWeight('bold').setBackground(headerColor).setFontColor('#ffffff');
  row += 1;

  if (items.length === 0) {
    sheet.getRange(row, 1).setValue(' - none - ').setFontStyle('italic').setFontColor('#999999');
    return row + 1;
  }

  const data = items.map(r => [r.ambassador, r.teacher, r.job, r.tour, formatTime_(r.start), formatTime_(r.end), r.status]);
  const range = sheet.getRange(row, 1, data.length, tableHeaders.length);
  range.setValues(data);
  range.setBackground(bandColor);
  return row + data.length;
}
