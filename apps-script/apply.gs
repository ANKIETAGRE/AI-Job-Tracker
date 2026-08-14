// ==========================================
// PHASE 13 — ONE-CLICK APPLY
// ==========================================


// ==========================================
// ONE-CLICK APPLY DIALOG
// ==========================================

function showApplyDialog() {

  const ui =
    SpreadsheetApp.getUi();

  // ==========================================
  // STEP 1 — JOB URL
  // ==========================================

  const urlResponse =
    ui.prompt(
      "🚀 One-Click Apply",
      "Step 1 of 2\n\nPaste the job URL below:",
      ui.ButtonSet.OK_CANCEL
    );

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

  if (!jobUrl) {

    ui.alert(
      "❌ Please paste a job URL."
    );

    return;
  }

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
  // STEP 2 — COMPANY NAME
  // ==========================================

  const companyResponse =
    ui.prompt(
      "🚀 One-Click Apply",
      "Step 2 of 2\n\nEnter the company name:",
      ui.ButtonSet.OK_CANCEL
    );

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
// ADD JOB FROM URL
// ==========================================

function addJobFromUrl(jobUrl, userCompanyName) {

  // ==========================================
  // VALIDATE URL
  // ==========================================

  if (!jobUrl) {
    throw new Error(
      "Please provide a job URL."
    );
  }

  jobUrl = String(jobUrl).trim();

  if (!/^https?:\/\//i.test(jobUrl)) {
    throw new Error(
      "Invalid URL. URL must start with http:// or https://"
    );
  }

  // ==========================================
  // USER PROVIDED COMPANY
  // ==========================================

  userCompanyName =
    String(userCompanyName || "").trim();

  if (!userCompanyName) {
    throw new Error(
      "Company name is required."
    );
  }

  Logger.log(
    "Processing job URL: " + jobUrl
  );

  Logger.log(
    "User provided company: " +
    userCompanyName
  );


  // ==========================================
  // FETCH JOB PAGE
  // ==========================================

  let html = "";

  try {

    const response =
      UrlFetchApp.fetch(
        jobUrl,
        {
          muteHttpExceptions: true,

          followRedirects: true,

          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36"
          }
        }
      );

    const code =
      response.getResponseCode();

    Logger.log(
      "Job page response: " + code
    );

    if (
      code >= 200 &&
      code < 400
    ) {

      html =
        response.getContentText();

    }

  } catch (error) {

    Logger.log(
      "Unable to fetch job page: " +
      error
    );

  }


  // ==========================================
  // EXTRACT BASIC PAGE INFORMATION
  // ==========================================

  const pageInfo =
    extractJobPageInfo(html);


  // ==========================================
  // SOURCE
  // ==========================================

  const source =
    detectJobSource(jobUrl);


  // ==========================================
  // USE OPENROUTER TO EXTRACT JOB DATA
  // ==========================================

  let result = null;

  if (html) {

    result =
      extractJobWithOpenRouter(
        html,
        jobUrl,
        source
      );

  }


  // ==========================================
  // FALLBACK TO PAGE METADATA
  // ==========================================

  if (!result) {

    result = {

      is_job_related: true,

      company:
        pageInfo.company ||
        "",

      role:
        pageInfo.role ||
        pageInfo.title ||
        "",

      location:
        pageInfo.location ||
        "",

      source:
        source,

      job_link:
        jobUrl

    };

  }


  // ==========================================
  // VALIDATE BASIC FIELDS
  // ==========================================

  if (!result.company) {

    result.company =
      pageInfo.company ||
      "";

  }

  if (!result.role) {

    result.role =
      pageInfo.role ||
      pageInfo.title ||
      "";

  }

  result.location =
    result.location ||
    pageInfo.location ||
    "";

  result.source =
    result.source ||
    source;

  result.job_link =
    jobUrl;


  // ==========================================
  // COMPANY NAME RESOLUTION
  // ==========================================
  //
  // USER PROVIDED COMPANY ALWAYS WINS.
  // URL/AI extraction is only a fallback.
  // ==========================================
if (userCompanyName) {

  // User-entered company is the primary source,
  // but normalize it before saving.
  result.company =
    normalizeCompanyName(
      userCompanyName,
      jobUrl
    );

  Logger.log(
    "Company supplied by user: " +
    result.company
  );

} else {

  const urlCompany =
    extractCompanyFromUrl(
      jobUrl
    );

  if (urlCompany) {

    result.company =
      normalizeCompanyName(
        urlCompany,
        jobUrl
      );

  } else {

    result.company =
      normalizeCompanyName(
        result.company,
        jobUrl
      );

  }
}

Logger.log(
  "Final company: " +
  (
    result.company ||
    "[NOT FOUND]"
  )
);


  // ==========================================
  // ROLE NORMALIZATION
  // ==========================================

  if (
    result.role &&
    String(result.role)
      .toLowerCase()
      .trim() ===
      "not specified"
  ) {

    result.role =
      pageInfo.role ||
      pageInfo.title ||
      "";

  }


  // ==========================================
  // FINAL COMPANY FALLBACK
  // ==========================================

  if (!result.company) {

    result.company =
      normalizeCompanyName(
        pageInfo.company,
        jobUrl
      );

  }


  // ==========================================
  // FINAL VALIDATION
  // ==========================================

  /*
   * Company is required.
   *
   * We do NOT want rows like:
   *
   * APP-XXXX | [blank] | Software Engineer
   *
   * because Dashboard intentionally ignores
   * applications without a company.
   */

  if (!result.company) {

    throw new Error(
      "Could not determine the company name from this job URL."
    );

  }


  /*
   * Role can technically be empty, but if
   * both company and role are unavailable,
   * the URL cannot be treated as a job.
   */

  if (
    !result.company &&
    !result.role
  ) {

    throw new Error(
      "Could not extract job information from this URL."
    );

  }


  // ==========================================
  // SAVE APPLICATION
  // ==========================================

  const applicationId =
    saveWantToApplyJob(
      result
    );


  Logger.log(
    "Job added successfully: " +
    applicationId
  );


  // ==========================================
  // AUTOMATICALLY UPDATE DASHBOARD
  // ==========================================

  try {

    updateDashboard();

    Logger.log(
      "Dashboard updated automatically."
    );

  } catch (error) {

    Logger.log(
      "Dashboard update failed: " +
      error
    );

  }


  // ==========================================
  // RETURN RESULT
  // ==========================================

  return {

    success: true,

    applicationId:
      applicationId,

    company:
      result.company,

    role:
      result.role,

    location:
      result.location,

    source:
      result.source,

    status:
      "Want to Apply",

    jobLink:
      jobUrl

  };

}


