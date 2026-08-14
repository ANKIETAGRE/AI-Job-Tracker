function runJobTracker() {

  Logger.log("===== AI JOB TRACKER =====");

  getLatestEmails();

  updateDashboard();

}

function installSpreadsheetOpenTrigger() {

  const SPREADSHEET_ID =
    "Your google sheet id";

  // Remove old onOpen triggers
  ScriptApp.getProjectTriggers().forEach(trigger => {

    if (trigger.getHandlerFunction() === "onOpen") {
      ScriptApp.deleteTrigger(trigger);
    }

  });

  // Create correct spreadsheet-open trigger
  ScriptApp
    .newTrigger("onOpen")
    .forSpreadsheet(SPREADSHEET_ID)
    .onOpen()
    .create();

  Logger.log("✅ onOpen trigger created for AI Job Tracker.");
}
