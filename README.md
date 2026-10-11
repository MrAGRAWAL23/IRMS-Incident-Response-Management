# IRMS — Incident Response Management System

> A college-level cybersecurity project for tracking, investigating, and managing security incidents with rule-based AI assistance.

---

## Project Objective

IRMS provides a centralized web application where security analysts can:

- Record and track cybersecurity incidents from detection through resolution
- Score each incident's risk using a quantitative formula
- Investigate incidents with notes, evidence, and response action logs
- Generate AI-powered analysis and recommendations (demo mode — no API key required)
- Export printable incident reports
- Manage analyst users and access roles

---

## Problem Statement

Security teams handling incidents manually via spreadsheets or email lack a structured workflow. IRMS provides a purpose-built system that:

- Standardizes how incidents are reported and classified
- Provides an audit trail of all actions and changes
- Enables role-based access so viewers, analysts, and admins see appropriate controls
- Delivers AI-generated recommendations even without an external AI provider

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router v7 |
| Styling | Vanilla CSS (custom design system), Tailwind CSS v4 (utility base) |
| Charts | Recharts |
| Icons | Lucide React |
| Toasts | react-hot-toast |
| HTTP Client | Axios |
| Backend | Node.js 18+, Express 4 |
| Database | SQLite via better-sqlite3 (WAL mode) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Security | Helmet, express-rate-limit, CORS |
| AI | Gemini / OpenAI (optional) with built-in demo fallback |

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│             Browser (localhost:5173)             │
│  React SPA — Vite dev server proxies /api → 3001 │
└───────────────────┬─────────────────────────────┘
                    │ HTTP / JSON (JWT auth header)
┌───────────────────▼─────────────────────────────┐
│         Express API (localhost:3001)             │
│  Routes → Controllers → Services → SQLite        │
│  Auth middleware on every protected endpoint     │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│         SQLite — backend/data/irms.db            │
│  WAL mode, foreign key enforcement               │
│  9 tables: users, incidents, investigation_notes │
│  evidence, response_actions, timeline_events     │
│  ai_analyses, audit_logs, incident_sequence      │
└─────────────────────────────────────────────────┘
```

---

## Project Structure

```
D:\IRMS\
├── backend/
│   ├── controllers/          API logic
│   │   ├── authController.js
│   │   ├── incidentController.js
│   │   ├── aiController.js
│   │   ├── reportController.js
│   │   ├── analyticsController.js
│   │   └── userController.js
│   ├── database/
│   │   ├── schema.js         Table definitions + initialization
│   │   └── seed.js           Demo data seeder
│   ├── middleware/
│   │   └── auth.js           JWT verify + role authorize
│   ├── routes/
│   │   ├── auth.js
│   │   ├── incidents.js
│   │   ├── dashboard.js
│   │   └── misc.js           reports, analytics, users, analysts
│   ├── services/
│   │   ├── aiService.js      Gemini / OpenAI / demo fallback
│   │   └── riskScoring.js    Risk score formula
│   ├── data/
│   │   └── irms.db           SQLite database (auto-created)
│   ├── .env                  Environment variables
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/layout/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── IncidentsPage.jsx
│   │   │   ├── CreateIncidentPage.jsx
│   │   │   ├── EditIncidentPage.jsx
│   │   │   ├── IncidentDetailPage.jsx (6 tabs)
│   │   │   ├── InvestigationPage.jsx
│   │   │   ├── AIAssistantPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   ├── ReportDetailPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── UsersPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── services/
│   │   │   └── api.js        Axios client with JWT interceptors
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx           React Router routes
│   │   ├── main.jsx          React entry point (createRoot)
│   │   └── index.css         Full design system (929 lines)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## Installation

### Prerequisites

- Node.js 18 or higher
- npm 8 or higher

### 1. Clone / Open the project

```bash
cd D:\IRMS
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ..\frontend
npm install
```

---

## Running the Project

### Backend (Terminal 1)

```bash
cd D:\IRMS\backend
node server.js
```

Output:
```
IRMS Backend running on port 3001
Environment: development
AI Mode: Demo (no API key configured)
```

### Frontend (Terminal 2)

```bash
cd D:\IRMS\frontend
npm run dev
```

Then open: **http://localhost:5173**

> If port 5173 is in use, Vite will use 5174. Check the terminal output.

---

## Database Initialization and Seeding

The database is **auto-created** when the backend starts for the first time:

- Schema: `backend/database/schema.js` (runs `CREATE TABLE IF NOT EXISTS` — safe to restart)
- Location: `backend/data/irms.db` (SQLite file, persists between restarts)

To seed demo data (12 incidents, 4 users, notes, evidence, actions, timelines):

```bash
cd D:\IRMS\backend
node database/seed.js
```

> **Warning:** Only run seed.js once. It checks for existing records to avoid duplicates, but re-running in a populated database may skip inserts. The database is already seeded in this project.

---

## Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@irms.com | Demo@1234 | Full access including user management |
| **Analyst** | analyst@irms.com | Demo@1234 | Create/edit own incidents, add notes/evidence/actions, AI |
| **Analyst 2** | analyst2@irms.com | Demo@1234 | Same as analyst |
| **Viewer** | viewer@irms.com | Demo@1234 | Read-only — view incidents, dashboard, reports, analytics |

---

## Main Features

