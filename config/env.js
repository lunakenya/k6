/**
 * config/env.js
 * Centralized environment configuration for FakeStore Login Load Test.
 * All values read from __ENV (k6 -e flag) with sensible defaults.
 *
 * Override examples:
 *   k6 run -e TPS_TARGET=25 scripts/load-login.js
 *   k6 run -e BASE_URL=https://fakestoreapi.com scripts/load-login.js
 *   k6 run -e REQUEST_TIMEOUT=1490ms scripts/load-login.js
 *   k6 run -e DEBUG_MODE=true scripts/smoke-login.js
 */

export const ENV = {
  // ── API Configuration ──────────────────────────────────────────────────────
  BASE_URL:        __ENV.BASE_URL        || 'https://fakestoreapi.com',
  LOGIN_ENDPOINT:  __ENV.LOGIN_ENDPOINT  || '/auth/login',

  // ── Load Parameters ────────────────────────────────────────────────────────
  // TPS_TARGET is used by options.js to set the constant-arrival-rate.
  TPS_TARGET: __ENV.TPS_TARGET ? parseInt(__ENV.TPS_TARGET, 10) : 20,

  // Phase durations (seconds)
  WARM_UP_DURATION:   __ENV.WARM_UP_DURATION   || '30s',
  MAIN_LOAD_DURATION: __ENV.MAIN_LOAD_DURATION || '120s',
  COOL_DOWN_DURATION: __ENV.COOL_DOWN_DURATION || '30s',

  // Warm-up and cool-down TPS (fraction of main load)
  WARM_TPS:      __ENV.WARM_TPS ? parseInt(__ENV.WARM_TPS, 10) : 5,
  COOL_DOWN_TPS: __ENV.COOL_DOWN_TPS ? parseInt(__ENV.COOL_DOWN_TPS, 10) : 5,

  // ── Request Configuration ──────────────────────────────────────────────────
  // Per-request timeout. It is intentionally below the 1500ms SLA so any
  // request exceeding the allowed response time is cut and counted as failed.
  REQUEST_TIMEOUT: __ENV.REQUEST_TIMEOUT || '1490ms',

  // SLA threshold in milliseconds
  RESPONSE_TIME_SLA_MS: 1500,

  // ── Developer Options ──────────────────────────────────────────────────────
  DEBUG_MODE: __ENV.DEBUG_MODE === 'true',
};