// ==========================================
// EXTRACT PAGE METADATA
// ==========================================

function extractJobPageInfo(html) {

  const info = {

    title: "",
    company: "",
    role: "",
    location: ""

  };


  if (!html) {
    return info;
  }


  // ==========================================
  // REMOVE SCRIPTS AND STYLES
  // ==========================================

  const cleanHtml =
    html

      .replace(
        /<script[\s\S]*?<\/script>/gi,
        " "
      )

      .replace(
        /<style[\s\S]*?<\/style>/gi,
        " "
      );


  // ==========================================
  // TITLE
  // ==========================================

  const titleMatch =
    html.match(
      /<title[^>]*>([\s\S]*?)<\/title>/i
    );


  if (titleMatch) {

    info.title =
      cleanHtmlText(
        titleMatch[1]
      );

  }


  // ==========================================
  // OG TITLE
  // ==========================================

  const ogTitle =
    html.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
    );


  if (
    ogTitle &&
    !info.title
  ) {

    info.title =
      cleanHtmlText(
        ogTitle[1]
      );

  }


  // ==========================================
  // COMPANY
  // ==========================================

  const companyPatterns = [

    /"hiringOrganization"\s*:\s*\{[\s\S]*?"name"\s*:\s*"([^"]+)"/i,

    /"organization"\s*:\s*\{[\s\S]*?"name"\s*:\s*"([^"]+)"/i,

    /"companyName"\s*:\s*"([^"]+)"/i

  ];


  for (
    let i = 0;
    i < companyPatterns.length;
    i++
  ) {

    const match =
      html.match(
        companyPatterns[i]
      );


    if (match) {

      info.company =
        cleanHtmlText(
          match[1]
        );

      break;

    }

  }


  // ==========================================
  // ROLE
  // ==========================================

  const rolePatterns = [

    /"jobTitle"\s*:\s*"([^"]+)"/i,

    /"title"\s*:\s*"([^"]+)"/i

  ];


  for (
    let i = 0;
    i < rolePatterns.length;
    i++
  ) {

    const match =
      html.match(
        rolePatterns[i]
      );


    if (match) {

      info.role =
        cleanHtmlText(
          match[1]
        );

      break;

    }

  }


  // ==========================================
  // LOCATION
  // ==========================================

  const locationPatterns = [

    /"addressLocality"\s*:\s*"([^"]+)"/i,

    /"location"\s*:\s*"([^"]+)"/i,

    /"jobLocation"\s*:\s*\{[\s\S]*?"addressLocality"\s*:\s*"([^"]+)"/i

  ];


  for (
    let i = 0;
    i < locationPatterns.length;
    i++
  ) {

    const match =
      html.match(
        locationPatterns[i]
      );


    if (match) {

      info.location =
        cleanHtmlText(
          match[1]
        );

      break;

    }

  }


  return info;

}


