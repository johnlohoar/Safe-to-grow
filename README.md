# Safe to Grow — Deployment Guide

React + Vite site. Deploys free on Vercel. Reads from Airtable.

---

## Stack

| Layer | Tool | Cost |
|-------|------|------|
| Frontend | React + Vite | Free |
| Hosting | Vercel | Free (Hobby tier) |
| Database | Airtable | Free (up to 1,000 records) |
| PDF download | Browser print API | Free |

---

## Local Setup (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template
cp .env.example .env

# 3. Fill in your Airtable credentials in .env
#    VITE_AIRTABLE_TOKEN=...
#    VITE_AIRTABLE_BASE_ID=...

# 4. Run locally
npm run dev
```

Without .env values, the app runs on sample data automatically — useful for design work.


---

## Getting Airtable Credentials

**Token:**
1. Go to airtable.com/create/tokens
2. Create token → name it "SafeToGrow Site"
3. Scopes: `data.records:read`
4. Access: your Safe to Grow base
5. Copy the token → paste into .env as VITE_AIRTABLE_TOKEN

**Base ID:**
1. Open your Airtable base
2. Look at the URL: `airtable.com/appXXXXXXXXXXXXXX/tblYYY/...`
3. The `appXXXX` part is your Base ID
4. Paste into .env as VITE_AIRTABLE_BASE_ID

**Table name:**
- The app expects a table called exactly: `Content Database`
- If yours is named differently, edit `TABLE` in src/data/airtable.js

---

## Deploy to Vercel (10 minutes)

```bash
# Option A: Vercel CLI
npm install -g vercel
vercel           # follow prompts, it auto-detects Vite

# Option B: GitHub → Vercel (recommended)
# 1. Push this folder to a GitHub repo
# 2. Go to vercel.com → New Project → Import from GitHub
# 3. Vercel auto-detects Vite — no config needed
```

**Add environment variables in Vercel:**
1. Vercel dashboard → your project → Settings → Environment Variables
2. Add `VITE_AIRTABLE_TOKEN` and `VITE_AIRTABLE_BASE_ID`
3. Redeploy

That's it. Every time you update content in Airtable, the site reflects it on next page load — no redeploy needed.

---

## Airtable Requirements

Your `Content Database` table must have these exact field names:

| Field | Type |
|-------|------|
| Record ID | Single line text |
| Scenario | Single line text |
| Category | Single select |
| Age Group | Single select |
| Age Range | Single select |
| Intro Line | Long text |
| The Issue | Long text |
| Why It Matters | Long text |
| What Parents Can Do | Long text |
| What Children Can Do | Long text |
| Conversation Starters | Long text |
| Irish Support | Long text |
| Further Reading | Long text |
| Sources | Long text |
| Status | Single select |
| Version | Single line text |
| Last Updated | Date |

Only records with `Status = Published` are shown publicly.

---

## How the PDF Download Works

Uses the browser's built-in print-to-PDF — no server, no library.
Clicking "Download PDF" opens a clean print-formatted page and triggers the print dialog.
Users select "Save as PDF" in their browser's print dialog.

This works on all modern browsers. On mobile it saves directly to Files.

---

## Folder Structure

```
safetogrow/
├── src/
│   ├── App.jsx          ← Main UI
│   ├── main.jsx         ← React entry point
│   ├── data/
│   │   ├── airtable.js  ← Airtable API connector
│   │   └── content.js   ← Sample data + category/age constants
│   └── utils/
│       └── download.js  ← PDF and plain text export
├── index.html
├── vite.config.js
├── package.json
└── .env.example
```
