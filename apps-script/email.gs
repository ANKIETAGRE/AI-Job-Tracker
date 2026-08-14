function sendDailySummary() {

  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  let total = 0;

  const stats = {};

  let deadlines = "";
  let interviews = "";
  let waiting = "";

  const today = new Date();

  // Prevent duplicate entries
  const seenDeadlines = new Set();
  const seenInterviews = new Set();
  const seenWaiting = new Set();


  // ==========================================
  // READ APPLICATIONS
  // ==========================================

  for (let i = 1; i < data.length; i++) {

    if (!data[i][1]) continue;

    total++;

    const company = data[i][1];
    const status = data[i][4] || "";
    const appliedDate = data[i][3];
    const interviewDate = data[i][11];
    const deadline = data[i][12];
    const nextAction = data[i][9] || "";
    const role = data[i][2] || "";


    // ==========================================
    // STATUS COUNT
    // ==========================================

    stats[status] =
      (stats[status] || 0) + 1;


    // ==========================================
    // UPCOMING DEADLINE
    // ==========================================

    if (deadline) {

      const deadlineDate =
        parseDateForSummary(deadline);

      if (deadlineDate) {

        // Only future deadlines
        if (deadlineDate.getTime() >= today.getTime()) {

          const key =
            company.toLowerCase() +
            "|" +
            deadlineDate.getTime();

          if (!seenDeadlines.has(key)) {

            seenDeadlines.add(key);

            deadlines +=
              "• " + company +
              (role ? "\nRole: " + role : "") +
              "\nDeadline: " +
              formatSummaryDate(deadlineDate) +
              "\nAction: " +
              (nextAction || "No action specified") +
              "\n\n";
          }
        }
      }
    }


    // ==========================================
    // UPCOMING INTERVIEW
    // ==========================================

    if (interviewDate) {

      const interview =
        parseDateForSummary(interviewDate);

      if (interview) {

        if (interview.getTime() >= today.getTime()) {

          const key =
            company.toLowerCase() +
            "|" +
            interview.getTime();

          if (!seenInterviews.has(key)) {

            seenInterviews.add(key);

            interviews +=
              "• " + company +
              (role ? "\nRole: " + role : "") +
              "\nInterview: " +
              formatSummaryDate(interview) +
              "\n\n";
          }
        }
      }
    }


    // ==========================================
    // WAITING FOR RESPONSE
    // ==========================================

    if (appliedDate instanceof Date) {

      const diff =
        (today - appliedDate) /
        (1000 * 60 * 60 * 24);

      if (
        diff >= 14 &&
        status !== "Rejected" &&
        status !== "Offer" &&
        status !== "Closed"
      ) {

        const key =
          company.toLowerCase();

        if (!seenWaiting.has(key)) {

          seenWaiting.add(key);

          waiting +=
            "• " + company +
            (role ? " - " + role : "") +
            "\n";
        }
      }
    }

  }


  // ==========================================
  // EMAIL BODY
  // ==========================================

  const body = `📌 AI JOB TRACKER - Daily Summary

📊 Overview

Total Applications   : ${total}
Want to Apply        : ${stats["Want to Apply"] || 0}
Applied              : ${stats["Applied"] || 0}
Application Received : ${stats["Application Received"] || 0}
Resume Shortlisted   : ${stats["Resume Shortlisted"] || 0}
OA Received          : ${stats["OA Received"] || 0}
OA Submitted         : ${stats["OA Submitted"] || 0}
Technical Interview  : ${stats["Technical Interview"] || 0}
HR Interview         : ${stats["HR Interview"] || 0}
Offers               : ${stats["Offer"] || 0}
Rejected             : ${stats["Rejected"] || 0}

━━━━━━━━━━━━━━━━━━━━━━

⚠️ Upcoming Deadlines

${deadlines || "None"}

━━━━━━━━━━━━━━━━━━━━━━

🎤 Upcoming Interviews

${interviews || "None"}

━━━━━━━━━━━━━━━━━━━━━━

📬 Waiting for Response (>14 days)

${waiting || "None"}

━━━━━━━━━━━━━━━━━━━━━━

Generated automatically by AI Job Tracker.
`;


  // ==========================================
  // SEND EMAIL
  // ==========================================

  MailApp.sendEmail({

    to:
      Session.getActiveUser().getEmail(),

    subject:
      "📌 AI Job Tracker - Daily Summary",

    body:
      body

  });


  Logger.log(
    "Daily Summary Sent"
  );
}


function parseDateForSummary(value) {

  if (!value) {
    return null;
  }

  if (value instanceof Date) {

    if (!isNaN(value.getTime())) {
      return value;
    }

    return null;
  }

  const text =
    String(value).trim();

  // ISO date
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {

    const date =
      new Date(text);

    if (!isNaN(date.getTime())) {
      return date;
    }
  }


  // DD/MM/YYYY
  const match =
    text.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
    );

  if (match) {

    const day =
      parseInt(match[1], 10);

    const month =
      parseInt(match[2], 10) - 1;

    let year =
      parseInt(match[3], 10);

    // Fix AI returning old year
    if (
      year < new Date().getFullYear()
    ) {
      year =
        new Date().getFullYear();
    }

    return new Date(
      year,
      month,
      day,
      23,
      59,
      59
    );
  }


  const date =
    new Date(text);

  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}




function formatSummaryDate(date) {

  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    "dd MMM yyyy, hh:mm a"
  );
}