// ==========================================
// OPENROUTER EXTRACTION
// ==========================================

function extractJobWithOpenRouter(
  html,
  jobUrl,
  source
) {

  try {

    // ==========================================
    // API KEY
    // ==========================================

    const apiKey =
      CONFIG.OPENROUTER_API_KEY;


    if (!apiKey) {

      Logger.log(
        "OpenRouter API key not configured."
      );

      return null;

    }


    // ==========================================
    // LIMIT PAGE SIZE
    // ==========================================

    const text =
      cleanHtmlText(
        html.substring(
          0,
          30000
        )
      );


    // ==========================================
    // PROMPT
    // ==========================================

    const prompt = `

You are extracting structured information from a job posting.

URL:
${jobUrl}

Source:
${source}

JOB PAGE CONTENT:
${text}

Return ONLY valid JSON.

Required format:

{
  "is_job_related": true,
  "company": "",
  "role": "",
  "location": "",
  "source": "${source}"
}

Rules:

- Extract the actual job title.
- Extract the job location.
- Do not invent information.
- If something cannot be found, return an empty string.
- Do NOT use the job title as the company name.
- Do NOT use "Careers", "Jobs", "Job Details", "Apply", or similar page text as the company.
- The company name is supplied separately by the user and will be used by the application.
- Return JSON only.
`;


    // ==========================================
    // OPENROUTER PAYLOAD
    // ==========================================

    const payload = {

      model:
        CONFIG.OPENROUTER_MODEL ||
        "google/gemma-4-26b-a4b-it",

      messages: [

        {
          role: "user",

          content:
            prompt
        }

      ],

      temperature: 0

    };


    // ==========================================
    // CALL OPENROUTER
    // ==========================================

    const response =
      UrlFetchApp.fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {

          method:
            "post",

          contentType:
            "application/json",

          headers: {

            Authorization:
              "Bearer " +
              apiKey,

            "HTTP-Referer":
              "https://script.google.com",

            "X-Title":
              "AI Job Tracker"

          },

          payload:
            JSON.stringify(
              payload
            ),

          muteHttpExceptions:
            true

        }
      );


    // ==========================================
    // RESPONSE
    // ==========================================

    const code =
      response.getResponseCode();


    const raw =
      response.getContentText();


    Logger.log(
      "OpenRouter response code: " +
      code
    );


    // ==========================================
    // ERROR
    // ==========================================

    if (
      code < 200 ||
      code >= 300
    ) {

      Logger.log(
        "OpenRouter error: " +
        raw
      );

      return null;

    }


    // ==========================================
    // PARSE RESPONSE
    // ==========================================

    const json =
      JSON.parse(
        raw
      );


    let content =
      json.choices &&
      json.choices[0] &&
      json.choices[0].message &&
      json.choices[0].message.content;


    if (!content) {
      return null;
    }


    // ==========================================
    // REMOVE MARKDOWN FENCES
    // ==========================================

    content =
      content

        .replace(
          /```json/gi,
          ""
        )

        .replace(
          /```/g,
          ""
        )

        .trim();


    // ==========================================
    // PARSE AI JSON
    // ==========================================

    const result =
      JSON.parse(
        content
      );


    return result;


  } catch (error) {

    Logger.log(
      "OpenRouter extraction error: " +
      error
    );

    return null;

  }

}


