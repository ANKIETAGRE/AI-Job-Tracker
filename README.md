
# 🚀 AI Job Tracker

An AI-powered job application tracking system built with **Google Apps Script, Google Sheets, Gmail, AI APIs, and a Chrome/Edge browser extension**.

The system automatically processes job-related emails, extracts application information, tracks application status, manages deadlines, and provides a centralized dashboard.

---


## ✨ Features

### 📧 AI-Powered Gmail Tracking

- Reads job-related emails from Gmail
- Classifies emails using AI
- Identifies companies and job roles
- Detects application status
- Extracts deadlines and interview information
- Updates existing applications instead of creating unnecessary duplicates

### 📊 Job Tracker Dashboard

The Google Sheets dashboard provides:

- Total applications
- Shortlisted applications
- Technical/HR interviews
- Offers
- Rejected applications
- Upcoming deadlines
- Next actions
- Recent activity

### 🤖 AI Job Processing

The project uses AI to analyze job-related emails and extract structured information such as:

Company
Role
Status
Deadline
Interview Date
Location
Next Action
Summary
Recruiter Email

🏗️ Architecture


                    AI JOB TRACKER
                           │
            ┌──────────────┴──────────────┐
            │                             │
          Gmail                     Browser Extension
            │                             │
            ▼                             ▼
      Apps Script                 Apps Script Web App
            │                             │
            └──────────────┬──────────────┘
                           ▼
                    AI Job Processing
                           │
                           ▼
                    Google Sheets
                           │
                           ▼
                       Dashboard
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           Gmail        Calendar      Reminders



🔄 How It Works
1. Gmail Automation
New Job Email
      ↓
Gmail
      ↓
Apps Script
      ↓
AI Classification
      ↓
Extract Job Information
      ↓
Find Existing Application
      ↓
Update / Create Application
      ↓
Google Sheets


2. Browser Extension
Job Website
     ↓
🚀 Add to Tracker
     ↓
Extract Job Information
     ↓
Apps Script Web App
     ↓
Save Job
     ↓
Update Dashboard

3. Application Status

The tracker supports statuses such as:

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


📊 Dashboard

The dashboard provides a centralized view of job applications.

Applications
Shortlisted
Interviews
Offers
Rejected

It also displays:
Upcoming Deadlines
Recent Activity
Next Actions

🔐 Security

API keys, access tokens, passwords, and private credentials must never be committed to this repository.

The public configuration intentionally does not contain the actual OpenRouter API key.

Example:

OPENROUTER_API_KEY: ""

The actual API key should be configured privately in the Apps Script environment.

The Phase 15 access token should also remain private.


👨‍💻 Author

Aniket Agre

AI/ML | Generative AI | Python | Google Apps Script | Automation 
