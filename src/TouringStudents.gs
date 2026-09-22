/**
 * Info about visiting/touring students (not ambassadors) tied to a Tour.
 */

function addTouringStudent(data) {
  const sheet = getOrCreateSheet(SHEETS.TOURING_STUDENTS);
  const headers = HEADERS[SHEETS.TOURING_STUDENTS];
  if (!data.tourId) throw new Error('A tour must be selected.');
  if (!data.firstName) throw new Error('First name is required.');

  if (data.route) {
    const taken = getRouteAvailability(data.tourId).find(r => r.route === data.route);
    if (taken && taken.taken) {
      throw new Error('Route ' + data.route + ' is already assigned to ' + taken.takenBy + ' for this tour.');
    }
  }

  const row = headers.map(h => {
    switch (h) {
      case 'Tour ID': return data.tourId;
      case 'First Name': return data.firstName || '';
      case 'Last Name': return data.lastName || '';
      case 'Grade': return data.grade || '';
      case 'Borough': return data.borough || '';
      case 'Gender': return data.gender || '';
      case 'Route': return data.route || '';
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
    if (route) takenBy[route] = fullName_(r[firstCol], r[lastCol]);
  });

  return TOUR_ROUTE_NUMBERS.map(route => ({
    route: route,
    taken: !!takenBy[route],
    takenBy: takenBy[route] || ''
  }));
}
