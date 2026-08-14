function updateDashboard() {

  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);

  const app = ss.getSheetByName("Applications");

  let dash = ss.getSheetByName("Dashboard");

  if (!dash) {
    dash = ss.insertSheet("Dashboard");
  }

  dash.clear();

  const data = app.getDataRange().getValues();

  let total = 0;
  let shortlisted = 0;
  let interviews = 0;
  let offers = 0;
  let rejected = 0;

  // Remove duplicate deadlines
  const deadlineMap = new Map();

  const recent = [];

  for (let i = 1; i < data.length; i++) {

    if (!data[i][1]) continue;

    total++;

    const company = data[i][1];
    const role = data[i][2];
    const status = data[i][4];
    const lastUpdate = data[i][5];
    const nextAction = data[i][9];
    const deadline = data[i][12];

    if (status === "Resume Shortlisted")
      shortlisted++;

    if (
      status === "Technical Interview" ||
      status === "HR Interview"
    )
      interviews++;

    if (status === "Offer")
      offers++;

    if (status === "Rejected")
      rejected++;

    // Keep only first deadline for each company
    if (deadline && !deadlineMap.has(company)) {

      deadlineMap.set(company, [
        company,
        role || "",
        deadline,
        nextAction || ""
      ]);

    }

    recent.push([
      company,
      status,
      lastUpdate
    ]);

  }

  const deadlines = [...deadlineMap.values()];

  // ===========================
  // TITLE
  // ===========================

  dash.getRange("A1:S1")
      .merge()
      .setValue("AI JOB TRACKER DASHBOARD")
      .setBackground("#4A86E8")
      .setFontColor("white")
      .setFontWeight("bold")
      .setFontSize(20)
      .setHorizontalAlignment("center");

  // ===========================
  // CARDS
  // ===========================

  createCard(dash,"A3:C5","Applications",total,"#4A86E8");
  createCard(dash,"E3:G5","Shortlisted",shortlisted,"#A47AE2");
  createCard(dash,"I3:K5","Interviews",interviews,"#D97706");
  createCard(dash,"M3:O5","Offers",offers,"#34A853");
  createCard(dash,"Q3:S5","Rejected",rejected,"#EA4335");

  // ===========================
  // DEADLINES
  // ===========================

  dash.getRange("A8:D8")
      .merge()
      .setValue("Upcoming Deadlines")
      .setBackground("#93C47D")
      .setFontWeight("bold");

  dash.getRange("A9:D9")
      .setValues([[
        "Company",
        "Role",
        "Deadline",
        "Next Action"
      ]])
      .setBackground("#6AA84F")
      .setFontColor("white")
      .setFontWeight("bold");

  if (deadlines.length > 0) {

    dash.getRange(10,1,deadlines.length,4)
        .setValues(deadlines);

  }

  // ===========================
  // RECENT ACTIVITY
  // ===========================

  dash.getRange("F8:H8")
      .merge()
      .setValue("Recent Activity")
      .setBackground("#1F4E79")
      .setFontColor("white")
      .setFontWeight("bold");

  dash.getRange("F9:H9")
      .setValues([[
        "Company",
        "Status",
        "Last Update"
      ]])
      .setBackground("#2F75B5")
      .setFontColor("white")
      .setFontWeight("bold");

  recent.sort(function(a,b){
    return new Date(b[2]) - new Date(a[2]);
  });

  if (recent.length > 0) {

    dash.getRange(
      10,
      6,
      Math.min(recent.length,10),
      3
    ).setValues(recent.slice(0,10));

  }

  dash.autoResizeColumns(1,20);
  function createCard(sheet, range, title, value, color) {

  const card = sheet.getRange(range);

  card.merge();

  card.setBackground(color);

  card.setFontColor("white");

  card.setFontWeight("bold");

  card.setHorizontalAlignment("center");

  card.setVerticalAlignment("middle");

  card.setWrap(true);

  card.setValue(title + "\n\n" + value);

  card.setFontSize(18);

}

}
