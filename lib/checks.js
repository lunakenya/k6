/**
 * lib/checks.js
 * Reusable response validation functions for FakeStore Login Load Test.
 *
 * FakeStore API contract for POST /auth/login:
 *   Success: HTTP 200 OR 201 + JSON body { "token": "<jwt>" }
 *
 * IMPORTANT — Asymmetric status check:
 *   FakeStore returns HTTP 201 (not 200) on successful login.
 *   The check accepts both 200 and 201 to be resilient to API quirks.
 *   A 200 response without a token is still considered a functional failure.
 *
 * NOTE: All check functions return boolean and register named checks in K6.
 */

import { check } from 'k6';
import { ENV } from '../config/env.js';

/**
 * Validate a login response against all SLA criteria.
 *
 * Checks registered:
 *   1. 'status is 200 or 201'  — HTTP status code (asymmetric: FakeStore uses 201)
 *   2. 'response has token'    — Business validation (200 without token = functional fail)
 *   3. 'responds within SLA'   — Per-request timing SLA (1500 ms)
 *
 * @param {Response} response - K6 HTTP response object
 * @returns {boolean} true if ALL checks pass
 */
export function validateLoginResponse(response) {
  let hasToken = false;

  // Safe JSON parse — FakeStore occasionally returns non-JSON on errors
  try {
    const body = response.json();
    hasToken = body !== null
      && typeof body === 'object'
      && typeof body.token === 'string'
      && body.token.length > 0;
  } catch (_) {
    hasToken = false;
  }

  const allPassed = check(response, {
    // FakeStore returns 201 on success — accept both 200 and 201
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    // A 200/201 without a token is a functional failure
    'response has token': () => hasToken,
    // Per-request SLA: response must complete within 1500ms
    [`responds within ${ENV.RESPONSE_TIME_SLA_MS}ms`]: (r) =>
      r.timings.duration < ENV.RESPONSE_TIME_SLA_MS,
  });

  return allPassed;
}

/**
 * Extract the token from a response body.
 * Returns the token string if present, or null.
 *
 * @param {Response} response - K6 HTTP response object
 * @returns {string|null}
 */
export function extractToken(response) {
  try {
    const body = response.json();
    if (body && typeof body.token === 'string' && body.token.length > 0) {
      return body.token;
    }
  } catch (_) {
    // ignore parse error
  }
  return null;
}
