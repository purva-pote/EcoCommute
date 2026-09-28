# 🚲 EcoCommute — Project Specification (Frontend + Backend)

> **Team:** Mehak & Purva
> **Type:** Full-stack mini project
> **Stack:** HTML5 · CSS3 · Vanilla JavaScript · Bootstrap 5 · Chart.js · Node.js · Express · SQLite
> **One-line pitch:** A web platform where users log their daily green commutes and instantly see how much CO₂ they saved, earn points, and compete on a leaderboard.

---

## 1. Purpose & Problem

- Transport is one of the biggest sources of urban carbon emissions.
- When someone walks, cycles or takes the bus instead of driving, **nobody sees it or measures it, and nothing rewards it**.
- EcoCommute **closes that feedback loop**:
  1. **Makes impact visible**: "You saved 2.4 kg of CO₂ this week."
  2. **Motivates through gamification**: points, levels, streaks and a leaderboard.
  3. **Supports campus/city goals**: gives real data (km walked/cycled, emissions avoided).
  4. **Builds habits**: dashboards and monthly stats reward consistency over weeks and months.

### SDG Alignment
- **SDG 11: Sustainable Cities & Communities.** Less reliance on private cars means less congestion and pollution.
- **SDG 13: Climate Action.** Targets individual behaviour change to cut commuting emissions.

---

## 2. Tech Stack (kept deliberately simple)

