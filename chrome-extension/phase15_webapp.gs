
// ==========================================
// PHASE 15 — CHROME EXTENSION WEB APP
// ==========================================
// Add this file to the SAME Apps Script project
// that contains addJobFromUrl() and updateDashboard().
//
// Then set Script Property:
// PHASE15_TOKEN = your-own-random-token
// ==========================================

function doGet(e) {

  try {

    const params =
      (e && e.parameter) ||
      {};

    const action =
      String(params.action || "")
        .trim();

    if (action !== "addJob") {

      return phase15Json({
        success: false,
        message: "Invalid action."
      });

    }

    const suppliedToken =
      String(params.token || "");

    const expectedToken =
      PropertiesService
        .getScriptProperties()
        .getProperty("PHASE15_TOKEN");

    if (!expectedToken) {

      return phase15Json({
        success: false,
        message:
          "PHASE15_TOKEN is not configured in Script Properties."
      });

    }

    if (
      !suppliedToken ||
      suppliedToken !== expectedToken
    ) {

      return phase15Json({
        success: false,
        message: "Unauthorized request."
      });

    }

    const jobUrl =
      String(params.jobUrl || "")
        .trim();

    const company =
      String(params.company || "")
        .trim();

    const role =
      String(params.role || "")
        .trim();

    const location =
      String(params.location || "")
        .trim();

    const source =
      String(params.source || "Website")
        .trim();

    if (!jobUrl) {

      return phase15Json({
        success: false,
        message: "Job URL is required."
      });

    }

    if (!/^https?:\/\//i.test(jobUrl)) {

      return phase15Json({
        success: false,
        message: "Invalid job URL."
      });

    }

    if (!company) {

      return phase15Json({
        success: false,
        message:
          "Company name could not be detected on this page."
      });

    }

    // ======================================
    // USE YOUR EXISTING PIPELINE
    // ======================================

    const result =
      addJobFromUrl(
        jobUrl,
        company
      );

    // ======================================
    // RETURN
    // ======================================

    return phase15Json({
      success: true,
      applicationId:
        result.applicationId || "",
      company:
        result.company || company,
      role:
        result.role || role,
      location:
        result.location || location,
      source:
        result.source || source,
      status:
        result.status || "Want to Apply"
    });

  } catch (error) {

    Logger.log(
      "Phase 15 Web App Error: " +
      error
    );

    return phase15Json({
      success: false,
      message:
        error.message ||
        String(error)
    });
  }
}


// ==========================================
// JSON RESPONSE
// ==========================================

function phase15Json(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}
