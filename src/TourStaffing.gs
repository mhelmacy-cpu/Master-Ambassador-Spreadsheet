/**
 * Suggests who should staff a tour's 4 roles, for staff to review and
 * confirm (never auto-saved without a human clicking Confirm).
 *
 * Panelist / Lobby Greeter / Table Greeter: one pick each, from
 * ambassadors who are eligible + active + free at the tour's time,
 * ranked by fairness (fewest Total Tours first) so duty rotates.
 *
 * Tour Guide: TOUR_GUIDES_PER_STUDENT (2) picks per touring student,
 * ranked by grade fit + borough fit, then fairness. Gender is a
 * constraint, not a weighted score: guide #1 is the best-fit candidate
 * whose gender matches the touring student's (when known and available);
 * guide #2 is simply the next-best-fit candidate of any gender. So a
 * boy touring might get one girl guide and one boy guide, or two boys —
 * never two guides picked without checking for at least one gender
 * match first.
 */

function suggestStaffingForTour(tourId) {
  const tour = getTourById_(tourId);
  if (!tour) throw new Error('Tour not found.');
  const dateVal = toDate_(tour.date);
  if (!dateVal || !tour.startTime || !tour.endTime) {
    throw new Error('This tour is missing a date/start/end time — add one on the Tours sheet first.');
  }
  const start = combineDateAndTime_(dateVal, tour.startTime);
  const end = combineDateAndTime_(dateVal, tour.endTime);

  const directory = getAmbassadorDirectory_();
  const { rows: assignmentRows } = readSheet(SHEETS.ASSIGNMENTS);
  const aCols = assignmentCols_();
  const usedThisPass = {};

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

  function pickBestSingle(job) {
    const ranked = availableFor(job).sort(byFairness);
    if (ranked.length === 0) return { chosen: null, alternates: [] };
    usedThisPass[ranked[0].name] = (usedThisPass[ranked[0].name] || 0) + 1;
    return { chosen: ranked[0].name, alternates: ranked.map(a => a.name) };
  }

  const singleRoles = {};
  [TOUR_JOBS.PANELIST, TOUR_JOBS.LOBBY_GREETER, TOUR_JOBS.TABLE_GREETER].forEach(job => {
    singleRoles[job] = pickBestSingle(job);
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

    const ranked = guidePool.slice().sort((x, y) => {
      const diff = fitScore(y) - fitScore(x);
      return diff !== 0 ? diff : byFairness(x, y);
    });

    if (ranked.length === 0) {
      return { studentName: s.name, route: s.route, guide1: null, guide2: null, alternates: [] };
    }

    const genderMatch = s.gender ? ranked.find(a => a.gender && a.gender === s.gender) : null;
    const guide1 = genderMatch || ranked[0];
    const guide2 = ranked.find(a => a.name !== guide1.name) || null;

    usedThisPass[guide1.name] = (usedThisPass[guide1.name] || 0) + 1;
    if (guide2) usedThisPass[guide2.name] = (usedThisPass[guide2.name] || 0) + 1;

    return {
      studentName: s.name,
      route: s.route,
      guide1: guide1.name,
      guide2: guide2 ? guide2.name : null,
      alternates: ranked.map(a => a.name)
    };
  });

  return {
    tourId: tourId,
    tourLabel: tour.group + ' — ' + formatDate_(dateVal) + ' ' + formatTime_(start) + '–' + formatTime_(end),
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

  tryAssign(TOUR_JOBS.PANELIST, selections.panelist);
  tryAssign(TOUR_JOBS.LOBBY_GREETER, selections.lobbyGreeter);
  tryAssign(TOUR_JOBS.TABLE_GREETER, selections.tableGreeter);
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
  const boroughCol = colNum_(headers, 'Borough') - 1;
  const genderCol = colNum_(headers, 'Gender') - 1;
  const activeCol = colNum_(headers, 'Active') - 1;
  const totalToursCol = colNum_(headers, 'Total Tours') - 1;

  return rows
    .filter(r => fullName_(r[firstCol], r[lastCol]).trim() !== '')
    .map(r => ({
      name: fullName_(r[firstCol], r[lastCol]),
      grade: parseGradeNum_(r[gradeCol]),
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
