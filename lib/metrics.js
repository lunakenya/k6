/**
 * lib/metrics.js
 * Custom K6 metrics for FakeStore Login Load Test.
 *
 * These metrics complement the built-in K6 metrics (http_req_duration,
 * http_req_failed, etc.) with business-level visibility:
 *
 *   login_success_rate  — Rate of iterations that produced a valid token
 *   login_attempts      — Total number of login requests sent
 *   login_successes     — Total successful logins (token received)
 *   login_failures      — Total failed logins (no token or non-200 status)
 *
 * Usage in scripts:
 *   import { recordLoginResult } from '../lib/metrics.js';
 *   recordLoginResult(true);   // after successful login
 *   recordLoginResult(false);  // after failed login
 */

import { Rate, Counter } from 'k6/metrics';

// ── Metric Declarations ────────────────────────────────────────────────────────

/**
 * login_success_rate
 * Proportion of login attempts that returned a valid JWT token.
 * Threshold in thresholds.js: rate > 0.97 (97%)
 */
export const loginSuccessRate = new Rate('login_success_rate');

/**
 * login_attempts
 * Running total of all login requests executed.
 */
export const loginAttempts = new Counter('login_attempts');

/**
 * login_successes
 * Running total of logins that produced a valid token.
 */
export const loginSuccesses = new Counter('login_successes');

/**
 * login_failures
 * Running total of logins that did NOT produce a valid token.
 * Includes: non-200 responses, missing token, JSON parse errors.
 */
export const loginFailures = new Counter('login_failures');

// ── Helper ─────────────────────────────────────────────────────────────────────

/**
 * Record the outcome of a single login attempt across all custom metrics.
 *
 * @param {boolean} success - true if login returned a valid token
 */
export function recordLoginResult(success) {
  loginAttempts.add(1);
  loginSuccessRate.add(success);

  if (success) {
    loginSuccesses.add(1);
  } else {
    loginFailures.add(1);
  }
}
