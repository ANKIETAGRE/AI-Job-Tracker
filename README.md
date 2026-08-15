
# AI Job Tracker — Phase 15 Chrome Extension

## Supported sites

- LinkedIn
- Naukri
- Unstop
- Greenhouse
- Workday
- Lever
- Ashby

## Architecture

Job page
→ content.js extracts URL/company/role/location
→ service-worker.js
→ Apps Script Web App
→ existing addJobFromUrl(jobUrl, company)
→ Applications sheet
→ updateDashboard()
→ Dashboard

The company captured from the page is passed into your existing
`addJobFromUrl(jobUrl, userCompanyName)` flow. Your Apps Script should
normalize it before saving.

## 1. Add the Apps Script endpoint

Copy `phase15_webapp.gs` into the SAME Apps Script project that contains
your AI Job Tracker.

Set the token in Apps Script Project Settings → Script properties:

PHASE15_TOKEN = create-your-own-random-token

The extension does not need to know your spreadsheet ID.

## 2. Deploy Apps Script

Deploy → New deployment → Web app

Use:
- Execute as: Me
- Who has access: Anyone with the link

Copy the `/exec` URL.

## 3. Configure the extension

Open the extension Options page and paste:
- Apps Script Web App URL
- Same PHASE15_TOKEN

## 4. Install locally in Chrome

1. Open chrome://extensions
2. Turn on Developer mode
3. Click Load unpacked
4. Select this folder
5. Open a supported job page
6. Click "🚀 Add to Tracker"

## Important

This extension is intended for your personal tracker. The Apps Script
endpoint is protected by a token, but the token is not a secret in the
cryptographic sense because a browser extension must possess it.

The extension only records the job into your tracker. It does NOT
automatically submit an employment application.
