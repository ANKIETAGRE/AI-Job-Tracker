
"use strict";

const DEFAULT_CONFIG = {
  endpoint: "",
  token: ""
};

async function getConfig() {
  const data = await chrome.storage.local.get(DEFAULT_CONFIG);
  return data;
}

function validJob(job) {
  if (!job || typeof job !== "object") {
    return false;
  }

  if (!/^https?:\/\//i.test(String(job.url || ""))) {
    return false;
  }

  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "ADD_JOB") return;

  (async () => {
    try {
      if (!validJob(message.job)) {
        throw new Error("This page does not contain a valid job URL.");
      }

      const config = await getConfig();

      if (!config.endpoint) {
        throw new Error(
          "Apps Script Web App URL is not configured. Open the extension options."
        );
      }

      const params = new URLSearchParams({
        action: "addJob",
        token: config.token || "",
        jobUrl: String(message.job.url),
        company: String(message.job.company || ""),
        role: String(message.job.role || ""),
        location: String(message.job.location || ""),
        source: String(message.job.source || "Website")
      });

      const response = await fetch(
        config.endpoint + "?" + params.toString(),
        {
          method: "GET",
          redirect: "follow",
          credentials: "omit"
        }
      );

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (_) {
        throw new Error(
          "Apps Script returned an unexpected response. Check the Web App deployment."
        );
      }

      if (!data.success) {
        throw new Error(data.message || "Job was not added.");
      }

      sendResponse({
        success: true,
        result: data
      });

    } catch (error) {
      sendResponse({
        success: false,
        message: error?.message || String(error)
      });
    }
  })();

  return true;
});
