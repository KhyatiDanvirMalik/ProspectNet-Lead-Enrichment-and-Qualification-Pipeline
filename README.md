# ProspectNet – Lead Enrichment & Qualification Pipeline

## Overview
ProspectNet automates B2B lead research by enriching leads from multiple public sources, qualifying them against a configurable Ideal Customer Profile (ICP), detecting buying signals, generating personalized outreach emails, synchronizing data to a CRM, and providing a web dashboard with a Chrome Extension prototype.

## Architecture Overview

```text
CSV Upload / Chrome Extension
        │
        ▼
    FastAPI Backend
        │
        ├── Website Scraper
        ├── LinkedIn Public Scraper
        ├── Google News Scraper
        ▼
 Lead Enrichment Pipeline
        ▼
 Confidence Assignment
        ▼
 ICP Scoring Engine
        ▼
 Buying Signal Detection
        ▼
 Prompt Builder
        ▼
 Groq API
        ▼
 Outreach Drafts
        ├── CRM Sync
        └── Dashboard
```

## ICP Scoring Formula

Final Score = (0.70 × ICP Score) + (0.30 × Buying Signal Score)

ICP factors:
- Company Size – 20%
- Industry Match – 20%
- Tech Stack Match – 20%
- Contact Seniority – 20%
- Business Relevance – 20%

Buying signals:
- Recent funding
- Expansion hiring
- Product launch
- Growth news
- Technology adoption

## Model Choices & Memory Footprint

The assignment specified a local CPU-hosted LLM. During deployment, free-tier hosting memory constraints prevented reliable local inference.

The deployed application therefore uses the Groq API while preserving the same prompt construction pipeline. The inference layer is provider-agnostic and can be switched back to a local model.

Approximate memory:
- Backend: 300–500 MB
- Frontend: Static
- Local LLM: Not deployed
- Groq API: External inference

## LinkedIn Scraping

- Public page scraping only
- No LinkedIn API
- DOM parsing
- Graceful degradation on failures

Known failure modes:
- Rate limiting
- Temporary blocks
- DOM changes
- Missing public information

If LinkedIn fails, enrichment continues using the remaining sources.

## Deployment Instructions

### Backend

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Create a `.env`:

```env
GROQ_API_KEY=
NOTION_API_KEY=
```

### Frontend

```bash
npm install
npm run dev
```

### Deployment

The application is deployed on **Render** because the Railway free trial was unavailable.

Configure all environment variables through the Render dashboard. Never commit `.env` files.

## Chrome Extension

Implemented:
- LinkedIn profile extraction
- Company website extraction
- Popup UI

Current limitation:
The extension has backend connectivity issues with the deployed application. The extraction logic and UI are complete, while end-to-end backend integration requires additional work.

## Known Limitations

- Groq API used instead of a local LLM due to free-tier memory limits.
- LinkedIn scraping depends on public page accessibility.
- Chrome Extension backend integration is incomplete.

## Future Improvements

- Local LLM support
- Background jobs
- Real-time status updates
- Email verification
- Outreach sequence builder
