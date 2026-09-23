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
