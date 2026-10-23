# Campus Parking frontend

React frontend for the Campus Parking Availability and Violation Monitoring System. It provides gate occupancy and maps, busy times and forecasts, parking questions, driver account pages, and admin violation management.

See the [project README](../README.md) for backend setup, database configuration, API routes and project limitations. Parking data is simulated.

## Run locally

Use Node.js 20.19+ within the 20.x release line, or Node.js 22.12+. Start the backend using the project README, then open another terminal in the project root:

```bash
cd frontend
npm install
npm run dev
```

Vite normally serves the frontend at `http://localhost:5173`. Check the terminal for the actual address if that port is occupied.

## API configuration

The default API address is `http://localhost:4000`. To override it, set the following in `frontend/.env.local`:

```dotenv
VITE_API_BASE=http://localhost:4000
```

Restart Vite after changing this file. The backend CORS configuration must allow the frontend origin. For a deployed build, set `VITE_API_BASE` before building; Vite embeds it in the generated files.

## Checks and build

Run from `frontend/`:

```bash
npm run lint
npm run build
npm run preview
```

`lint` runs Oxlint, `build` writes the production files to `dist/`, and `preview` serves that build locally. Previewing the frontend still requires a running backend for API features. The frontend currently has no automated test script; backend tests are documented in the project README.

## Source layout

- `src/App.jsx`: page selection and login-related UI state.
- `src/api.js`: requests to the backend API.
- `src/occupancy/`, `src/busytimes/`, `src/admin/`, `src/vehicle/`: feature components and data hooks.
- `src/account/`, `src/faq/`: account forms and parking-question components.
- `src/App.css` and `src/index.css`: application and base styles.
