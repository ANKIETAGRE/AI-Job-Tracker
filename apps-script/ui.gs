// ==========================================
// PHASE 13 — ONE-CLICK APPLY
// .GS ONLY
// ==========================================


// ==========================================
// CREATE CUSTOM MENU
// ==========================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🚀 Job Tracker")
    .addItem("➕ One-Click Apply", "showApplyDialog")
    .addItem("🔄 Refresh Dashboard", "refreshDashboard")
    .addToUi();
}


// ==========================================
// ONE-CLICK APPLY
// ==========================================

// ==========================================
// ONE-CLICK APPLY
// ==========================================

function showApplyDialog() {

  const ui =
    SpreadsheetApp.getUi();


  // ==========================================
  // ASK FOR JOB URL
  // ==========================================

  const urlResponse =
    ui.prompt(
      "🚀 One-Click Apply",
      "Step 1 of 2\n\nPaste the job URL below:",
      ui.ButtonSet.OK_CANCEL
    );


  // Cancel
  if (
    urlResponse.getSelectedButton() !==
    ui.Button.OK
  ) {

    return;

  }


  const jobUrl =
    urlResponse
      .getResponseText()
      .trim();


  // Empty URL
  if (!jobUrl) {

    ui.alert(
      "❌ Please paste a job URL."
    );

    return;

  }


  // Validate URL
  if (
    !/^https?:\/\//i.test(jobUrl)
  ) {

    ui.alert(
      "❌ Invalid URL",
      "Please enter a valid URL beginning with http:// or https://",
      ui.ButtonSet.OK
    );

    return;

  }


  // ==========================================
  // ASK FOR COMPANY NAME
  // ==========================================

  const companyResponse =
    ui.prompt(
      "🚀 One-Click Apply",
      "Step 2 of 2\n\nEnter the company name:",
      ui.ButtonSet.OK_CANCEL
    );


  // Cancel
  if (
    companyResponse.getSelectedButton() !==
    ui.Button.OK
  ) {

    return;

  }


  const companyName =
    companyResponse
      .getResponseText()
      .trim();


  // Empty company
  if (!companyName) {

    ui.alert(
      "❌ Company name is required."
    );

    return;

  }


  // ==========================================
  // PROCESS JOB
  // ==========================================

  try {

    const result =
      addJobFromUrl(
        jobUrl,
        companyName
      );


    // ========================================
    // CHECK RESULT
    // ========================================

    if (!result) {

      ui.alert(
        "❌ Failed",
        "The job could not be added.",
        ui.ButtonSet.OK
      );

      return;

    }


    if (
      result.success === false
    ) {

      ui.alert(
        "❌ Job Not Added",
        result.message ||
        "Unable to extract job information.",
        ui.ButtonSet.OK
      );

      return;

    }


    // ========================================
    // SUCCESS
    // ========================================

    ui.alert(
      "✅ Job Added Successfully",

      "Application ID: " +
        (
          result.applicationId ||
          "N/A"
        ) +

      "\n\nCompany: " +
        (
          result.company ||
          companyName
        ) +

      "\nRole: " +
        (
          result.role ||
          "Not found"
        ) +

      "\nLocation: " +
        (
          result.location ||
          "Not found"
        ) +

      "\nSource: " +
        (
          result.source ||
          "Website"
        ) +

      "\nStatus: Want to Apply",

      ui.ButtonSet.OK
    );


  } catch (error) {

    Logger.log(
      "One-Click Apply Error: " +
      error
    );


    ui.alert(
      "❌ Error",
      error.message ||
      String(error),
      ui.ButtonSet.OK
    );

  }

}

// ==========================================
// REFRESH DASHBOARD
// ==========================================

function refreshDashboard() {

  try {

    if (
      typeof updateDashboard ===
      "function"
    ) {

      updateDashboard();

    } else {

      Logger.log(
        "updateDashboard() not found."
      );

    }

  } catch (error) {

    Logger.log(
      "Dashboard refresh error: " +
      error
    );

  }

}
