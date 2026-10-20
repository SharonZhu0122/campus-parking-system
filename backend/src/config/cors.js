// Which websites may call the API from a browser. Requests with no Origin
// header (curl, tests, server to server) are not browser calls and pass.
const DEFAULT_ORIGINS = [
  'https://campus-parking-waikato.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
];

function allowedOrigins(env = process.env) {
  const configured = (env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_ORIGINS;
}

function corsOptions(env = process.env) {
  const allowed = allowedOrigins(env);
  return {
    origin(origin, callback) {
      callback(null, !origin || allowed.includes(origin));
    },
  };
}

module.exports = { allowedOrigins, corsOptions };