| Feature | Description |
|---------|-------------|
| **Login / Logout** | JWT-based authentication, 8-hour token expiry, secure logout |
| **Dashboard** | Live stats, 4 Recharts charts, recent incidents, activity feed |
| **Incident Lifecycle** | Full CRUD: create, list, filter, sort, view, edit, delete (soft) |
| **Incident Details** | 6-tab detail view: Overview, Investigation, Evidence, Actions, Timeline, AI |
| **Investigation Notes** | Timestamped notes with author attribution |
| **Evidence Records** | Metadata-only evidence log (filename, type, reference, description) |
| **Response Actions** | Simulated action log (Block IP, Isolate Device, etc.) — not real commands |
| **Incident Timeline** | Automatic event log for every state change |
| **AI Analysis** | Structured analysis: attack type, findings, recommendations, evidence list |
| **AI Chat Assistant** | Ask questions about a specific incident — context-aware responses |
| **Reports** | Print-ready incident report with all sub-resources and AI analysis |
| **Analytics** | Charts for type, severity, status, monthly trend; date/severity filters |
| **User Management** | Admin can create users, change roles, activate/deactivate (admin-only) |
| **Role-Based Access** | Viewers blocked from write ops at both backend and frontend |

---

## Incident Lifecycle

```
New → Investigating → Contained → Resolved → Closed
          ↓                              ↓
    False Positive                  (end state)
```

Status transitions require a resolution summary when marking **Resolved**, **Closed**, or **False Positive**.

---

## Risk-Scoring Formula

```
Risk Score = Severity + Asset Importance + Potential Impact + Threat Confidence
```

| Factor | Low | Medium | High | Critical |
|--------|-----|--------|------|---------|
| Severity | 5 | 12 | 20 | 25 |
| Asset Importance | 5 | 12 | 20 | 25 |
| Potential Impact | 5 | 12 | 20 | 25 |
| Threat Confidence | 8 | 17 | 25 | — |

**Max = 100** (clamped). Risk Categories:
- **0–30** → Low
- **31–60** → Medium
- **61–80** → High
- **81–100** → Critical

---

## AI Integration and Demo Fallback

The AI service (`backend/services/aiService.js`) checks in order:

1. `GEMINI_API_KEY` in `backend/.env` → uses Google Gemini
2. `OPENAI_API_KEY` in `backend/.env` → uses OpenAI GPT
3. Neither set → **Demo mode** (rule-based fallback, no internet required)

**Demo mode** produces complete, realistic responses for 8 incident types (Phishing, Malware, Ransomware, Brute Force, Unauthorized Access, Data Breach, Suspicious Login, Other). The `provider_mode` field in every response clearly identifies the source.

To enable real AI:

```env
# backend/.env
GEMINI_API_KEY=your-key-here
# or
OPENAI_API_KEY=your-key-here
```

Restart the backend after adding the key.

---

## API Overview

All endpoints require `Authorization: Bearer <token>` except `/api/auth/login`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (rate-limited: 10/15 min) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard/stats` | Live statistics |
| GET | `/api/dashboard/recent-incidents` | Recent incidents |
| GET | `/api/dashboard/activity` | Recent timeline activity |
| GET | `/api/incidents` | List with search, filter, sort, paginate |
| POST | `/api/incidents` | Create (analyst/admin only) |
| GET | `/api/incidents/:id` | Incident detail |
| PUT | `/api/incidents/:id` | Update |
| PATCH | `/api/incidents/:id/status` | Change status |
| DELETE | `/api/incidents/:id` | Soft delete (admin only) |
| GET/POST | `/api/incidents/:id/notes` | Investigation notes |
| GET/POST | `/api/incidents/:id/evidence` | Evidence records |
| GET/POST | `/api/incidents/:id/actions` | Response actions |
| GET | `/api/incidents/:id/timeline` | Timeline events |
| POST | `/api/incidents/:id/ai-analysis` | Run AI analysis |
| GET | `/api/incidents/:id/ai-analysis` | Get saved analyses |
| POST | `/api/incidents/:id/ai-chat` | AI chat question |
| GET | `/api/reports` | List all incident reports |
| GET | `/api/reports/:id` | Full report data |
| GET | `/api/analytics` | Aggregated stats + charts data |
| GET | `/api/users` | User list (admin only) |
| POST | `/api/users` | Create user (admin only) |
| PATCH | `/api/users/:id` | Update user (admin only) |
| GET | `/api/analysts` | List analysts for assignment |

---

## Security Considerations (College Project)

- JWT secret is in `.env` — must be changed for any real deployment
- Passwords hashed with bcryptjs (cost factor 10)
- SQLite uses parameterized queries throughout — no SQL injection
- Helmet sets security headers
- Login is rate-limited (10 requests per 15 minutes)
- Password hashes are never returned in any API response
- Soft deletes only — data is never permanently destroyed

**This project is for academic demonstration and is NOT intended for production use.**

---

## Known Limitations

- Evidence records store metadata only — no actual file upload functionality
- Response actions are simulated log entries only — no real firewall or endpoint integration
- Demo AI mode is rule-based and does not use a real language model
- Single-server deployment only — no load balancing or session distribution
- No email notifications or alerting integrations
- No automated incident import or SIEM connector
- Frontend bundle is not code-split (838 KB) — sufficient for demonstration

---

## Future Enhancements

- Real file upload for evidence attachments
- Email/Slack alerting when critical incidents are created
- SIEM log ingestion (Splunk, Elastic)
- Dashboard time-range filters
- Two-factor authentication
- Incident assignment notifications
- MITRE ATT&CK framework tagging
- Bulk incident operations
- Configurable risk-scoring weights
- Dark mode theme toggle

---

## Commands Quick Reference

```bash
# Start backend
cd D:\IRMS\backend && node server.js

# Start frontend (dev)
cd D:\IRMS\frontend && npm run dev

# Seed database
cd D:\IRMS\backend && node database/seed.js

# Build frontend for production
cd D:\IRMS\frontend && npm run build

# Preview production build
cd D:\IRMS\frontend && npm run preview
```

---

*IRMS — Incident Response Management System | B.Tech Cybersecurity College Project*
