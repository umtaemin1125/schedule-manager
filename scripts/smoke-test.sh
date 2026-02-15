#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[smoke] running API smoke tests in backend container..."

docker compose exec -T backend node - <<'NODE'
const base = 'http://localhost:4000/api';

async function http(path, init = {}) {
  const res = await fetch(base + path, init);
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const random = Math.random().toString(36).slice(2, 8);
const userEmail = `user_${random}@example.com`;
const adminEmail = `admin_${random}@example.com`;
const headers = { 'Content-Type': 'application/json' };

(async () => {
  let r;

  r = await http('/schedules');
  assert(r.status === 401, `expected 401 for unauthenticated schedules, got ${r.status}`);

  r = await http('/auth/register', {
    method: 'POST', headers,
    body: JSON.stringify({ email: userEmail, name: 'Smoke User', password: 'password123' })
  });
  assert(r.status === 201, `register user failed: ${r.status}`);

  r = await http('/auth/register', {
    method: 'POST', headers,
    body: JSON.stringify({ email: adminEmail, name: 'Smoke Admin', password: 'password123' })
  });
  assert(r.status === 201, `register admin candidate failed: ${r.status}`);

  r = await http('/auth/login', {
    method: 'POST', headers,
    body: JSON.stringify({ email: userEmail, password: 'password123' })
  });
  assert(r.status === 200, `login user failed: ${r.status}`);
  const userToken = r.body.accessToken;
  const userId = r.body.user.id;

  r = await http('/auth/login', {
    method: 'POST', headers,
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin12345' })
  });
  assert(r.status === 200, `login bootstrap admin failed: ${r.status}`);
  assert(r.body.user.role === 'ADMIN', 'bootstrap admin role is not ADMIN');
  const superAdminToken = r.body.accessToken;
  const superAdminId = r.body.user.id;

  r = await http('/admin/overview', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert(r.status === 403, `user should not access admin api, got ${r.status}`);

  r = await http('/admin/users', {
    headers: { Authorization: `Bearer ${superAdminToken}` }
  });
  assert(r.status === 200 && Array.isArray(r.body), `admin users list failed: ${r.status}`);
  const adminCandidate = r.body.find((u) => u.email === adminEmail);
  assert(adminCandidate, 'admin candidate user not found');

  r = await http(`/admin/users/${adminCandidate.id}`, {
    method: 'PATCH', headers: { ...headers, Authorization: `Bearer ${superAdminToken}` },
    body: JSON.stringify({ role: 'ADMIN' })
  });
  assert(r.status === 200 && r.body.role === 'ADMIN', `promote to admin failed: ${r.status}`);

  r = await http('/auth/login', {
    method: 'POST', headers,
    body: JSON.stringify({ email: adminEmail, password: 'password123' })
  });
  assert(r.status === 200 && r.body.user.role === 'ADMIN', `new admin login/role failed: ${r.status}`);
  const secondAdminToken = r.body.accessToken;

  r = await http(`/admin/users/${superAdminId}`, {
    method: 'PATCH', headers: { ...headers, Authorization: `Bearer ${superAdminToken}` },
    body: JSON.stringify({ role: 'USER' })
  });
  assert(r.status === 400, `self demotion should fail, got ${r.status}`);

  r = await http('/schedules', {
    method: 'POST', headers: { ...headers, Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({
      title: 'Smoke Meeting',
      description: 'smoke test',
      startAt: '2026-02-15T09:00:00.000Z',
      endAt: '2026-02-15T10:00:00.000Z',
      isAllDay: false
    })
  });
  assert(r.status === 201, `create schedule failed: ${r.status}`);
  const scheduleId = r.body.id;

  r = await http('/admin/schedules', {
    headers: { Authorization: `Bearer ${secondAdminToken}` }
  });
  assert(r.status === 200 && r.body.some((s) => s.id === scheduleId), 'admin cannot list all schedules');

  r = await http(`/admin/schedules/${scheduleId}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${secondAdminToken}` }
  });
  assert(r.status === 204, `admin schedule delete failed: ${r.status}`);

  r = await http(`/admin/users/${adminCandidate.id}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${superAdminToken}` }
  });
  assert(r.status === 204, `admin user delete failed: ${r.status}`);

  r = await http(`/admin/users/${superAdminId}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${superAdminToken}` }
  });
  assert(r.status === 400, `last admin protection should block delete, got ${r.status}`);

  // cleanup test user
  r = await http(`/admin/users/${userId}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${superAdminToken}` }
  });
  assert(r.status === 204, `cleanup user delete failed: ${r.status}`);

  console.log('[smoke] PASS');
})().catch((e) => {
  console.error('[smoke] FAIL', e.message);
  process.exit(1);
});
NODE
