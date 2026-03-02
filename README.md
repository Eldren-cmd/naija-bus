# 🚌 Naija Transport — Route & Fare Finder

> A full-stack, real-time Nigerian transport platform built with TypeScript, React, Node.js, MongoDB, and Socket.IO.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-naijatransport.vercel.app-gold?style=for-the-badge&logo=vercel)](https://naijatransport.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-purple?style=for-the-badge&logo=render)](https://naija-bus-backend.onrender.com/api/v1/health)
[![TypeScript](https://img.shields.io/badge/TypeScript-81%25-blue?style=for-the-badge&logo=typescript)](https://github.com/Eldren-cmd/naija-bus)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📸 Screenshots

> Live at **[naijatransport.vercel.app](https://naijatransport.vercel.app)**

---

## 🧭 What It Does

Naija Transport helps commuters in Lagos find bus routes, estimate fares, and report real-time traffic incidents — all in one place.

Users can:
- 🔍 Search routes and stops by name or location
- 🗺️ View interactive maps with route polylines and stop markers
- 💰 Get real-time fare estimates blended with crowdsourced reports
- 🚨 Report and view live traffic incidents (roadblocks, police checkpoints)
- 📍 Record and replay their own trips with GPS tracking
- 🔐 Register, log in, and save favourite routes
- 🏆 Earn points, streaks, and badges for community contributions

---

## ⚙️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | UI framework and build tool |
| TypeScript | Type-safe frontend logic |
| Tailwind CSS | Styling |
| Mapbox GL JS | Interactive route and incident maps |
| Socket.IO Client | Real-time incident updates |
| React Router | Client-side routing |
| Axios | API communication with interceptors |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| TypeScript | Type-safe backend logic |
| MongoDB Atlas + Mongoose | Database with geospatial indexes |
| Socket.IO | Real-time bi-directional events |
| JWT + bcrypt | Authentication (access + refresh tokens) |
| Zod | Request body validation |
| express-rate-limit | API rate limiting |
| Pino | Structured JSON logging |
| Sentry | Error monitoring and observability |

### Infrastructure & DevOps
| Technology | Purpose |
|---|---|
| Vercel | Frontend hosting + CD |
| Render | Backend hosting + CD |
| GitHub Actions | CI pipelines (test, build, deploy, security audit) |
| Playwright | End-to-end testing |
| Jest + Supertest | Unit and integration testing |
| UptimeRobot | Uptime monitoring |

---

## 🏗️ Architecture

```
naija-bus/
├── frontend/          # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-level pages
│   │   └── hooks/         # Custom React hooks
│   └── .env.example
├── backend/           # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── models/        # Mongoose schemas
│   │   ├── middleware/    # Auth, rate-limit, validation
│   │   ├── services/      # Business logic (fare engine, etc.)
│   │   └── socket/        # Socket.IO event handlers
│   └── .env.example
├── seed/              # Initial Lagos route dataset
├── scripts/           # Seed and utility scripts
├── docs/              # Validation evidence and runbooks
└── .github/workflows/ # CI/CD pipelines
```

---

## 🚀 Key Features In Depth

### 🔐 Authentication
- JWT access tokens (in-memory) + refresh tokens (httpOnly cookies)
- Auto-refresh on 401 via Axios interceptor
- Protected route wrapper for authenticated-only pages
- Admin role with route/stop management panel

### 🗺️ Geospatial Search
- MongoDB 2dsphere indexes on routes and stops
- `GET /stops?near=lng,lat&radius=500` — find stops within radius
- `GET /routes?bbox=` — filter routes within map viewport
- Lagos bounds and zoom caps to control Mapbox tile usage

### ⚡ Real-Time with Socket.IO
- Server emits `report:created` and `fare:reported` on new submissions
- Frontend subscribes to viewport/route channels
- Live incident markers update on the map without page refresh
- Two-browser real-time demo validated in `docs/`

### 💰 Fare Engine
- Rule-based base fare calculation per route
- Time-of-day and traffic multipliers
- Blends rule-based fare with recent crowdsourced reports
- Full fare breakdown in API response

### 📍 Trip Recording
- GPS `watchPosition` captures checkpoints every 5 seconds
- Live polyline drawn on map during recording
- Trip uploaded to backend on stop with distance + duration computed
- MyTrips page replays stored checkpoint polyline on map

### 🏆 Gamification
- Points awarded for fare reports and trip uploads
- Streak tracking for consecutive daily contributions
- Badges unlocked at milestones
- Leaderboard surface for community engagement

### 🤖 WhatsApp Bot
- `whatsapp-web.js` listener ingests route/fare reports from WhatsApp
- Bot-auth endpoint with token-gated ingestion
- Allowlist-controlled sender MSISDN filtering

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Mapbox account (free tier)

### 1. Clone the repo
```bash
git clone https://github.com/Eldren-cmd/naija-bus.git
cd naija-bus
```

### 2. Set up the backend
```bash
cd backend
cp .env.example .env
# Fill in your values in .env (see Environment Variables below)
npm install
npm run dev
```

### 3. Set up the frontend
```bash
cd frontend
cp .env.example .env
# Fill in VITE_API_BASE and VITE_MAPBOX_KEY
npm install
npm run dev
```

### 4. Seed the database (optional)
```bash
# Dry run (no DB writes)
node scripts/seed.js --dry-run

# Seed 5 Lagos corridors
node scripts/seed.js
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d
CORS_ALLOWED_ORIGINS=http://localhost:5173
SENTRY_DSN=your_sentry_dsn (optional)
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE=http://localhost:5000
VITE_MAPBOX_KEY=your_mapbox_public_token
```

> ⚠️ Never commit `.env` files. Use `.env.example` as a reference only.

---

## 🧪 Testing

```bash
# Backend unit tests
cd backend && npm test

# Backend integration tests (Supertest)
cd backend && npm run test:integration

# End-to-end tests (Playwright)
npm run test:e2e
```

**Coverage includes:**
- Fare engine base logic (Jest)
- Auth login, routes list, fare estimate (Supertest)
- Login flow, saved-route actions, report submission (Playwright)

---

## 📡 API Highlights

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login + set refresh cookie |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| GET | `/api/v1/routes?q=&bbox=` | ❌ | Search routes |
| GET | `/api/v1/routes/:id` | ❌ | Route detail + stops |
| GET | `/api/v1/stops?near=lng,lat` | ❌ | Stops near location |
| GET | `/api/v1/fare/estimate` | ❌ | Fare estimate |
| POST | `/api/v1/fare/report` | ✅ | Submit fare report |
| POST | `/api/v1/reports` | ✅ | Submit traffic incident |
| GET | `/api/v1/reports?bbox=` | ❌ | Active incidents in viewport |
| POST | `/api/v1/trips` | ✅ | Upload recorded trip |
| GET | `/api/v1/trips` | ✅ | User trip history |
| GET | `/api/v1/health` | ❌ | Backend health check |

---

## 🚢 Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | [naijatransport.vercel.app](https://naijatransport.vercel.app) |
| Backend | Render | [naija-bus-backend.onrender.com](https://naija-bus-backend.onrender.com) |
| Database | MongoDB Atlas | — |

**CI/CD:**
- Push to `main` → GitHub Actions runs tests + build
- On success → auto-deploys frontend to Vercel, backend to Render
- Security audit workflow runs on every push (dependency audit + runtime smoke checks)
- Uptime monitor pings `/api/v1/health` every 10 minutes

---

## 👤 Author

**Gabriel Adenrele Adegboyega**
Full Stack Developer

[![Portfolio](https://img.shields.io/badge/Portfolio-ga--royal--portfolio.vercel.app-gold?style=flat-square)](https://ga-royal-portfolio.vercel.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-adenrele--gabriel-blue?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/adenrele-gabriel-9332b9183/)
[![GitHub](https://img.shields.io/badge/GitHub-Eldren--cmd-black?style=flat-square&logo=github)](https://github.com/Eldren-cmd)
[![Email](https://img.shields.io/badge/Email-adenrelegabriel%40gmail.com-red?style=flat-square&logo=gmail)](mailto:adenrelegabriel@gmail.com)

---

## 📄 License

MIT © 2025 Gabriel Adenrele Adegboyega
