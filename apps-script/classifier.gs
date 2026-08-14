function classifyEmail(message) {

  const from = String(message.getFrom() || "").toLowerCase();
  const subject = String(message.getSubject() || "").toLowerCase();
  const body = String(message.getPlainBody() || "").toLowerCase();

  const text = from + " " + subject + " " + body;

  // ==========================================
  // JOB / APPLICATION RELATED KEYWORDS
  // ==========================================

  const jobKeywords = [
    "job application",
    "application received",
    "received your application",
    "application for",
    "thank you for applying",
    "thank you for your application",
    "applied for",
    "candidate",
    "recruitment",
    "recruiter",
    "hiring",
    "career",
    "careers",
    "job",
    "position",
    "role",
    "assessment",
    "aptitude",
    "interview",
    "shortlisted",
    "resume shortlisted",
    "resume",
    "application status",
    "application submitted",
    "onboarding",
    "identity verification",
    "confirm your identity",
    "selection process",
    "talent acquisition"
  ];

  // ==========================================
  // IGNORE OBVIOUS NON-JOB EMAILS
  // ==========================================

  const ignoreKeywords = [
    "unsubscribe",
    "newsletter",
    "sale",
    "discount",
    "promotion",
    "order delivered",
    "shopping"
  ];

  // If it's obviously promotional/non-job, ignore
  for (const keyword of ignoreKeywords) {
    if (text.includes(keyword)) {
      return "IGNORE";
    }
  }

  // ==========================================
  // JOB EMAIL DETECTION
  // ==========================================

  for (const keyword of jobKeywords) {
    if (text.includes(keyword)) {
      Logger.log(
        "Classifier matched job keyword: " + keyword
      );

      return "JOB";
    }
  }

  // ==========================================
  // DEFAULT
  // ==========================================

  return "IGNORE";
}
