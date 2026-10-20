# Campus Parking Availability and Violation Monitoring System

COMPX576 Programming Project, University of Waikato. Sharon Zhu, student ID 1666262.

A website that shows how many spaces are free at each of the five student gates, shows when each car park is usually busy, answers parking questions, and lets parking staff handle violations. The campus has no working parking sensors, so the parking data is **simulated**, using the real capacity of each gate (Gate 1: 487, Gate 2b: 239, Gate 3A: 101, Gate 3B: 60, Gate 10: 281).

## What it does

| For | Features |
|---|---|
| Anyone (no login) | Live free spaces per gate, refreshed every 5 seconds. A map for each gate with its car park highlighted, and the campus map. **Busy times**: a status (plenty of space, getting busy, almost full), the usual busy hours for each day of the week, and a next-hour forecast with a backtest. A warning three days before busy university dates. A parking assistant (Gemini) and a fixed FAQ, with a question box for staff. A link to PayMyPark for payment. |
| Registered drivers | Register with a plate, email and phone. **My vehicle** shows violations recorded for their own plate. **Account settings** changes the plate, contact details and password. Forgot password by email. |
| Admins | List of open violations (auto-refreshing), a Handled tab, add a violation found on patrol, edit an open one, resolve it (ticket issued, false positive, other) and notify the owner. A button to fill the list with 19 random demo violations. Visitor questions. |

## How it works

- **Data generator** (`backend/src/services/dataGenerator.js`): every 2 minutes it adds simulated parked cars for each gate. How many depends on the gate, the day of the week and the New Zealand time. All the numbers are in `simulationConfig.js`.
- **Rule engine** (`ruleEngine.js`): every parking record is checked for three violations: a reserved bay, unpaid parking in paid hours (weekdays 8:30am to 4:30pm, New Zealand time), and an invalid mobility card.
- **Busy times** (`typicalDay.js`): the usual pattern is calculated from the same simulation numbers, so it matches what the generator produces on an average day.
- **Forecast** (`predictions.js`): moving average and simple linear regression for the next hour, compared by a walk-forward backtest.
- **Assistant** (`assistant.js`): Google Gemini, limited to a fact sheet (`assistantKnowledge.js`), rate limited.

## Technology

React 19 + Vite (frontend), Node.js + Express 5 (API), MySQL with Sequelize, JWT sign-in with bcrypt password hashes, node-cron, Google Gemini API, Brevo email API, Jest + Supertest (tests). Hosted on Vercel (frontend) and Railway (API and database).

## Project layout

```
backend/
  src/
    app.js, server.js        Express app and entry point
    config/                  database and CORS settings
    middleware/              JWT check, error handling
    models/                  Sequelize models (6 tables)
    routes/                  one file per area, with its tests next to it
    services/                rule engine, simulation, forecast, assistant, mailer
    scripts/                 setup.js (tables and gates), createAdmin.js
    utils/                   validation, rate limiting, NZ time, plates
frontend/
  src/                       one file per page, api.js for all API calls
docs/
  architecture-diagram-final.svg, diagrams.md, report-screenshots/
```

## Running it locally

You need **Node.js 20 or newer** and **MySQL 8**.

### 1. Database

```sql
CREATE DATABASE campus_parking;
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # then edit .env, see the table below
npm install
npm start                   # creates the tables and gates, then starts the API on port 4000
```

`npm start` runs `src/scripts/setup.js` first. It is safe to run again, it only adds what is missing.

Create an admin account (there is no admin sign-up page on purpose):

```bash
node src/scripts/createAdmin.js admin YourPassword123
```

Drivers register themselves on the website.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

The frontend calls `http://localhost:4000` unless `VITE_API_BASE` is set.

### 4. Tests

```bash
cd backend
npm test                    # 117 tests, runs one file at a time because they share one database
```

The tests need the same MySQL database as the app, and they clean up the rows they create. The assistant and email tests use fakes, so they need no API keys.

## Settings (`backend/.env`)

| Name | Needed | Meaning |
|---|---|---|
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | yes | MySQL connection (defaults: localhost, campus_parking, root, empty) |
| `JWT_SECRET` | yes | secret used to sign login tokens, use a long random string |
| `PORT` | no | API port, default 4000 |
| `GEMINI_API_KEY` | no | enables the AI assistant (free key from Google AI Studio). Without it the assistant says it is unavailable. |
| `GEMINI_MODEL` | no | default `gemini-3.5-flash-lite` |
| `BREVO_API_KEY`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME` | no | enables the forgot-password email. Without them no email is sent. |
| `APP_URL` | no | website address used in reset links, default `http://localhost:5173` |
| `CORS_ORIGINS` | no | comma-separated websites allowed to call the API, default the deployed site and localhost |

## API overview

| Area | Routes |
|---|---|
| Account | `POST /api/register`, `POST /api/login`, `POST /api/forgot-password`, `POST /api/reset-password` |
| Public | `GET /api/gates`, `/api/gates/:id/occupancy`, `/busyness`, `/predictions`, `GET /api/alerts`, `POST /api/assistant`, `POST /api/inquiries` |
| Signed-in driver | `GET /api/me/vehicle`, `GET` and `PATCH /api/me/profile`, `PUT /api/me/password` |
| Admin only | `GET /api/admin/violations` (`?status=open|resolved|all`), `GET /violations/summary`, `POST /violations`, `PATCH /violations/:id`, `PATCH /violations/:id/resolve`, `POST /violations/sample`, `GET /api/admin/inquiries` |

Wrong or missing login gives 401, the wrong role gives 403, bad input gives 400, a duplicate gives 409, too many attempts gives 429.

## Security measures

Passwords are hashed with bcrypt. Login tokens are signed JWTs that expire after a day. Admin routes check the role. Input is validated, and all database access goes through Sequelize, which sends values separately from the SQL. Wrong logins are rate limited, so are assistant questions and password-reset requests. Reset links are stored only as hashes, expire after an hour and work once. Only listed websites may call the API from a browser. Errors never reveal internal details. `backend/src/routes/security.test.js` tests these.

## Not finished (future work)

The entrance kiosk (it needs a physical display at the gate), anomaly flagging, a rule settings page and the patrol priority score. Owner notifications are shown on screen and are not sent as real messages. The occupancy data and the busy-times pattern come from the simulator, so they show the idea, not real accuracy.

## Deployment note

The live site used free tiers: Vercel for the frontend and Railway for the API and MySQL. The Railway trial has ended, so the API may be offline. Everything runs locally with the steps above.
