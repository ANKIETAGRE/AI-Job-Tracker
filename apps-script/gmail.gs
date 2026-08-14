function getLatestEmails() {

  const query = "newer_than:7d";

  const threads = GmailApp.search(
    query,
    0,
    CONFIG.MAX_EMAILS
  );

  Logger.log("Threads Found : " + threads.length);

  threads.forEach(thread => {

    const messages = thread.getMessages();
    const message = messages[messages.length - 1];

    const messageId = message.getId();

    // =========================
    // ALREADY PROCESSED
    // =========================

    if (isProcessed(messageId)) {
      Logger.log("Already Processed");
      return;
    }

    const from = message.getFrom();
    const subject = message.getSubject();
    const body = message.getPlainBody().substring(0, 5000);
    const date = message.getDate();

    Logger.log("====================================");
    Logger.log("FROM    : " + from);
    Logger.log("SUBJECT : " + subject);
    Logger.log("DATE    : " + date);
    Logger.log("====================================");


    // ==================================================
    // STEP 1 — LOCAL CLASSIFIER
    // Does NOT use Gemini
    // ==================================================

    const localResult =
      classifySimpleEmail(subject, body, from);


    // ==================================================
    // SIMPLE EMAIL DETECTED
    // ==================================================

    if (localResult) {

      Logger.log(
        "LOCAL CLASSIFIER : " +
        localResult.status
      );

      localResult.recruiter_email = from;

      localResult.last_email_subject = subject;

      localResult.status =
        normalizeStatus(localResult.status);


      saveApplication(
        localResult,
        messageId
      );


      // Only creates event for interview statuses
      createInterviewEvent(localResult);


      Logger.log(
        "Application Processed Successfully (LOCAL)"
      );

      return;
    }


    // ==================================================
    // STEP 2 — EXISTING CLASSIFIER
    // ==================================================

    const type = classifyEmail(message);

    if (type === "IGNORE") {

      Logger.log(
        "Ignored by classifier"
      );

      return;
    }


    // ==================================================
    // STEP 3 — GEMINI
    // ==================================================

    const result =
      askGemini(subject, body);


    // ==================================================
    // GEMINI FAILED / QUOTA EXCEEDED
    // ==================================================

    if (!result) {

      Logger.log(
        "Gemini unavailable. Skipping email."
      );

      return;
    }


    // ==================================================
    // NOT JOB RELATED
    // ==================================================

    if (!result.is_job_related) {

      Logger.log(
        "Gemini marked this email as not job related."
      );

      return;
    }


    // ==================================================
    // SAVE GEMINI RESULT
    // ==================================================

    result.recruiter_email = from;

    result.last_email_subject = subject;

    result.status =
      normalizeStatus(result.status);


    saveApplication(
      result,
      messageId
    );


    createInterviewEvent(result);


    Logger.log(
      "Application Processed Successfully (GEMINI)"
    );

  });

}
function classifySimpleEmail(subject, body, from) {

  const text = (
    String(subject || "") +
    " " +
    String(body || "")
  ).toLowerCase();


  // =========================================
  // APPLICATION SUCCESSFUL / APPLIED
  // =========================================

  if (
    text.includes("application successful") ||
    text.includes("application submitted") ||
    text.includes("application confirmation") ||
    text.includes("successfully applied") ||
    text.includes("you've applied") ||
    text.includes("you have applied")
  ) {

    return {

      is_job_related: true,

      company: extractCompanyFromEmail(
        subject,
        from
      ),

      role: extractRoleFromEmail(
        subject,
        body
      ),

      status: "Applied",

      deadline: "",

      interview_date: "",

      next_action: "Application submitted",

      summary: "Application confirmation received."

    };
  }


  // =========================================
  // INTERVIEW
  // =========================================

  if (
    text.includes("start your ai interview") ||
    text.includes("ai interview") ||
    text.includes("interview scheduled") ||
    text.includes("interview invitation") ||
    text.includes("interview invite") ||
    text.includes("schedule your interview") ||
    text.includes("next step is an interview") ||
    (
      text.includes("next step is a brief") &&
      text.includes("interview")
    )
  ) {

    return {

      is_job_related: true,

      company: extractCompanyFromEmail(
        subject,
        from
      ),

      role: extractRoleFromEmail(
        subject,
        body
      ),

      status: "Technical Interview",

      deadline: "",

      interview_date: "",

      next_action: "Complete interview",

      summary: "Interview invitation received."

    };
  }


  // =========================================
  // REJECTION
  // =========================================

  if (
    text.includes("application rejected") ||
    text.includes("not selected") ||
    text.includes("we regret") ||
    text.includes("regret to inform") ||
    (
      text.includes("unfortunately") &&
      text.includes("application")
    )
  ) {

    return {

      is_job_related: true,

      company: extractCompanyFromEmail(
        subject,
        from
      ),

      role: extractRoleFromEmail(
        subject,
        body
      ),

      status: "Rejected",

      deadline: "",

      interview_date: "",

      next_action: "",

      summary: "Job application rejection received."

    };
  }


  return null;
}
function extractCompanyFromEmail(subject, from) {

  const subjectText = String(subject || "");
  const fromText = String(from || "");

  const knownCompanies = [
    "Siemens",
    "Infosys",
    "Micro1",
    "Bold Analytics",
    "VirtUp",
    "Naukri",
    "Foundit",
    "Monster",
    "TCS",
    "Accenture",
    "Wipro",
    "Deloitte",
    "Cognizant",
    "Capgemini",
    "Amazon",
    "Microsoft",
    "Google",
    "IBM"
  ];


  for (let i = 0; i < knownCompanies.length; i++) {

    if (
      subjectText
        .toLowerCase()
        .includes(
          knownCompanies[i].toLowerCase()
        )
    ) {

      return knownCompanies[i];
    }
  }


  // Try sender domain

  const emailMatch =
    fromText.match(/<([^>]+)>/);

  const email =
    emailMatch
      ? emailMatch[1]
      : fromText;

  const domainMatch =
    email.match(/@([^.\s>]+)/);

  if (domainMatch) {

    let company =
      domainMatch[1];

    return (
      company.charAt(0).toUpperCase() +
      company.slice(1)
    );
  }


  return "Unknown";
}
function extractRoleFromEmail(subject, body) {

  const text =
    String(subject || "") +
    " " +
    String(body || "");


  const patterns = [

    /for the ([A-Za-z0-9 .\/&-]+?) role/i,

    /for the position of ([A-Za-z0-9 .\/&-]+)/i,

    /position[:\s]+([A-Za-z0-9 .\/&-]+)/i,

    /role[:\s]+([A-Za-z0-9 .\/&-]+)/i,

    /job title[:\s]+([A-Za-z0-9 .\/&-]+)/i

  ];


  for (let i = 0; i < patterns.length; i++) {

    const match =
      text.match(patterns[i]);

    if (match) {

      return match[1]
        .trim()
        .replace(/[.,;:]+$/, "");
    }
  }


  return "";
}
function isProcessed(messageId) {

  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    throw new Error(
      "Sheet not found: " + CONFIG.SHEET_NAME
    );
  }

  const lastRow = sheet.getLastRow();

  // No applications yet
  if (lastRow < 2) {
    return false;
  }

  // Column R = Processed / Message ID
  const processedIds = sheet
    .getRange(
      2,
      18,
      lastRow - 1,
      1
    )
    .getValues()
    .flat();

  return processedIds.some(
    id => String(id).trim() === String(messageId).trim()
  );
}
function getSheet() {

  const ss = SpreadsheetApp.openById(
    CONFIG.SHEET_ID
  );

  const sheet = ss.getSheetByName(
    CONFIG.SHEET_NAME
  );

  if (!sheet) {
    throw new Error(
      "Sheet not found: " + CONFIG.SHEET_NAME
    );
  }

  return sheet;
}
