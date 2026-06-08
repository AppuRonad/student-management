// ── Base URLs ────────────────────────────────────────────────────────────────
const BASE = 'http://localhost:8080/api';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
}

// ── Auth API ─────────────────────────────────────────────────────────────────

export async function registerStudent(studentId, password) {
  return apiFetch(`${BASE}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ studentId, password }),
  });
}

export async function loginStudent(studentId, password) {
  return apiFetch(`${BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ studentId, password }),
  });
}

export async function checkRegistered(studentId) {
  const res = await apiFetch(`${BASE}/auth/check/${studentId}`);
  return res?.registered ?? false;
}

// ── Track Records API ─────────────────────────────────────────────────────────

export async function getTrackRecord(studentId) {
  return apiFetch(`${BASE}/track-records/${studentId}`);
}

export async function saveTrackRecord(studentId, data) {
  return apiFetch(`${BASE}/track-records/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Competitions API ──────────────────────────────────────────────────────────

export async function getCompetitions(studentId, category = '') {
  const url = category
    ? `${BASE}/competitions/${studentId}?category=${encodeURIComponent(category)}`
    : `${BASE}/competitions/${studentId}`;
  return apiFetch(url);
}

export async function addCompetition(competition) {
  return apiFetch(`${BASE}/competitions`, {
    method: 'POST',
    body: JSON.stringify(competition),
  });
}

export async function deleteCompetition(id) {
  return apiFetch(`${BASE}/competitions/${id}`, { method: 'DELETE' });
}
