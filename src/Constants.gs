/**
 * Central configuration: sheet names, headers, statuses.
 * Keep this as the single source of truth so setup and every
 * other module stay in sync.
 */

const SHEETS = {
  AMBASSADORS: 'Ambassadors',
  JOBS: 'Jobs',
  ELIGIBILITY: 'Eligibility',
  TOURS: 'Tours',
  TOUR_ROUTES: 'Tour Routes',
  TOURING_STUDENTS: 'Touring Students',
  ASSIGNMENTS: 'Assignments',
  TEACHERS: 'Teachers',
  BELL_SCHEDULE: 'Bell Schedule',
  MEETINGS: 'Meetings',
  LOCKER_SLIPS: 'Locker Slips',
  DASHBOARD: 'Dashboard',
  SETTINGS: 'Settings'
};

const HEADERS = {};
HEADERS[SHEETS.AMBASSADORS] = ['First Name', 'Last Name', 'Student Email', 'Grade', 'Homeroom Pod',
  'Split', 'Advisor', 'Language', 'Borough', 'Gender',
  'Parent 1 Name', 'Parent 1 Email', 'Parent 2 Name', 'Parent 2 Email', 'Active',
  'Total Tours', 'Jobs Breakdown', 'Last Tour Date', 'Notes'];
HEADERS[SHEETS.JOBS] = ['Job Name', 'Description', 'Active'];
HEADERS[SHEETS.TOURS] = ['Tour ID', 'Date', 'Start Time', 'End Time', 'Visiting School / Group', 'Contact Name', 'Contact Email', 'Grade Level', '# of Visitors', 'Jobs Filled', 'Roles Filled', 'Status', 'Notes'];
HEADERS[SHEETS.TOUR_ROUTES] = ['Route', 'Direction', 'Humanities Teacher', 'Language', 'Itinerary'];
HEADERS[SHEETS.TOURING_STUDENTS] = ['Tour ID', 'First Name', 'Last Name', 'Grade', 'Borough', 'Gender', 'Route', 'School', 'Allergies / Medical Notes', 'Chaperone Name', 'Chaperone Contact', 'Notes'];
HEADERS[SHEETS.ASSIGNMENTS] = ['Assignment ID', 'Tour ID', 'Date', 'Start Time', 'End Time', 'Job', 'Ambassador', 'Ambassador Advisor', 'Touring Student', 'Status', 'Notes'];
HEADERS[SHEETS.TEACHERS] = ['Teacher Name', 'Initials', 'Teacher Email', 'Room / Notes'];
HEADERS[SHEETS.BELL_SCHEDULE] = ['Day', 'Homeroom Pod', 'Start', 'End', 'What / Teacher / Room', 'Teacher Initials'];
HEADERS[SHEETS.MEETINGS] = ['Meeting ID', 'Date', 'Start Time', 'End Time', 'Students', 'Purpose', 'Location', 'Classes Missed', 'Status', 'Notes'];
HEADERS[SHEETS.SETTINGS] = ['Setting', 'Value'];

const TOUR_STATUSES = ['Scheduled', 'Completed', 'Cancelled'];
const ASSIGNMENT_STATUSES = ['Scheduled', 'Completed', 'No-Show', 'Cancelled'];
const YES_NO = ['Yes', 'No'];

const BOROUGH_CODES = ['M', 'B', 'Q', 'X', 'S', 'J'];
const BOROUGH_NAMES = { M: 'Manhattan', B: 'Brooklyn', Q: 'Queens', X: 'Bronx', S: 'Staten Island', J: 'New Jersey' };
const BOROUGH_LEGEND = BOROUGH_CODES.map(c => c + ' = ' + BOROUGH_NAMES[c]).join('\n');

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Other'];

// The language a student takes, and which room that class meets in. The
// schedule prints the language period as all three options at once
// ("French - M207 Mandarin - M208 Spanish - M209"), so this column is
// what turns that into one class and one teacher to email.
const LANGUAGE_OPTIONS = ['French', 'Mandarin', 'Spanish'];
const LANGUAGE_ROOMS_ = { French: 'M207', Mandarin: 'M208', Spanish: 'M209' };

// A few pods split in half for some periods, with the two halves swapping
// subjects. The schedule names both halves but never which one a given
// student is in, so this column supplies it. Blank is fine - the tool then
// reports both options instead of guessing.
const SPLIT_OPTIONS = ['1', '2'];

const TOUR_JOBS = { PANELIST: 'Panelist', LOBBY_GREETER: 'Lobby Greeter', TABLE_GREETER: 'Table Greeter', TOUR_GUIDE: 'Tour Guide' };

const DEFAULT_SETTINGS = [
  ['School Name', 'Our School'],
  ['Email Sender Name', 'Tour & Ambassador Program'],
  ['Weekly Email Day', 'Monday'],
  ['Weekly Email Hour (0-23)', '6'],
  ['Weekly Email Lookahead Days', '7'],
  ['Dashboard "Starting Soon" Window (minutes)', '15'],
  ['Tour Start Time', '08:30'],
  ['Tour End Time', '09:25'],
  ['Ambassadors Report To', 'the cafeteria'],
  ['Ambassadors Report At', '8:25 AM'],
  ['Lobby Greeters Needed', '3'],
  ['Table Greeters Needed', '2'],
  ['Panelists Needed', '5'],
  ['Tour Guides Per Visiting Student', '2'],
  ['Max Families Per Route', '1']
];

/** How many ambassadors each event-wide role needs, from Settings. */
function jobsNeeded_() {
  const needed = {};
  needed[TOUR_JOBS.LOBBY_GREETER] = Number(getSetting('Lobby Greeters Needed', 3)) || 3;
  needed[TOUR_JOBS.TABLE_GREETER] = Number(getSetting('Table Greeters Needed', 2)) || 2;
  needed[TOUR_JOBS.PANELIST] = Number(getSetting('Panelists Needed', 5)) || 5;
  return needed;
}

const HANDLER_WEEKLY_EMAIL = 'sendWeeklyTeacherEmails';
const HANDLER_DASHBOARD_REFRESH = 'refreshDashboard';
const HANDLER_TOUR_REMINDERS = 'sendUpcomingTourReminders';
