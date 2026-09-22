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

/** Initials known from the schedule PDF and confirmed by the office. */
const SEEDED_TEACHER_INITIALS_ = {
  'Chantilly': 'CB',
  'Carrie': 'CN',
  'Mo': 'MN',
  'Oliver': 'OC',
  'Sharyn': 'SHA',
  'Janet': 'JAN',
  'Mary Katherine': 'MK'
};

/** Rooms, not people - these look like initials but never are. */
const NOT_INITIALS_ = /^(M\d{3}|L\d{3}|TSAC|PAPAS|Charlton|Thompson|Auditorium)$/;

const SCHEDULE_WORDS_ = ['Hum', 'Math', 'Science', 'PE', 'Art', 'Music', 'Choices', 'Lunch', 'Recess',
  'Morning', 'Homeroom', 'MS', 'Meeting', 'IWP', 'Majors', 'Electives', 'Affinity', 'Groups', 'Olympic',
  'Teams', 'Dance', 'Drama', 'Instrumental', 'Portfolio', 'Vocal', 'Room', 'Modern', 'Band', 'Animation',
  'Ensemble', 'Movement', 'Lab', 'Storytelling', 'Mix', 'Up', 'Ceramics', 'Photography', 'Production',
  'French', 'Mandarin', 'Spanish', 'A', 'B', 'C', 'As', 'Bs', 'Cs', 'CAP', 'Period', 'Activity',
  'unclear', 'from', 'PDF', 'verify', 'locally', 'long', 'block', 'student', 'choice', 'confirm', 'which'];

/**
 * Teacher initials inside one schedule block, e.g. "Hum As ES+SdB
 * M107+M108" -> ['ES', 'SdB']. Co-taught blocks join them with + or /.
 */
function extractInitials_(text) {
  const found = [];
  String(text || '').split(/[\s(),:]+/).forEach(token => {
    const trimmed = token.trim();
    if (!trimmed || NOT_INITIALS_.test(trimmed) || SCHEDULE_WORDS_.indexOf(trimmed) !== -1) return;
    trimmed.split(/[+\/]/).forEach(part => {
      if (/^[A-Z][A-Za-z]{0,3}$/.test(part) &&
          SCHEDULE_WORDS_.indexOf(part) === -1 &&
          found.indexOf(part) === -1) {
        found.push(part);
      }
    });
  });
  return found;
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

/**
 * Which class an ambassador is missing during a tour, and who teaches it.
 *
 * Returns {block, teachers: [{initials, name, email}], unresolved: [initials],
 * ambiguous: bool}. Ambiguous means the block is a parallel-group period,
 * so the teachers listed are candidates rather than one answer.
 */
function findMissedClass_(pod, dateVal, startMin, endMin) {
  const dayName = WEEKDAY_NAMES_[dateVal.getDay()];
  const schedule = getBellSchedule_();
  const daySchedule = schedule[dayName];
  if (!daySchedule || !daySchedule[pod]) return null;

  const overlapping = daySchedule[pod]
    .map(b => ({ b: b, s: timeToMinutes_(b.start), e: timeToMinutes_(b.end) }))
    .filter(x => x.s != null && x.e != null && x.s < endMin && startMin < x.e)
    .sort((x, y) => x.s - y.s);
  if (overlapping.length === 0) return null;

  const byInitials = getTeacherByInitials_();
  const results = [];
  overlapping.forEach(x => {
    const text = x.b.text;
    // Homeroom, lunch and recess have no class teacher to notify.
    if (/Morning Homeroom|MS Meeting|Lunch|Recess|IWP/.test(text)) return;

    const initialsList = x.b.initials && x.b.initials.length
      ? x.b.initials
      : extractInitials_(text);
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
