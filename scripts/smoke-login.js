/**
 * scripts/smoke-login.js
 * FakeStore Login — Smoke Test
 *
 * Purpose: Quick connectivity and script validation BEFORE running the full load test.
 * Run this first to confirm:
 *   - Endpoint is reachable
 *   - CSV is loaded correctly
 *   - Response format is valid (status 200/201 + token)
 *   - Script mechanics work end-to-end
 *
 * Profile: constant-arrival-rate @ 5 req/s for 10 seconds
 *
 * Run:
 *   k6 run scripts/smoke-login.js
 *
 * Expected outcome:
 *   SLA thresholds green, no threshold failures, ~50 iterations.
 */

import http from 'k6/http';
import { smokeOptions } from '../config/options.js';
import { ENV } from '../config/env.js';
import { getCredentials, getCredential, buildLoginPayload } from '../lib/utils.js';
import { validateLoginResponse, extractToken } from '../lib/checks.js';
import { recordLoginResult } from '../lib/metrics.js';

// ── Export smoke test options ──────────────────────────────────────────────────
export const options = smokeOptions;

// ── Credentials (init context) ─────────────────────────────────────────────────
// getCredentials() initializes SharedArray on first call (init context only).
const credentials = getCredentials();

// ── Setup ──────────────────────────────────────────────────────────────────────
export function setup() {
  console.log('\n=== FakeStore Login — Smoke Test ===');
  console.log(`  Endpoint : ${ENV.BASE_URL}${ENV.LOGIN_ENDPOINT}`);
  console.log(`  Users    : ${credentials.length} loaded from CSV`);
  console.log(`  Profile  : 5 req/s for 10s`);
  console.log(`  Timeout  : ${ENV.REQUEST_TIMEOUT} per request`);
  console.log('  Purpose  : Connectivity and script validation\n');
}

// ── Main VU function ───────────────────────────────────────────────────────────
export default function () {
  const credential = getCredential(credentials);
  const payload    = buildLoginPayload(credential);

  const response = http.post(
    `${ENV.BASE_URL}${ENV.LOGIN_ENDPOINT}`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
      timeout: ENV.REQUEST_TIMEOUT,
    }
  );

  const passed = validateLoginResponse(response);
  const token = extractToken(response);
  recordLoginResult(token !== null);

  // Log first iteration details for quick visual inspection (VU 1 only)
  if (__ITER === 0 && __VU === 1) {
    console.log('\n[SMOKE] First response details:');
    console.log(`  Status   : ${response.status}`);
    console.log(`  Duration : ${response.timings.duration.toFixed(0)}ms`);
    console.log(`  Token    : ${token ? token.substring(0, 30) + '...' : 'NOT FOUND'}`);
    console.log(`  Checks   : ${passed ? 'ALL PASSED' : 'ONE OR MORE FAILED'}\n`);
  }
}

// ── Teardown ───────────────────────────────────────────────────────────────────
export function teardown() {
  console.log('\n=== Smoke Test Complete ===');
  console.log('  Review the checks summary above.');
  console.log('  If thresholds are green → proceed with: k6 run scripts/load-login.js\n');
}
