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
  TOURING_STUDENTS: 'Touring Students',
  ASSIGNMENTS: 'Assignments',
  TEACHERS: 'Teachers',
  DASHBOARD: 'Dashboard',
  SETTINGS: 'Settings'
};

const HEADERS = {};
HEADERS[SHEETS.AMBASSADORS] = ['First Name', 'Last Name', 'Grade', 'Homeroom Pod', 'Borough', 'Gender',
  'Parent 1 Name', 'Parent 1 Email', 'Parent 2 Name', 'Parent 2 Email', 'Teacher', 'Student Email', 'Active',
  'Total Tours', 'Last Tour Date', 'Notes'];
HEADERS[SHEETS.JOBS] = ['Job Name', 'Description', 'Active'];
HEADERS[SHEETS.TOURS] = ['Tour ID', 'Date', 'Start Time', 'End Time', 'Visiting School / Group', 'Contact Name', 'Contact Email', 'Grade Level', '# of Visitors', 'Status', 'Notes'];
HEADERS[SHEETS.TOURING_STUDENTS] = ['Tour ID', 'First Name', 'Last Name', 'Grade', 'Borough', 'Gender', 'School', 'Allergies / Medical Notes', 'Chaperone Name', 'Chaperone Contact', 'Notes'];
HEADERS[SHEETS.ASSIGNMENTS] = ['Assignment ID', 'Tour ID', 'Date', 'Start Time', 'End Time', 'Job', 'Ambassador', 'Ambassador Teacher', 'Touring Student', 'Status', 'Notes'];
HEADERS[SHEETS.TEACHERS] = ['Teacher Name', 'Teacher Email', 'Room / Notes'];
HEADERS[SHEETS.SETTINGS] = ['Setting', 'Value'];

const TOUR_STATUSES = ['Scheduled', 'Completed', 'Cancelled'];
const ASSIGNMENT_STATUSES = ['Scheduled', 'Completed', 'No-Show', 'Cancelled'];
const YES_NO = ['Yes', 'No'];

const BOROUGH_CODES = ['M', 'B', 'Q', 'X', 'S', 'J'];
const BOROUGH_NAMES = { M: 'Manhattan', B: 'Brooklyn', Q: 'Queens', X: 'Bronx', S: 'Staten Island', J: 'New Jersey' };
const BOROUGH_LEGEND = BOROUGH_CODES.map(c => c + ' = ' + BOROUGH_NAMES[c]).join('\n');

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Other'];

const TOUR_JOBS = { PANELIST: 'Panelist', LOBBY_GREETER: 'Lobby Greeter', TABLE_GREETER: 'Table Greeter', TOUR_GUIDE: 'Tour Guide' };

const DEFAULT_SETTINGS = [
  ['School Name', 'Our School'],
  ['Email Sender Name', 'Tour & Ambassador Program'],
  ['Weekly Email Day', 'Monday'],
  ['Weekly Email Hour (0-23)', '6'],
  ['Weekly Email Lookahead Days', '7'],
  ['Dashboard "Starting Soon" Window (minutes)', '15']
];

const HANDLER_WEEKLY_EMAIL = 'sendWeeklyTeacherEmails';
const HANDLER_DASHBOARD_REFRESH = 'refreshDashboard';
