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
