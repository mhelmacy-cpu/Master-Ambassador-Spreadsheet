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
