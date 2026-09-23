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
