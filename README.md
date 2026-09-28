# 🚲 EcoCommute

Log your green commutes → see the CO₂ you saved → earn points → climb the leaderboard.
Built with **HTML, CSS, JavaScript, Bootstrap 5, Chart.js, Node.js, Express and SQLite**.

Full frontend and backend specification: [PROJECT_SPEC.md](PROJECT_SPEC.md)

## ▶️ How to run

**Easiest:** double-click **`start.bat`**. It will:
1. install packages the first time (`npm install`),
2. start the server,
3. open **Google Chrome** at http://localhost:3000.

Keep the black server window open while using the site. Close it (or press `Ctrl+C`) to stop.

**Manually (terminal):**
```bash
npm install
npm start
```
Then open http://localhost:3000 in Chrome.

> Requires Node.js 22.5 or newer (uses the built-in `node:sqlite`, so there's no database to install).

## 🔑 Demo accounts

| Who | Email | Password |
|---|---|---|
| Demo user (use for the presentation) | `demo@ecocommute.test` | `demo1234` |
| Other seeded users (Aarav, Diya, Kabir, …) | `<firstname>@ecocommute.test` | `password123` |

The login page also has a **"Use demo account"** button.

To wipe everything and recreate the demo data: `npm run seed`

## 🎤 Demo flow
1. **Home:** show the community counter and play with the quick calculator.
2. **Log in** → **Use demo account**.
3. **Dashboard:** KPIs, level progress, charts.
4. **Log Trip:** Cycling, 5 km. The live preview shows 0.60 kg and 15 pts. Save to see the success modal.
5. **Dashboard** again: numbers and charts updated.
6. **Leaderboard** → *This month*: the demo user moves up a place.
7. **Monthly Stats:** month-by-month impact.

## 📁 Structure
```
server/   Express API (routes/, middleware/, db.js, seed.js)
public/   Frontend pages, css/, js/ (co2.js = shared calculation logic)
data/     SQLite database file (auto-created)
```
