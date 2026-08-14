function saveApplication(result, messageId) {

  // ==========================================
  // SAFETY CHECK
  // ==========================================

  if (!result || typeof result !== "object") {

    Logger.log(
      "saveApplication: Invalid or missing result."
    );

    return;
  }

  if (!result.company) {

    Logger.log(
      "saveApplication: Company is missing."
    );

    return;
  }


  // ==========================================
  // OPEN SHEET
  // ==========================================

  const ss =
    SpreadsheetApp.openById(
      CONFIG.SHEET_ID
    );

  const sheet =
    ss.getSheetByName(
      CONFIG.SHEET_NAME
    );

  if (!sheet) {

    throw new Error(
      "Sheet not found: " +
      CONFIG.SHEET_NAME
    );
  }


  const lastRow =
    sheet.getLastRow();


  // ==========================================
  // COLUMN MAP
  // ==========================================

  const COL = {

    ID: 1,
    COMPANY: 2,
    ROLE: 3,
    APPLIED_DATE: 4,
    STATUS: 5,
    LAST_UPDATE: 6,
    SOURCE: 7,
    RECRUITER_EMAIL: 8,
    LAST_EMAIL_SUBJECT: 9,
    NEXT_ACTION: 10,
    REMINDER_DATE: 11,
    INTERVIEW_DATE: 12,
    DEADLINE: 13,
    PRIORITY: 14,
    LOCATION: 15,
    NOTES: 16,
    JOB_LINK: 17,
    PROCESSED: 18

  };


  // ==========================================
  // CLEAN VALUES
  // ==========================================

  const company =
    cleanValue(result.company);

  const role =
    cleanValue(result.role);

  const status =
    normalizeStatus(
      result.status || ""
    );

  const recruiterEmail =
    cleanValue(
      result.recruiter_email
    );

  const subject =
    cleanValue(
      result.last_email_subject
    );

  const nextAction =
    cleanValue(
      result.next_action
    );

  const deadline =
    cleanValue(
      result.deadline
    );

  const interviewDate =
    cleanValue(
      result.interview_date
    );

  const location =
    cleanValue(
      result.location
    );

  const notes =
    cleanValue(
      result.summary
    );


  if (!company) {

    Logger.log(
      "No company found. Application not saved."
    );

    return;
  }


  // ==========================================
  // SOURCE
  // ==========================================

  const source =
    getSourceFromEmail(
      recruiterEmail
    );


  // ==========================================
  // READ EXISTING DATA
  // ==========================================

  let data = [];

  if (lastRow >= 2) {

    data =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          18
        )
        .getValues();
  }


  // ==========================================
  // FIND EXISTING APPLICATION
  // ==========================================

  let existingRow = -1;

  for (
    let i = 0;
    i < data.length;
    i++
  ) {

    const existingCompany =
      cleanValue(
        data[i][COL.COMPANY - 1]
      );

    const existingRole =
      cleanValue(
        data[i][COL.ROLE - 1]
      );


    // Company + matching role

    if (
      company.toLowerCase() ===
      existingCompany.toLowerCase()
      &&
      isUsefulRole(role)
      &&
      isUsefulRole(existingRole)
      &&
      role.toLowerCase() ===
      existingRole.toLowerCase()
    ) {

      existingRow = i + 2;

      break;
    }


    // Same company + missing new role

    if (
      company.toLowerCase() ===
      existingCompany.toLowerCase()
      &&
      !isUsefulRole(role)
    ) {

      existingRow = i + 2;

      break;
    }


    // Same company + missing old role

    if (
      company.toLowerCase() ===
      existingCompany.toLowerCase()
      &&
      !isUsefulRole(existingRole)
    ) {

      existingRow = i + 2;

      break;
    }
  }


  // ==========================================
  // UPDATE EXISTING
  // ==========================================

  if (existingRow !== -1) {

    Logger.log(
      "Updating existing application: Row " +
      existingRow
    );

    const row =
      sheet
        .getRange(
          existingRow,
          1,
          1,
          18
        )
        .getValues()[0];


    // Company

    if (
      !isUsefulValue(
        row[COL.COMPANY - 1]
      )
    ) {

      row[COL.COMPANY - 1] =
        company;
    }


    // Role
    // Never replace a real role with
    // "Not specified"

    if (
      isUsefulRole(role)
    ) {

      row[COL.ROLE - 1] =
        role;
    }


    // Status

    if (status) {

      row[COL.STATUS - 1] =
        status;
    }


    // Last update

    row[COL.LAST_UPDATE - 1] =
      new Date();


    // Source

    if (
      isUsefulValue(source)
    ) {

      row[COL.SOURCE - 1] =
        source;
    }


    // Recruiter

    if (
      isUsefulValue(recruiterEmail)
    ) {

      row[COL.RECRUITER_EMAIL - 1] =
        recruiterEmail;
    }


    // Subject

    if (
      isUsefulValue(subject)
    ) {

      row[COL.LAST_EMAIL_SUBJECT - 1] =
        subject;
    }


    // Next action

    if (
      isUsefulValue(nextAction)
    ) {

      row[COL.NEXT_ACTION - 1] =
        nextAction;
    }


    // Interview date

    if (
      isUsefulValue(interviewDate)
    ) {

      row[COL.INTERVIEW_DATE - 1] =
        parseDateValue(
          interviewDate
        );
    }


    // Deadline

    if (
      isUsefulValue(deadline)
    ) {

      row[COL.DEADLINE - 1] =
        parseDateValue(
          deadline
        );
    }


    // Location

    if (
      isUsefulValue(location)
    ) {

      row[COL.LOCATION - 1] =
        location;
    }


    // Notes

    if (
      isUsefulValue(notes)
    ) {

      row[COL.NOTES - 1] =
        notes;
    }


    // Processed Gmail message

    row[COL.PROCESSED - 1] =
      messageId;


    sheet
      .getRange(
        existingRow,
        1,
        1,
        18
      )
      .setValues([row]);


    Logger.log(
      "Application updated successfully."
    );

    return;
  }


  // ==========================================
  // CREATE NEW APPLICATION
  // ==========================================

  const applicationId =
    generateApplicationId(
      sheet
    );


  const newRow = [

    applicationId,
    company,
    isUsefulRole(role)
      ? role
      : "",
    new Date(),
    status ||
      "Application Received",
    new Date(),
    source || "",
    recruiterEmail || "",
    subject || "",
    nextAction || "",
    "",
    interviewDate
      ? parseDateValue(
          interviewDate
        )
      : "",
    deadline
      ? parseDateValue(
          deadline
        )
      : "",
    "Medium",
    location || "",
    notes || "",
    result.job_link || "",
    messageId

  ];


  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      1,
      18
    )
    .setValues([
      newRow
    ]);


  Logger.log(
    "New application saved: " +
    applicationId
  );
}
function cleanValue(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .trim();
}
function isUsefulValue(value) {

  const v =
    cleanValue(value)
      .toLowerCase();

  if (!v) {
    return false;
  }

  if (
    v === "not specified" ||
    v === "not available" ||
    v === "unknown" ||
    v === "n/a" ||
    v === "null" ||
    v === "undefined"
  ) {
    return false;
  }

  return true;
}
function isUsefulRole(role) {

  const v =
    cleanValue(role)
      .toLowerCase();

  if (!v) {
    return false;
  }

  const invalidRoles = [

    "not specified",
    "not available",
    "unknown",
    "n/a",
    "null",
    "undefined",
    "not mentioned",
    "not provided"

  ];

  return !invalidRoles.includes(v);
}
function getSourceFromEmail(email) {

  const value =
    cleanValue(email)
      .toLowerCase();

  if (!value) {
    return "";
  }

  if (value.includes("foundit")) {
    return "Foundit";
  }

  if (value.includes("monster")) {
    return "Foundit";
  }

  if (value.includes("naukri")) {
    return "Naukri";
  }

  if (value.includes("indeed")) {
    return "Indeed";
  }

  if (value.includes("linkedin")) {
    return "LinkedIn";
  }

  if (value.includes("instahyre")) {
    return "Instahyre";
  }

  if (value.includes("unstop")) {
    return "Unstop";
  }

  return "";
}
function parseDateValue(value) {

  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return fixHistoricalYear(value);
  }

  let text = String(value).trim();

  // ISO date:
  // 2026-08-16T23:59:00+05:30
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {

    const date = new Date(text);

    if (!isNaN(date.getTime())) {
      return fixHistoricalYear(date);
    }
  }

  // DD/MM/YYYY
  const match =
    text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);

  if (match) {

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    let year = parseInt(match[3], 10);

    // If AI returned an obviously historical year,
    // use the current year.
    if (year < new Date().getFullYear()) {
      year = new Date().getFullYear();
    }

    return new Date(
      year,
      month,
      day
    );
  }

  // Try normal parsing
  const date = new Date(text);

  if (!isNaN(date.getTime())) {
    return fixHistoricalYear(date);
  }

  return text;
}