| Layer | Technology | Why |
|---|---|---|
| Markup | HTML5 | One `.html` file per page, easy to read |
| Styling | CSS3 + **Bootstrap 5.3** (CDN) + Bootstrap Icons | Responsive grid, ready components, custom green theme on top |
| Logic (client) | **Vanilla JavaScript** (no React) | `fetch()` for API calls, DOM manipulation |
| Charts | **Chart.js 4** (CDN) | Line, bar and doughnut charts |
| Server | **Node.js + Express** | REST API and serves the frontend files |
| Database | **SQLite** (Node's built-in `node:sqlite`) | Zero setup: a single file `data/ecocommute.db` |
| Auth | **bcryptjs** (password hashing) + **JSON Web Tokens** | Simple, stateless email/password login |

**No React, no build tools, no bundlers.** Open the page and it works.

---

## 3. Folder Structure

```
Eco Commute/
├── PROJECT_SPEC.md          ← this document
├── README.md                ← how to run
├── start.bat                ← double-click: installs, starts server, opens Chrome
├── package.json
├── data/                    ← SQLite database file (auto-created)
├── server/
│   ├── server.js            ← Express app entry point
│   ├── db.js                ← DB connection + table creation
│   ├── seed.js              ← demo users & trips
│   ├── middleware/auth.js   ← JWT verification
│   └── routes/
│       ├── auth.js          ← register / login / me
│       ├── trips.js         ← create / list / delete trips
│       ├── stats.js         ← personal + monthly stats, community totals
│       └── leaderboard.js   ← ranked users
└── public/                  ← FRONTEND (served by Express)
    ├── index.html           ← Landing page + quick calculator
    ├── login.html
    ├── register.html
    ├── dashboard.html
    ├── log-trip.html
    ├── history.html
    ├── stats.html           ← Monthly statistics
    ├── leaderboard.html
    ├── css/style.css
    └── js/
        ├── co2.js           ← ⭐ shared calculation logic (used by BOTH browser & server)
        ├── api.js           ← fetch wrapper + token handling
        ├── common.js        ← navbar, auth guard, toasts, formatting helpers
        └── pages/*.js       ← one script per page
```

---

## 4. Core Calculation Logic (the "intelligence")

This logic lives in **one file**, `public/js/co2.js`. The browser uses it for the live preview and the server uses it as the source of truth, so the two can never disagree.

### 4.1 Emission factors (grams CO₂ per km, per person)

| Mode | Emission (g/km) | Notes |
|---|---|---|
| 🚗 Car (driving alone): **baseline** | **120** | Average petrol car |
| 🚶 Walking | 0 | Zero emissions |
| 🚲 Cycling | 0 | Zero emissions |
| 🚌 Public transport | 40 | Bus / metro / train, per passenger |
| 🚙 Carpool | 120 ÷ people in car | Emissions are shared |

### 4.2 Formulas

```
CO₂ saved (g)  = (120 − modeEmission) × distance_km
CO₂ saved (kg) = CO₂ saved (g) / 1000

Points         = basePoints(mode) + floor(distance_km × basePoints(mode) / 10)
   basePoints: walk = 10, cycle = 10, public = 5, carpool = 3
   → greener modes earn more per trip AND per km

Trees equivalent = CO₂ saved (kg) / 21        (1 tree absorbs ≈ 21 kg CO₂ per year)
```

### 4.3 Worked examples

| Trip | CO₂ saved | Points |
|---|---|---|
| Cycle 5 km | (120 − 0) × 5 = 600 g = **0.60 kg** | 10 + floor(5 × 1) = **15** |
| Bus 10 km | (120 − 40) × 10 = 800 g = **0.80 kg** | 5 + floor(10 × 0.5) = **10** |
| Carpool 12 km, 3 people | (120 − 40) × 12 = 960 g = **0.96 kg** | 3 + floor(12 × 0.3) = **6** |
| Walk 2 km | 120 × 2 = 240 g = **0.24 kg** | 10 + floor(2 × 1) = **12** |

### 4.4 Gamification rules

- **Levels** (based on total points):
  🌱 Seedling (0) → 🌿 Sprout (250) → 🪴 Sapling (750) → 🌳 Tree (1500) → 🌲 Forest (3000)
- **Streak:** number of consecutive days (ending today or yesterday) with at least one trip.
- **Rank:** position on the leaderboard by CO₂ saved.

---

## 5. FRONTEND: Pages & Features

### 5.1 Global / shared (all pages)
- Responsive layout: works on mobile, tablet and laptop (Bootstrap grid).
- **Consistent navbar** injected by `common.js`:
  - Logged out: Home · Leaderboard · Login · Sign up
  - Logged in: Dashboard · Log Trip · History · Monthly Stats · Leaderboard · user menu (Logout)
  - Active page highlighted.
- **Auth guard:** protected pages redirect to `login.html` if no valid token.
- **Toast notifications** for success and error messages (e.g. "Trip logged!", "Invalid password").
- **Loading states:** spinners/skeletons while data loads.
- **Empty states:** friendly message plus a button when there's no data yet ("No trips yet, log your first one!").
- Green eco theme, Poppins font, rounded cards, subtle hover animations, animated counters.
- Footer with SDG 11 & SDG 13 tags.

### 5.2 `index.html`: Landing page (public)
- Hero section: tagline, short description, "Get Started" and "Try the Calculator" buttons.
- **Live community counter:** total CO₂ saved, km travelled and trips by all users (from `/api/community`).
- **"How it works"**: 3 steps (Log → Calculate → Compete).
- **⭐ Interactive quick calculator** (works without login):
  - Choose mode + drag a distance slider.
  - Instantly shows CO₂ saved, points earned and trees equivalent.
  - Comparison bars showing grams of CO₂ for car vs bus vs carpool vs cycling for the same distance.
- **SDG section:** cards explaining Goal 11 & Goal 13.
- Call-to-action to sign up.

### 5.3 `register.html` / `login.html`
- Register: name, email, password, confirm password.
- Login: email, password.
- **Client-side validation** (Bootstrap validation styles): required fields, valid email, password ≥ 6 chars, passwords match.
- Show/hide password toggle.
- Server errors shown inline (e.g. "Email already registered").
- On success: token saved in `localStorage` → redirect to dashboard.
- One-click **"Use demo account"** button on the login page (for the presentation).

### 5.4 `dashboard.html`: Personal dashboard (protected)
- Greeting: "Good morning, Mehak 👋" plus the current level badge.
- **KPI cards (animated counters):** Total CO₂ saved (kg) · Total distance (km) · Trips logged · Score (points) · 🔥 Streak (days) · 🏆 Rank.
- **Level progress bar:** points needed to reach the next level.
- **Chart 1: line/bar:** CO₂ saved per day over the last 14 days.
- **Chart 2: doughnut:** trip breakdown by mode.
- **Impact equivalents:** "= 🌳 X trees' yearly absorption", "= X km of car driving avoided".
- **Recent trips** (last 5) with a link to the full history.
- **Eco tip of the day** (random tip).
- Quick "+ Log a trip" button.

### 5.5 `log-trip.html`: Trip logging (protected) ⭐ core feature
- **Mode selector** as 4 large clickable cards with icons (Walk / Cycle / Public transport / Carpool).
- **Distance** number input synced with a slider (0.1 – 100 km).
- **Passengers** field that appears **only when Carpool is selected** (2 – 8).
- **Date** picker (defaults to today; future dates not allowed).
- Optional **note** (e.g. "Home → College").
- **Quick-distance chips:** 2 km, 5 km, 10 km, 20 km.
- **Live preview panel** that updates as you type: CO₂ saved, points, trees equivalent, and a visual "vs car" comparison.
- On submit: POST to the API, then a **success modal** showing the results the server calculated and the updated total score, with buttons for "Log another" and "Go to dashboard".

### 5.6 `history.html`: Trip history (protected)
- Table of all trips: date, mode (icon badge), distance, passengers, CO₂ saved, points, note.
- **Filters:** by mode and by month; plus a text search on notes.
- Summary row: totals for the filtered trips.
- **Delete a trip** (with a confirmation dialog); stats update automatically.
- **Export to CSV** button.

### 5.7 `stats.html`: Monthly statistics (protected)
- Year selector.
- **Bar chart:** CO₂ saved per month (12 months).
- **Stacked bar/line:** distance per month split by mode.
- **Month-wise table:** trips, distance, CO₂ saved, points, most-used mode.
- Highlight cards: **Best month**, **This month vs last month (% change)**, **Average CO₂ per trip**.

### 5.8 `leaderboard.html`: Leaderboard (public; highlights you if logged in)
- Toggle **metric:** CO₂ saved ↔ Score.
- Toggle **period:** All time ↔ This month.
- **Podium** for the top 3 (🥇🥈🥉).
- Ranked table: rank, name, level, trips, distance, CO₂ saved, score.
- The current user's row is **highlighted** ("You").

---

## 6. BACKEND: API, Database & Logic

### 6.1 Server
- `server/server.js` creates the Express app:
  - `express.json()` body parsing, `cors()`.
  - Serves `public/` as static files, so **one server runs the whole site** at `http://localhost:3000`.
  - Mounts API routes under `/api`.
  - Central error handler that returns JSON `{ error: "message" }`.
- The database and tables are created automatically on first run, and demo data is seeded if the DB is empty.

### 6.2 Database schema (SQLite)

**`users`**
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| name | TEXT NOT NULL | |
| email | TEXT UNIQUE NOT NULL | stored lowercase |
| password_hash | TEXT NOT NULL | bcrypt hash, never plain text |
| created_at | TEXT | ISO timestamp |

**`trips`**
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTOINCREMENT | |
| user_id | INTEGER FK → users.id | ON DELETE CASCADE |
| mode | TEXT | CHECK in ('walk','cycle','public','carpool') |
| distance | REAL | km |
| passengers | INTEGER | 1, or 2–8 for carpool |
| date | TEXT | `YYYY-MM-DD` |
| co2_saved | REAL | **kg**, calculated by the server |
| points | INTEGER | calculated by the server |
| note | TEXT | optional |
| created_at | TEXT | ISO timestamp |

Indexes: `trips(user_id)`, `trips(date)`.

### 6.3 REST API endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Create account → `{ token, user }` |
| POST | `/api/auth/login` | ❌ | Login → `{ token, user }` |
| GET | `/api/auth/me` | ✅ | Current user info |
| POST | `/api/trips` | ✅ | Log a trip (server computes CO₂ + points) |
| GET | `/api/trips` | ✅ | List my trips (`?mode=&month=YYYY-MM&limit=`) |
| DELETE | `/api/trips/:id` | ✅ | Delete one of my trips |
| GET | `/api/stats/:userId` | ✅ | Totals, by-mode breakdown, last-14-days series, streak, level, rank |
| GET | `/api/stats/:userId/monthly?year=2026` | ✅ | 12-month aggregates |
| GET | `/api/leaderboard?metric=co2\|score&period=all\|month` | ❌ | Ranked users |
| GET | `/api/community` | ❌ | Platform-wide totals (landing page) |
| GET | `/api/calculate?mode=&distance=&passengers=` | ❌ | Pure calculation (no DB) |

**Example: `POST /api/trips`**
```json
// request (Authorization: Bearer <token>)
{ "mode": "cycle", "distance": 5, "date": "2026-09-28", "note": "Home → College" }

// response 201
{ "trip": { "id": 42, "mode": "cycle", "distance": 5, "co2_saved": 0.6, "points": 15, ... },
  "totals": { "co2_saved": 18.4, "points": 342, "trips": 27 } }
```

### 6.4 Authentication flow
1. Register/login: the password is hashed with **bcrypt (10 salt rounds)**, and the server returns a **JWT** (valid for 7 days).
2. The frontend stores the token in `localStorage` and sends `Authorization: Bearer <token>` on every protected request.
3. `middleware/auth.js` verifies the token and sets `req.user`; if the token is invalid or missing, the server returns `401`.
4. Users can only read their own stats and only delete their own trips (`403` otherwise).

### 6.5 Validation & error handling (server side, never trust the client)
- `mode` must be one of the 4 allowed values.
- `distance`: number, 0.1 – 100 km.
- `passengers`: integer 2 – 8 (carpool only; forced to 1 for other modes).
- `date`: valid `YYYY-MM-DD`, not in the future (defaults to today).
- `email` format, `password` ≥ 6 characters, `name` 2–50 characters.
- Status codes: `400` bad input · `401` not logged in · `403` not allowed · `404` not found · `409` email already exists · `500` server error.
- All SQL uses **prepared statements** (protects against SQL injection).

### 6.6 Key SQL queries
- **Leaderboard:** `SELECT u.id, u.name, SUM(t.co2_saved), SUM(t.points), COUNT(t.id) … GROUP BY u.id ORDER BY total DESC`
- **Monthly:** `SELECT substr(date,1,7) AS month, COUNT(*), SUM(distance), SUM(co2_saved) … GROUP BY month`
- **By mode:** `SELECT mode, COUNT(*), SUM(distance), SUM(co2_saved) … GROUP BY mode`

---

## 7. Non-functional Requirements
- **Simple:** no frameworks beyond Bootstrap/Express, so every line is explainable in viva.
- **Efficient:** aggregation happens in SQL, charts render only fetched data, and the server calculates CO₂ exactly once and stores it.
- **Secure basics:** hashed passwords, JWT, prepared statements, input validation, output escaped before inserting into HTML.
- **Responsive & accessible:** labels on all inputs, good contrast, keyboard-friendly controls.
- **Consistent:** the same calculation file runs on frontend and backend.

---

## 8. How to Run
1. Install Node.js (v22.5 or newer).
2. Double-click **`start.bat`**. It runs `npm install` (first time only), starts the server, and opens **Google Chrome** at `http://localhost:3000`.
   - Or manually: `npm install`, then `npm start`, then open `http://localhost:3000`.
3. Demo account: see `README.md`.

---

## 9. Demo Flow for Evaluation
1. Landing page: show the community counter and play with the quick calculator.
2. Log in with the demo account.
3. Dashboard: current stats and charts.
4. **Log a cycling trip of 5 km**: the live preview shows 0.60 kg and 15 pts, then the success modal appears.
5. Back to the dashboard: numbers and charts updated.
6. Leaderboard: the demo user's position moved.
7. Monthly stats page: month-by-month impact.

---

## 10. Suggested Work Split
| Mehak | Purva |
|---|---|
| Landing, login/register, dashboard pages | Log trip, history, monthly stats, leaderboard pages |
| Auth routes + JWT middleware | Trips, stats, leaderboard routes |
| CO₂ calculation module | Database schema + seed data |
| Both: testing, styling polish, presentation | |

---

## 11. Future Scope
- 🏅 Badges/achievements ("100 km cycled", "7-day streak").
- 🏫 Class vs class / college vs college competitions (teams table).
- 🗺️ Maps API for automatic distance calculation.
- 🔔 Reminders / push notifications to log trips.
- ☁️ Deploy: Netlify/Vercel (frontend) + Render/Railway (backend) + PostgreSQL (Supabase).
