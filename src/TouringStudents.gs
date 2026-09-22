/**
 * Info about visiting/touring students (not ambassadors) tied to a Tour.
 */

function addTouringStudent(data) {
  const sheet = getOrCreateSheet(SHEETS.TOURING_STUDENTS);
  const headers = HEADERS[SHEETS.TOURING_STUDENTS];
  if (!data.tourId) throw new Error('A tour must be selected.');
  if (!data.firstName) throw new Error('First name is required.');

  const row = headers.map(h => {
    switch (h) {
      case 'Tour ID': return data.tourId;
      case 'First Name': return data.firstName || '';
      case 'Last Name': return data.lastName || '';
      case 'Grade': return data.grade || '';
      case 'Borough': return data.borough || '';
      case 'Gender': return data.gender || '';
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
