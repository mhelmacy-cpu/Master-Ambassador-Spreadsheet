/**
 * Installable trigger management for the weekly teacher email
 * and (optional) periodic dashboard auto-refresh.
 */

const WEEKDAY_MAP = {
  monday: ScriptApp.WeekDay.MONDAY,
  tuesday: ScriptApp.WeekDay.TUESDAY,
  wednesday: ScriptApp.WeekDay.WEDNESDAY,
  thursday: ScriptApp.WeekDay.THURSDAY,
  friday: ScriptApp.WeekDay.FRIDAY,
  saturday: ScriptApp.WeekDay.SATURDAY,
  sunday: ScriptApp.WeekDay.SUNDAY
};

function deleteTriggersFor_(handlerName) {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === handlerName)
    .forEach(t => ScriptApp.deleteTrigger(t));
}

function enableWeeklyEmailTrigger() {
  deleteTriggersFor_(HANDLER_WEEKLY_EMAIL);
  const day = String(getSetting('Weekly Email Day', 'Monday')).trim().toLowerCase();
  const hour = Number(getSetting('Weekly Email Hour (0-23)', 6)) || 6;
  const weekDay = WEEKDAY_MAP[day] || ScriptApp.WeekDay.MONDAY;

  ScriptApp.newTrigger(HANDLER_WEEKLY_EMAIL)
    .timeBased()
    .onWeekDay(weekDay)
    .atHour(hour)
    .create();

  SpreadsheetApp.getUi().alert('Weekly teacher emails will now send every ' +
    capitalize_(day) + ' around ' + hour + ':00. Change "Weekly Email Day/Hour" on the Settings sheet ' +
    'and re-run this to reschedule.');
}

function disableWeeklyEmailTrigger() {
  deleteTriggersFor_(HANDLER_WEEKLY_EMAIL);
  SpreadsheetApp.getUi().alert('Weekly teacher emails are turned off.');
}

function enableDashboardAutoRefresh() {
  deleteTriggersFor_(HANDLER_DASHBOARD_REFRESH);
  ScriptApp.newTrigger(HANDLER_DASHBOARD_REFRESH)
    .timeBased()
    .everyMinutes(10)
    .create();
  SpreadsheetApp.getUi().alert('The Dashboard will now auto-refresh every 10 minutes.');
}

function disableDashboardAutoRefresh() {
  deleteTriggersFor_(HANDLER_DASHBOARD_REFRESH);
  SpreadsheetApp.getUi().alert('Dashboard auto-refresh is turned off. Use "Refresh Dashboard Now" or reopen the sheet.');
}

function capitalize_(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---- Tour-day reminders: Monday PM, Tuesday PM, Wednesday AM ---- */

/**
 * Each of the three sends covers whichever tour is coming up, so the
 * Monday and Tuesday runs reach ahead to Wednesday while the Wednesday
 * run catches the tour happening that morning.
 */
function sendUpcomingTourReminders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today.getTime() + 7 * 86400000);

  const headers = HEADERS[SHEETS.TOURS];
  const { rows } = readSheet(SHEETS.TOURS);
  const idCol = colNum_(headers, 'Tour ID') - 1;
  const dateCol = colNum_(headers, 'Date') - 1;
  const statusCol = colNum_(headers, 'Status') - 1;

  const upcoming = rows.filter(r => {
    if (!r[idCol] || String(r[statusCol]).trim() === 'Cancelled') return false;
    const d = toDate_(r[dateCol]);
    return d && d >= today && d < horizon;
  });

  const results = [];
  upcoming.forEach(r => {
    try {
      results.push({ tourId: r[idCol], result: sendTourDayEmails(r[idCol]) });
    } catch (err) {
      // An unstaffed tour throws rather than mailing nobody; that is not
      // a failure worth stopping the other tours for.
      Logger.log('Tour reminder skipped for ' + r[idCol] + ': ' + err.message);
    }
  });
  return results;
}

function enableTourReminders() {
  deleteTriggersFor_(HANDLER_TOUR_REMINDERS);
  [
    { day: ScriptApp.WeekDay.MONDAY, hour: 14 },
    { day: ScriptApp.WeekDay.TUESDAY, hour: 14 },
    { day: ScriptApp.WeekDay.WEDNESDAY, hour: 6 }
  ].forEach(slot => {
    ScriptApp.newTrigger(HANDLER_TOUR_REMINDERS)
      .timeBased()
      .onWeekDay(slot.day)
      .atHour(slot.hour)
      .create();
  });
  SpreadsheetApp.getUi().alert('Tour reminders are on. Students, advisors and class teachers will ' +
    'be emailed about any tour in the coming week on Monday afternoon, Tuesday afternoon, and ' +
    'Wednesday morning.\n\nA tour that has not been staffed yet is skipped, so staff the tour ' +
    'before Monday afternoon for the first send to go out.');
}

function disableTourReminders() {
  deleteTriggersFor_(HANDLER_TOUR_REMINDERS);
  SpreadsheetApp.getUi().alert('Tour reminders are turned off.');
}

/** Lightweight onEdit: keep the dashboard current when Assignments changes. */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sheetName = e.range.getSheet().getName();
    if (sheetName === SHEETS.ASSIGNMENTS) {
      refreshDashboard();
    }
  } catch (err) {
    // Never let a UI-less trigger error surface to the user.
  }
}