// ==========================================
// SAVE WANT TO APPLY
// ==========================================

function saveWantToApplyJob(result) {

  // ==========================================
  // GET SHEET
  // ==========================================

  const sheet =
    getSheet();


  // ==========================================
  // CLEAN VALUES
  // ==========================================

  const company =
    cleanValue(
      result.company
    );


  const role =
    cleanValue(
      result.role
    );


  const location =
    cleanValue(
      result.location
    );


  const source =
    cleanValue(
      result.source
    );


  const jobLink =
    cleanValue(
      result.job_link
    );


  // ==========================================
  // SAFETY CHECK
  // ==========================================

  if (!company) {

    throw new Error(
      "Company name is required before saving the application."
    );

  }


  // ==========================================
  // CHECK DUPLICATE JOB URL
  // ==========================================

  const lastRow =
    sheet.getLastRow();


  if (lastRow >= 2) {

    const data =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          18
        )
        .getValues();


    for (
      let i = 0;
      i < data.length;
      i++
    ) {

      const existingLink =
        cleanValue(
          data[i][16]
        );


      if (
        existingLink &&
        existingLink === jobLink
      ) {

        Logger.log(
          "Job already exists."
        );

        return data[i][0];

      }

    }

  }


  // ==========================================
  // GENERATE APPLICATION ID
  // ==========================================

  const applicationId =
    generateApplicationId(
      sheet
    );


  // ==========================================
  // NEW ROW
  // ==========================================

  const row = [

    applicationId,

    company,

    role,

    "",

    "Want to Apply",

    new Date(),

    source,

    "",

    "",

    "Review and Apply",

    "",

    "",

    "",

    "Medium",

    location,

    "",

    jobLink,

    ""

  ];


  // ==========================================
  // WRITE ROW
  // ==========================================

  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      1,
      18
    )
    .setValues([
      row
    ]);


  Logger.log(
    "New application saved: " +
    applicationId
  );


  return applicationId;

}


// ==========================================
// DETECT SOURCE
// ==========================================

function detectJobSource(url) {

  const text =
    String(url)
      .toLowerCase();


  if (
    text.includes(
      "linkedin.com"
    )
  ) {

    return "LinkedIn";

  }


  if (
    text.includes(
      "naukri.com"
    )
  ) {

    return "Naukri";

  }


  if (
    text.includes(
      "indeed.com"
    )
  ) {

    return "Indeed";

  }


  if (
    text.includes(
      "foundit.in"
    ) ||
    text.includes(
      "monsterindia.com"
    )
  ) {

    return "Foundit";

  }


  if (
    text.includes(
      "internshala.com"
    )
  ) {

    return "Internshala";

  }


  if (
    text.includes(
      "glassdoor."
    )
  ) {

    return "Glassdoor";

  }


  return "Website";

}


// ==========================================
// HTML → TEXT
// ==========================================

