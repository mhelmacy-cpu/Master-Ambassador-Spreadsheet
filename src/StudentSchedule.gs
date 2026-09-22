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

const SPLIT_MARKERS_ = ['French', 'Mandarin', 'Spanish', 'Majors', 'Electives',
  'confirm which', 'Choices', 'unclear', 'verify'];

/** True when the block names parallel groups instead of one definite class. */
function isSplitBlock_(text) {
  const t = String(text || '');
  if (SPLIT_MARKERS_.some(m => t.indexOf(m) !== -1)) return true;
  // "Math A", "Science B", "Hum As" - a lettered section of a larger course.
  return /\b(Math|Science|Hum|PE|Art|Music|Choices)\s+[ABC]s?\b/.test(t);
}

/**
 * Bell schedule rows, preferring the Bell Schedule sheet (so hand edits
 * stick) and falling back to the seeded data before first setup.
 */
function getBellSchedule_() {
  const byDayPod = {};
  const add = (day, pod, start, end, text) => {
    const dayKey = String(day).trim();
    const podKey = String(pod).trim();
    if (!dayKey || !podKey) return;
    if (!byDayPod[dayKey]) byDayPod[dayKey] = {};
    if (!byDayPod[dayKey][podKey]) byDayPod[dayKey][podKey] = [];
    byDayPod[dayKey][podKey].push({ start: start, end: end, text: text });
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
    rows.forEach(r => add(r[dayCol], r[podCol], r[startCol], r[endCol], r[whatCol]));
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
