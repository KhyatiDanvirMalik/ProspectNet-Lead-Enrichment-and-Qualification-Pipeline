# ProspectNet 🚀

**An Automated Lead Enrichment and Qualification Pipeline**

ProspectNet is an end-to-end AI-powered platform designed to streamline the sales prospecting process. It automatically extracts lead data via a Chrome Extension or bulk CSV upload, enriches the profile using web search APIs, scores the lead against a customizable Ideal Customer Profile (ICP), and generates highly personalized outreach drafts using LLMs.

---

## 🌟 Key Features

*   **1-Click Chrome Extension:** Extract contact and company data directly from LinkedIn profiles, LinkedIn Company pages, and general company websites.
*   **Bulk Processing:** Upload a CSV of prospects to enrich hundreds of leads simultaneously.
*   **Dynamic ICP Scoring:** Configure your target firmographics, tech stack, and buying signals to automatically score leads from 0-100.
*   **AI Outreach Generation:** Automatically generates "Direct" and "Consultative" cold email drafts tailored to the specific lead's background and detected buying signals.
*   **CRM Integration Ready:** 1-click sync to push qualified leads directly to your CRM.
*   **Beautiful Dashboard:** A clean, responsive React frontend (Emerald Green & Amber Yellow theme) to monitor your pipeline, track success rates, and configure ICP weights.

---

## 🛠️ Technology Stack

**Frontend**
*   React.js (Vite)
*   Lucide React (Icons)
*   Custom CSS (Modern Card UI)
*   Docker (Production Build)

**Backend & AI**
*   Python & FastAPI
*   GroqCloud API (Fast LLM inference for scoring and outreach)
*   DuckDuckGo Search API (Real-time web enrichment and signal detection)

**Browser Extension**
*   Chrome Extension API (Manifest V3)
*   Vanilla JavaScript & CSS

**Deployment**
*   Railway (Nixpacks for Backend, Docker for Frontend)

---

## 📂 Project Structure

```text
ProspectNet/
├── backend/                # FastAPI Python server (GroqCloud & DuckDuckGo logic)
│   ├── main.py             # App entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # React Dashboard
│   ├── src/                # Components and Pages
│   ├── Dockerfile          # Frontend containerization
│   └── package.json        
├── extension/              # Chrome Extension
│   ├── manifest.json
│   ├── popup/              # Extension UI
│   └── content_scripts/    # Web scraping logic
└── railway.json            # Deployment configuration