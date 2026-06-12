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
  if (res.status === 204) return null;
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

// ── Track Records API (student-editable) ─────────────────────────────────────

export async function getTrackRecord(studentId) {
  return apiFetch(`${BASE}/track-records/${studentId}`);
}

export async function saveTrackRecord(studentId, data) {
  return apiFetch(`${BASE}/track-records/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Partial save helpers (read-modify-write pattern) ─────────────────────────

export async function addCertification(studentId, cert) {
  const record = (await getTrackRecord(studentId)) || {};
  const updated = {
    ...record,
    certifications: [...(record.certifications || []), cert],
  };
  return saveTrackRecord(studentId, updated);
}

export async function addProject(studentId, project) {
  const record = (await getTrackRecord(studentId)) || {};
  const updated = {
    ...record,
    projects: [...(record.projects || []), project],
  };
  return saveTrackRecord(studentId, updated);
}

export async function addInternship(studentId, internship) {
  const record = (await getTrackRecord(studentId)) || {};
  const updated = {
    ...record,
    internships: [...(record.internships || []), internship],
  };
  return saveTrackRecord(studentId, updated);
}

export async function addExamResult(studentId, examResult) {
  const record = (await getTrackRecord(studentId)) || {};
  const updated = {
    ...record,
    examResults: [...(record.examResults || []), examResult],
  };
  return saveTrackRecord(studentId, updated);
}

export async function saveYearCgpas(studentId, yearCgpas) {
  const record = (await getTrackRecord(studentId)) || {};
  const updated = { ...record, yearCgpas };
  return saveTrackRecord(studentId, updated);
}

export async function saveSemesters(studentId, semesters) {
  const record = (await getTrackRecord(studentId)) || {};
  const updated = { ...record, semesters };
  return saveTrackRecord(studentId, updated);
}

// ── Admin Marks API ───────────────────────────────────────────────────────────

export async function saveAdminMarks(studentId, adminMarks) {
  return apiFetch(`${BASE}/track-records/${studentId}/admin-marks`, {
    method: 'PUT',
    body: JSON.stringify(adminMarks),
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

// ── Analytics API — fetch all track records for charts ────────────────────────

export async function getAllTrackRecords() {
  return apiFetch(`${BASE}/track-records`);
}
