# Campus Parking Availability and Violation Monitoring System

COMPX576 Programming Project, University of Waikato. Sharon Zhu, student ID 1666262.

A website that shows how many spaces are free at each of the five student gates, shows when each car park is usually busy, answers parking questions, and lets parking staff handle violations. The campus has no working parking sensors, so the parking data is **simulated**, using the real capacity of each gate (Gate 1: 487, Gate 2b: 239, Gate 3A: 101, Gate 3B: 60, Gate 10: 281).

## What it does

### Anyone (no login)

- View free spaces at each gate, refreshed every 5 seconds, and open gate or campus maps.
- Check current busyness, usual busy hours for each day of the week, and a next-hour forecast with a backtest.
- See warnings before busy university dates.
- Ask the Gemini parking assistant, read the FAQ, or submit a question for staff.
- Follow a link to PayMyPark for payment.

### Registered drivers

- Register with a username containing only English letters and digits, a plate number, email and phone number.
- View violations recorded against their registered plate in **My vehicle**.
- Update their plate, contact details and password in **Account settings**.
- Request a password-reset email when email delivery is configured.

### Admins

- View open violations in an auto-refreshing list and resolved violations in the **Handled** tab.
- Add violations found on patrol, edit open records, and resolve them as ticket issued, false positive or other.
- View a simulated owner-notification status; violation notifications are not sent as real messages.
- Replace open automatic detections with 19 random demo violations, keeping manual and resolved records.
- Read questions submitted by visitors.

## How it works

- **Data generator** (`backend/src/services/dataGenerator.js`): every 2 minutes it adds simulated parked cars for each gate. How many depends on the gate, the day of the week and the New Zealand time. All the numbers are in `simulationConfig.js`.
- **Rule engine** (`ruleEngine.js`): every parking record is checked for three violations: a reserved bay, unpaid parking in paid hours (weekdays 8:30am to 4:30pm, New Zealand time), and an invalid mobility card.
- **Busy times** (`typicalDay.js`): the usual pattern is calculated from the same simulation numbers, so it matches what the generator produces on an average day.
- **Forecast** (`predictions.js`): moving average and simple linear regression for the next hour, compared by a walk-forward backtest.
- **Assistant** (`assistant.js`): Google Gemini, prompted to answer from a parking fact sheet (`assistantKnowledge.js`), with rate limiting.

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

You need **Node.js 20.19+ within the 20.x release line, or Node.js 22.12+**, and **MySQL 8**. These Node.js versions match the current frontend tooling requirements.

Start in the project root. Keep the backend running in one terminal and use a second terminal for the frontend.

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

`npm start` runs `src/scripts/setup.js` first. It creates missing tables, attempts to add missing columns and the plate-number unique index, and updates gate capacities to the values in the setup script. It can be run again; it is not a versioned migration system. Check the startup output for schema warnings.

To create an admin account, open another terminal in `backend/` and run the command below. There is no admin sign-up page:

```bash
node src/scripts/createAdmin.js admin YourPassword123
```

Drivers register themselves on the website.

### 3. Frontend

Open a second terminal in the project root:

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

The frontend calls `http://localhost:4000` unless `VITE_API_BASE` is set. To use another API address, set it in `frontend/.env.local` and restart Vite. The backend CORS configuration must allow the frontend origin.

To check and build the frontend, run these commands from `frontend/`:

```bash
npm run lint
npm run build
```

### 4. Tests

From the project root:

```bash
cd backend
npm test
```

The backend currently contains 140 tests, including 23 cases for username validation. Jest runs test files sequentially because the integration tests share a database. The integration tests use the database configured in `backend/.env`, require the tables and gate records to exist, and create and delete test records. Use a separate local test database rather than one containing data you need to keep. Run `node src/scripts/setup.js` against that database before testing, and avoid running the app against it at the same time.

The assistant and email tests use fakes, so they need no API keys.

## Settings (`backend/.env`)

| Name | Needed | Meaning |
|---|---|---|
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | yes | MySQL connection (defaults: localhost, campus_parking, root, empty) |
| `JWT_SECRET` | yes | secret used to sign login tokens, use a long random string |
| `PORT` | no | API port, default 4000 |
| `GEMINI_API_KEY` | no | enables the AI assistant (free key from Google AI Studio). Without it the assistant says it is unavailable. |
| `GEMINI_MODEL` | no | default `gemini-3.5-flash-lite` |
| `BREVO_API_KEY`, `MAIL_FROM_EMAIL` | no | both are needed to send forgot-password emails; without either, no email is sent |
| `MAIL_FROM_NAME` | no | email sender name, default `Campus Parking` |
| `APP_URL` | no | website address used in reset links, default `http://localhost:5173` |
| `CORS_ORIGINS` | no | comma-separated websites allowed to call the API, default the deployed site and localhost |

## API overview

### Account

- `POST /api/register`
- `POST /api/login`
- `POST /api/forgot-password`
- `POST /api/reset-password`

### Public parking information and questions

- `GET /api/health`
- `GET /api/gates`
- `GET /api/gates/:id/occupancy`
- `GET /api/gates/:id/busyness`
- `GET /api/gates/:id/predictions`
- `GET /api/alerts`
- `POST /api/assistant`
- `POST /api/inquiries`

### Signed-in driver

- `GET /api/me/vehicle`
- `GET /api/me/profile`
- `PATCH /api/me/profile`
- `PUT /api/me/password`

### Admin only

- `GET /api/admin/violations` (optional `?status=open|resolved|all`)
- `GET /api/admin/violations/summary`
- `POST /api/admin/violations`
- `PATCH /api/admin/violations/:id`
- `PATCH /api/admin/violations/:id/resolve`
- `POST /api/admin/violations/sample`
- `GET /api/admin/inquiries`

Wrong or missing login gives 401, the wrong role gives 403, bad input gives 400, a detected username or plate conflict gives 409, too many attempts gives 429.

## Security measures

Passwords are hashed with bcrypt. Login tokens are signed JWTs that expire after a day, and admin routes check the role. Routes validate input and use Sequelize for application queries. Wrong logins, assistant questions and password-reset requests are rate limited.

Reset tokens are stored as hashes and expire after an hour. A successful reset marks the token as used and removes other unused links for that account. These updates currently run without a transaction or lock, so concurrent requests using the same token are not fully protected.

CORS permits browser access from configured origins; protected routes also require authentication. The central error handler returns generic server-error messages rather than internal error details. Security-related tests are in `backend/src/routes/security.test.js`.

## Not finished (future work)

The entrance kiosk (it needs a physical display at the gate), anomaly flagging, a rule settings page and the patrol priority score. Owner notifications are shown on screen and are not sent as real messages. The occupancy data and the busy-times pattern come from the simulator, so they show the idea, not real accuracy.

## Deployment note

The frontend is hosted on Vercel, and the API and MySQL database are hosted on Railway. After the Railway trial expired, the services were restored on the Hobby plan on 23 October 2026. The live site is available at https://campus-parking-waikato.vercel.app. Local setup remains available using the steps above.