function fixHistoricalYear(date) {

  const currentYear =
    new Date().getFullYear();

  // Job deadlines should not normally be
  // years in the past.
  if (date.getFullYear() < currentYear) {

    return new Date(
      currentYear,
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    );
  }

  return date;
}
function generateApplicationId(sheet) {

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return "APP-0001";
  }

  const ids =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        1
      )
      .getValues()
      .flat();

  let maxNumber = 0;

  ids.forEach(id => {

    const match =
      String(id)
        .match(/APP-(\d+)/);

    if (match) {

      const number =
        parseInt(
          match[1],
          10
        );

      if (number > maxNumber) {
        maxNumber = number;
      }
    }
  });

  return (
    "APP-" +
    String(maxNumber + 1)
      .padStart(4, "0")
  );
}
function fixExistingDeadlines() {

  const sheet = getSheet();

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log("No application rows found.");
    return;
  }

  // Column M = Deadline
  const range = sheet.getRange(
    2,
    13,
    lastRow - 1,
    1
  );

  const values = range.getValues();

  const currentYear =
    new Date().getFullYear();

  let fixed = 0;

  for (let i = 0; i < values.length; i++) {

    const value = values[i][0];

    if (!value) {
      continue;
    }

    let date = null;

    if (value instanceof Date) {

      date = new Date(value);

    } else {

      const text =
        String(value).trim();

      const match =
        text.match(
          /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
        );

      if (match) {

        const day =
          parseInt(match[1], 10);

        const month =
          parseInt(match[2], 10) - 1;

        const year =
          parseInt(match[3], 10);

        date = new Date(
          year,
          month,
          day,
          23,
          59,
          59
        );

      } else {

        const parsed =
          new Date(text);

        if (!isNaN(parsed.getTime())) {
          date = parsed;
        }
      }
    }

    if (!date || isNaN(date.getTime())) {
      continue;
    }

    // Fix obviously incorrect historical years
    if (
      date.getFullYear() < currentYear
    ) {

      const corrected =
        new Date(
          currentYear,
          date.getMonth(),
          date.getDate(),
          date.getHours(),
          date.getMinutes(),
          date.getSeconds()
        );

      values[i][0] = corrected;

      fixed++;

      Logger.log(
        "Fixed deadline row " +
        (i + 2) +
        ": " +
        date +
        " → " +
        corrected
      );
    }
  }

  range.setValues(values);

  Logger.log(
    "Deadlines fixed: " +
    fixed
  );
}
function removeDuplicateApplications() {

  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log("No application data found.");
    return;
  }

  const data = sheet
    .getRange(2, 1, lastRow - 1, 18)
    .getValues();

  const groups = {};
  const rowsToDelete = [];

  // ==========================================
  // GROUP BY COMPANY + ROLE
  // Deadline is NOT used.
  // This allows older emails for the same
  // application to update the same record.
  // ==========================================

  for (let i = 0; i < data.length; i++) {

    const company =
      String(data[i][1] || "")
        .trim()
        .toLowerCase();

    if (!company) continue;

    let role =
      String(data[i][2] || "")
        .trim()
        .toLowerCase();

    // Treat blank / not specified role
    // as the same application
    if (
      role === "" ||
      role === "not specified" ||
      role === "not specified role"
    ) {
      role = "";
    }

    const key =
      company + "|" + role;

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(i);
  }


  // ==========================================
  // KEEP ONLY THE LATEST RECORD
  // ==========================================

  Object.keys(groups).forEach(key => {

    const indexes = groups[key];

    if (indexes.length <= 1) {
      return;
    }

    let keepIndex = indexes[0];

    for (let j = 1; j < indexes.length; j++) {

      const currentIndex = indexes[j];

      const keepDate =
        data[keepIndex][5] instanceof Date
          ? data[keepIndex][5].getTime()
          : 0;

      const currentDate =
        data[currentIndex][5] instanceof Date
          ? data[currentIndex][5].getTime()
          : 0;

      if (currentDate > keepDate) {
        keepIndex = currentIndex;
      }
    }


    indexes.forEach(index => {

      if (index !== keepIndex) {

        rowsToDelete.push(
          index + 2
        );

      }

    });

  });


  // ==========================================
  // DELETE FROM BOTTOM TO TOP
  // ==========================================

  rowsToDelete
    .sort((a, b) => b - a)
    .forEach(rowNumber => {

      Logger.log(
        "Deleting duplicate row: " +
        rowNumber
      );

      sheet.deleteRow(rowNumber);

    });


  Logger.log(
    "Duplicate rows removed: " +
    rowsToDelete.length
  );
}
function fixBoldAnalyticsDuplicates() {

  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log("No data found.");
    return;
  }

  const data = sheet
    .getRange(2, 1, lastRow - 1, 18)
    .getValues();

  const boldRows = [];

  for (let i = 0; i < data.length; i++) {

    const company =
      String(data[i][1] || "")
        .trim()
        .toLowerCase();

    if (company === "bold analytics") {

      boldRows.push({
        sheetRow: i + 2,
        lastUpdate: data[i][5]
      });

    }
  }

  Logger.log(
    "Bold Analytics rows found: " +
    boldRows.length
  );

  if (boldRows.length <= 1) {
    Logger.log("No duplicates.");
    return;
  }


  // Find newest row
  let keepRow = boldRows[0].sheetRow;
  let keepTime =
    boldRows[0].lastUpdate instanceof Date
      ? boldRows[0].lastUpdate.getTime()
      : 0;

  for (let i = 1; i < boldRows.length; i++) {

    const currentTime =
      boldRows[i].lastUpdate instanceof Date
        ? boldRows[i].lastUpdate.getTime()
        : 0;

    if (currentTime > keepTime) {

      keepTime = currentTime;
      keepRow = boldRows[i].sheetRow;

    }
  }


  Logger.log(
    "Keeping newest row: " +
    keepRow
  );


  // Delete from bottom to top
  const deleteRows =
    boldRows
      .filter(item =>
        item.sheetRow !== keepRow
      )
      .map(item =>
        item.sheetRow
      )
      .sort((a, b) => b - a);


  deleteRows.forEach(rowNumber => {

    Logger.log(
      "Deleting row: " +
      rowNumber
    );

    sheet.deleteRow(rowNumber);

  });


  Logger.log(
    "Bold Analytics duplicates removed: " +
    deleteRows.length
  );
}
