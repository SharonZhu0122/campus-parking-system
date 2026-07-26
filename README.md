# Campus Parking Availability and Violation Monitoring System

Course project for showing real-time parking occupancy at University of Waikato student gate areas (Gate 1, Gate 2b, Gate 3A, Gate 3B, Gate 10), detecting rule violations, and giving patrol staff a priority list — built on generated virtual parking data since the campus has no working sensors.

## Structure

- `backend/` — Node.js + Express REST API, MySQL via Sequelize, JWT auth, data generator, rule engine, prediction logic.
- `frontend/` — React (Vite) responsive frontend for gate occupancy, admin dashboard, and kiosk display.

## Getting started

### Backend

```bash
cd backend
cp .env.example .env   # fill in your local MySQL credentials
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Tech stack

React, Node.js/Express, MySQL (Sequelize), JWT auth, node-cron (data generator), Jest + Postman (testing).
