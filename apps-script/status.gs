function normalizeStatus(status) {

  if (!status) return "Applied";

  status = status.toLowerCase().trim();

  if (
    status.includes("want to apply") ||
    status.includes("saved")
  )
    return "Want to Apply";

  if (
    status.includes("applied") &&
    !status.includes("application")
  )
    return "Applied";

  if (
    status.includes("application received") ||
    status.includes("application submitted") ||
    status.includes("thank you for applying")
  )
    return "Application Received";

  if (
    status.includes("shortlisted") ||
    status.includes("resume shortlisted")
  )
    return "Resume Shortlisted";

  if (
    status.includes("assessment") ||
    status.includes("online assessment") ||
    status.includes("oa") ||
    status.includes("hackerrank") ||
    status.includes("codility")
  )
    return "OA Received";

  if (
    status.includes("assessment submitted") ||
    status.includes("oa submitted")
  )
    return "OA Submitted";

  if (
    status.includes("technical interview") ||
    status.includes("coding interview")
  )
    return "Technical Interview";

  if (
    status.includes("hr interview") ||
    status.includes("recruiter interview")
  )
    return "HR Interview";

  if (
    status.includes("documents") ||
    status.includes("document verification")
  )
    return "Documents Requested";

  if (
    status.includes("offer")
  )
    return "Offer";

  if (
    status.includes("reject") ||
    status.includes("regret") ||
    status.includes("not selected")
  )
    return "Rejected";

  if (
    status.includes("withdraw")
  )
    return "Withdrawn";

  if (
    status.includes("no response")
  )
    return "No Response";

  if (
    status.includes("closed")
  )
    return "Closed";

  return "Applied";
}
