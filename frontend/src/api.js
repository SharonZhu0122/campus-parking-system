const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export async function login(username, password) {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
}

export async function getGates() {
  const response = await fetch(`${API_BASE}/api/gates`);
  if (!response.ok) {
    throw new Error('Could not load gate list');
  }
  return response.json();
}

export async function getGateOccupancy(gateId) {
  const response = await fetch(`${API_BASE}/api/gates/${gateId}/occupancy`);
  if (!response.ok) {
    throw new Error('Could not load occupancy for this gate');
  }
  return response.json();
}

export async function register(username, password, plateNumber, contactEmail, phoneNumber) {
  const response = await fetch(`${API_BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, plateNumber, contactEmail, phoneNumber }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  return data;
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getViolations(status = 'open') {
  const response = await fetch(`${API_BASE}/api/admin/violations?status=${status}&limit=100`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Could not load violations');
  }
  return response.json();
}

export async function getViolationSummary() {
  const response = await fetch(`${API_BASE}/api/admin/violations/summary`, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error('Could not load violation totals');
  }
  return response.json();
}

export function createViolation(details) {
  return sendJson('/api/admin/violations', 'POST', details, 'Could not add the violation');
}

export function updateViolation(id, changes) {
  return sendJson(`/api/admin/violations/${id}`, 'PATCH', changes, 'Could not save the changes');
}

export async function getPredictions(gateId) {
  const response = await fetch(`${API_BASE}/api/gates/${gateId}/predictions`);
  if (!response.ok) {
    throw new Error('Could not load predictions');
  }
  return response.json();
}

export async function getBusyness(gateId) {
  const response = await fetch(`${API_BASE}/api/gates/${gateId}/busyness`);
  if (!response.ok) {
    throw new Error('Could not load busy times');
  }
  return response.json();
}

export async function getMyVehicle() {
  const response = await fetch(`${API_BASE}/api/me/vehicle`, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error('Could not load your vehicle. Please log in again.');
  }
  return response.json();
}

async function sendJson(path, method, body, fallbackMessage) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }
  return data;
}

export async function getProfile() {
  const response = await fetch(`${API_BASE}/api/me/profile`, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error('Could not load your account. Please log in again.');
  }
  return response.json();
}

export function updateProfile(changes) {
  return sendJson('/api/me/profile', 'PATCH', changes, 'Could not save your changes');
}

export function changePassword(currentPassword, newPassword) {
  return sendJson('/api/me/password', 'PUT', { currentPassword, newPassword }, 'Could not change your password');
}

export function requestPasswordReset(email) {
  return sendJson('/api/forgot-password', 'POST', { email }, 'Could not send the reset email');
}

export function resetPassword(token, newPassword) {
  return sendJson('/api/reset-password', 'POST', { token, newPassword }, 'Could not reset your password');
}

export async function getAlerts() {
  // ?today=YYYY-MM-DD on the page address previews the banner on another date.
  const preview = new URLSearchParams(window.location.search).get('today');
  const query = preview ? `?today=${encodeURIComponent(preview)}` : '';
  const response = await fetch(`${API_BASE}/api/alerts${query}`);
  if (!response.ok) return [];
  return (await response.json()).alerts;
}

export async function submitInquiry(question, email) {
  const response = await fetch(`${API_BASE}/api/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Could not submit your question');
  }
  return data;
}

export async function askAssistant(question) {
  const response = await fetch(`${API_BASE}/api/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'The assistant is unavailable right now');
  }
  return data.answer;
}

export async function getInquiries() {
  const response = await fetch(`${API_BASE}/api/admin/inquiries`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Could not load inquiries');
  }
  return response.json();
}

export async function resolveViolation(id, resolutionType) {
  const response = await fetch(`${API_BASE}/api/admin/violations/${id}/resolve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ resolutionType }),
  });
  if (!response.ok) {
    throw new Error('Could not resolve this violation');
  }
  return response.json();
}
