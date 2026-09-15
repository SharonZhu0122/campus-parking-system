const API_BASE = 'http://localhost:4000';

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

export async function register(username, password) {
  const response = await fetch(`${API_BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
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

export async function getViolations() {
  const response = await fetch(`${API_BASE}/api/admin/violations`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Could not load violations');
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
