function askGemini(subject, body) {

  const apiKey = CONFIG.OPENROUTER_API_KEY;

  if (!apiKey) {
    Logger.log("OPENROUTER_API_KEY is missing in config.gs");
    return null;
  }

  const prompt = `
You are an AI Job Tracker.

Analyze the job-related email below.

Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.
Do not write any explanation.

Use exactly:

{
  "is_job_related": true,
  "company": "",
  "role": "",
  "status": "",
  "deadline": "",
  "interview_date": "",
  "next_action": "",
  "summary": ""
}

Allowed statuses:

Want to Apply
Applied
Application Received
Resume Shortlisted
OA Received
OA Submitted
Technical Interview
HR Interview
Documents Requested
Offer
Rejected
Withdrawn
No Response
Closed

Classification rules:

- Application confirmation/submitted → Applied
- Resume/profile shortlisted → Resume Shortlisted
- Online assessment received → OA Received
- Assessment submitted → OA Submitted
- AI interview / conversational interview / technical interview /
  interview scheduled → Technical Interview
- HR interview → HR Interview
- Documents requested → Documents Requested
- Offer → Offer
- Rejected/not selected → Rejected
- Job alerts/recommendations/promotional emails → is_job_related false

Email Subject:
${subject}

Email Body:
${body}
`;

  const payload = {

    model: "google/gemma-4-26b-a4b-it:free",

    messages: [
      {
        role: "system",
        content:
          "You extract structured job application information. Return valid JSON only."
      },
      {
        role: "user",
        content: prompt
      }
    ],

    temperature: 0.1,

    max_tokens: 800
  };

  const options = {

    method: "post",

    contentType: "application/json",

    headers: {
      Authorization: "Bearer " + apiKey
    },

    payload: JSON.stringify(payload),

    muteHttpExceptions: true
  };

  const url =
    "https://openrouter.ai/api/v1/chat/completions";

  try {

    const response =
      UrlFetchApp.fetch(url, options);

    const statusCode =
      response.getResponseCode();

    const responseText =
      response.getContentText();

    Logger.log(
      "OpenRouter HTTP Status: " +
      statusCode
    );

    Logger.log(
      "OpenRouter Response:"
    );

    Logger.log(responseText);

    // API error
    if (statusCode < 200 || statusCode >= 300) {

      Logger.log(
        "OpenRouter API Error"
      );

      return null;
    }

    const json =
      JSON.parse(responseText);

    // Error returned by OpenRouter
    if (json.error) {

      Logger.log(
        "OpenRouter Error:"
      );

      Logger.log(
        JSON.stringify(json.error)
      );

      return null;
    }

    // No choices
    if (
      !json.choices ||
      json.choices.length === 0
    ) {

      Logger.log(
        "No choices returned by OpenRouter."
      );

      return null;
    }

    let text =
      json.choices[0].message.content;

    if (!text) {

      Logger.log(
        "Empty OpenRouter response."
      );

      return null;
    }

    Logger.log(
      "========== OPENROUTER =========="
    );

    Logger.log(text);

    Logger.log(
      "================================"
    );

    // Remove markdown code fences
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Find JSON object
    const start =
      text.indexOf("{");

    const end =
      text.lastIndexOf("}");

    if (
      start === -1 ||
      end === -1
    ) {

      Logger.log(
        "No JSON object found."
      );

      return null;
    }

    text =
      text.substring(
        start,
        end + 1
      );

    const result =
      JSON.parse(text);

    // Normalize status
    if (result.status) {

      result.status =
        normalizeStatus(result.status);

    }

    return result;

  } catch (error) {

    Logger.log(
      "OpenRouter Exception:"
    );

    Logger.log(
      error.toString()
    );

    return null;
  }
}