function cleanHtmlText(text) {

  if (!text) {
    return "";
  }


  return String(text)

    .replace(
      /<[^>]*>/g,
      " "
    )

    .replace(
      /&nbsp;/gi,
      " "
    )

    .replace(
      /&amp;/gi,
      "&"
    )

    .replace(
      /&quot;/gi,
      '"'
    )

    .replace(
      /&#39;/gi,
      "'"
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();

}


// ==========================================
// NORMALIZE COMPANY NAME
// ==========================================

function normalizeCompanyName(
  company,
  jobUrl
) {

  let name =
    String(
      company || ""
    ).trim();


  const url =
    String(
      jobUrl || ""
    ).toLowerCase();


  // ==========================================
  // DETECT COMPANY FROM JOB URL
  // ==========================================

  if (
    url.includes(
      "accenture.com"
    )
  ) {

    return "Accenture";

  }


  if (
    url.includes(
      "microsoft.com"
    )
  ) {

    return "Microsoft";

  }


  if (
    url.includes(
      "amazon.jobs"
    ) ||
    url.includes(
      "amazon.com"
    )
  ) {

    return "Amazon";

  }


  if (
    url.includes(
      "google.com"
    )
  ) {

    return "Google";

  }


  if (
    url.includes(
      "adobe.com"
    )
  ) {

    return "Adobe";

  }


  if (
    url.includes(
      "ibm.com"
    )
  ) {

    return "IBM";

  }


  if (
    url.includes(
      "infosys.com"
    )
  ) {

    return "Infosys";

  }


  if (
    url.includes(
      "siemens.com"
    )
  ) {

    return "Siemens";

  }


  if (
    url.includes(
      "tcs.com"
    )
  ) {

    return "TCS";

  }


  if (
    url.includes(
      "wipro.com"
    )
  ) {

    return "Wipro";

  }


  if (
    url.includes(
      "capgemini.com"
    )
  ) {

    return "Capgemini";

  }


  if (
    url.includes(
      "micro1.ai"
    )
  ) {

    return "micro1";

  }


  // ==========================================
  // NORMALIZE AI-RETURNED COMPANY NAME
  // ==========================================

  const lower =
    name.toLowerCase();


  const knownCompanies = {

    "accenture":
      "Accenture",

    "microsoft":
      "Microsoft",

    "amazon":
      "Amazon",

    "google":
      "Google",

    "adobe":
      "Adobe",

    "ibm":
      "IBM",

    "infosys":
      "Infosys",

    "siemens":
      "Siemens",

    "tcs":
      "TCS",

    "wipro":
      "Wipro",

    "capgemini":
      "Capgemini",

    "micro1":
      "micro1"

  };


  if (
    knownCompanies[lower]
  ) {

    return knownCompanies[lower];

  }


  // ==========================================
  // UNKNOWN COMPANY
  // ==========================================

  return name;

}


// ==========================================
// EXTRACT COMPANY FROM JOB URL
// ==========================================

function extractCompanyFromUrl(
  jobUrl
) {

  const url =
    String(
      jobUrl || ""
    ).toLowerCase();


  // ==========================================
  // KNOWN COMPANY CAREER DOMAINS
  // ==========================================

  const companyMap = {

    "accenture.com":
      "Accenture",

    "microsoft.com":
      "Microsoft",

    "amazon.com":
      "Amazon",

    "amazon.jobs":
      "Amazon",

    "google.com":
      "Google",

    "meta.com":
      "Meta",

    "apple.com":
      "Apple",

    "adobe.com":
      "Adobe",

    "ibm.com":
      "IBM",

    "oracle.com":
      "Oracle",

    "siemens.com":
      "Siemens",

    "infosys.com":
      "Infosys",

    "tcs.com":
      "TCS",

    "wipro.com":
      "Wipro",

    "capgemini.com":
      "Capgemini",

    "deloitte.com":
      "Deloitte",

    "pwc.com":
      "PwC",

    "ey.com":
      "EY",

    "kpmg.com":
      "KPMG",

    "nvidia.com":
      "NVIDIA",

    "intel.com":
      "Intel",

    "salesforce.com":
      "Salesforce",

    "cisco.com":
      "Cisco",

    "qualcomm.com":
      "Qualcomm",

    "zoho.com":
      "Zoho",

    "freshworks.com":
      "Freshworks",

    "paypal.com":
      "PayPal",

    "uber.com":
      "Uber",

    "airbnb.com":
      "Airbnb",

    "linkedin.com":
      "LinkedIn",

    "openai.com":
      "OpenAI",

    "micro1.ai":
      "micro1",

    "micro1": "Micro1",
  "micro 1": "Micro1",
  "micro-1": "Micro1",

  };


  // ==========================================
  // CHECK DOMAIN
  // ==========================================

  for (
    const domain in companyMap
  ) {

    if (
      url.includes(
        domain
      )
    ) {

      return companyMap[
        domain
      ];

    }

  }


  // ==========================================
  // COMPANY NOT FOUND
  // ==========================================

  return "";

}
