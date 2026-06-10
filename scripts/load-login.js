/**
 * scripts/load-login.js
 * FakeStore Login — Full Load Test (PERF-001)
 *
 * SLA targets:
 *   - Throughput   : >= 20 TPS  (enforced by constant-arrival-rate executor)
 *   - Response time: max < 1500 ms and p(95) < 1500 ms
 *   - Error rate   : < 3%
 *   - Token success: > 97%
 *
 * Load profile (constant-arrival-rate, 3 phases):
 *   warm_up   :  30s @  5 req/s  [0s  – 30s ]
 *   main_load : 120s @ 20 req/s  [30s – 150s]
 *   cool_down :  30s @  5 req/s  [150s – 180s]
 *   Total     : 180s
 *
 * Run:
 *   k6 run scripts/load-login.js
 *
 * Override TPS:
 *   k6 run -e TPS_TARGET=25 scripts/load-login.js
 *
 * Override request timeout:
 *   k6 run -e REQUEST_TIMEOUT=1490ms scripts/load-login.js
 *
 * Override endpoint:
 *   k6 run -e BASE_URL=https://fakestoreapi.com -e TPS_TARGET=20 scripts/load-login.js
 *
 * Reports generated after execution:
 *   reports/textSummary.txt
 *   reports/summary.json
 *
 * ARCHITECTURE NOTE:
 *   SharedArray (in utils.js) is initialized in the init context.
 *   Do NOT pass credentials through setup() → default() via the data parameter,
 *   because K6 JSON-serializes the data object when crossing the VU boundary,
 *   which loses the SharedArray reference. Access credentials directly from the
 *   module-level constant instead.
 */

import http from 'k6/http';
import { loadOptions } from '../config/options.js';
import { ENV } from '../config/env.js';
import { getCredentials, getCredential, buildLoginPayload } from '../lib/utils.js';
import { validateLoginResponse, extractToken } from '../lib/checks.js';
import { recordLoginResult } from '../lib/metrics.js';

// ── Export load test options ───────────────────────────────────────────────────
export const options = loadOptions;

// ── Credentials (init context) ─────────────────────────────────────────────────
// Initialized once, shared across all VUs via SharedArray.
const credentials = getCredentials();

// ── Setup ──────────────────────────────────────────────────────────────────────
export function setup() {
  console.log('\n====================================================');
  console.log('  FakeStore Login — Load Test');
  console.log('====================================================');
  console.log(`  Endpoint  : ${ENV.BASE_URL}${ENV.LOGIN_ENDPOINT}`);
  console.log(`  Users     : ${credentials.length} loaded from data/users.csv`);
  console.log(`  TPS target: ${ENV.TPS_TARGET} req/s (main_load phase)`);
  console.log(`  Timeout   : ${ENV.REQUEST_TIMEOUT} per request`);
  console.log(`  Profile   : warm(5 TPS/30s) → main(${ENV.TPS_TARGET} TPS/120s) → cool(5 TPS/30s)`);
  console.log(`  Duration  : ~180s total`);
  console.log('====================================================\n');

  return {
    startTime: new Date().toISOString(),
    tpsTarget: ENV.TPS_TARGET,
    totalCredentials: credentials.length,
  };
}

// ── Default (Main VU Iteration) ────────────────────────────────────────────────
export default function (data) {
  // Round-robin credential selection across VUs and iterations
  const credential = getCredential(credentials);
  const payload    = buildLoginPayload(credential);

  // POST /auth/login
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

  // Validate response (registers named checks in K6)
  validateLoginResponse(response);

  // Record business metrics
  const token   = extractToken(response);
  const success = token !== null;
  recordLoginResult(success);

  // Debug logging (only when DEBUG_MODE=true)
  if (ENV.DEBUG_MODE) {
    console.log(
      `[VU ${__VU} | Iter ${__ITER}] ` +
      `user=${credential.username} | ` +
      `status=${response.status} | ` +
      `duration=${response.timings.duration.toFixed(0)}ms | ` +
      `token=${success ? 'OK' : 'MISSING'}`
    );
  }
}

// ── Teardown ───────────────────────────────────────────────────────────────────
export function teardown(data) {
  console.log('\n====================================================');
  console.log('  Load Test Complete');
  console.log(`  Start : ${data.startTime}`);
  console.log(`  End   : ${new Date().toISOString()}`);
  console.log('  Review the threshold summary below for SLA results.');
  console.log('  Reports saved to: reports/textSummary.txt');
  console.log('                    reports/summary.json');
  console.log('====================================================\n');
}

// ── handleSummary ──────────────────────────────────────────────────────────────
// Generates human-readable and machine-readable reports after test completion.
export function handleSummary(data) {
  return {
    'stdout':                   buildTextSummary(data),
    'reports/textSummary.txt':  buildTextSummary(data),
    'reports/summary.json':     JSON.stringify(data, null, 2),
  };
}

// ── Internal: Text Summary Builder ────────────────────────────────────────────

function fmt(value, decimals) {
  if (value === undefined || value === null) return 'N/A';
  return typeof value === 'number' ? value.toFixed(decimals || 2) : String(value);
}

function buildTextSummary(data) {
  const m    = data.metrics;
  const dur  = m['http_req_duration'];
  const fail = m['http_req_failed'];
  const reqs = m['http_reqs'];
  const wait = m['http_req_waiting'];
  const slr  = m['login_success_rate'];
  const att  = m['login_attempts'];
  const suc  = m['login_successes'];
  const fal  = m['login_failures'];
  const drp  = m['dropped_iterations'];
  const chk  = m['checks'];   // ← global checks metric (was missing before)

  const lines = [
    '',
    '====================================================',
    '  FakeStore Login — Load Test Summary',
    `  Generated : ${new Date().toISOString()}`,
    '====================================================',
    '',
    '--- THROUGHPUT ---',
    `  Total requests    : ${reqs  ? fmt(reqs.values.count, 0)     : 'N/A'}`,
    `  Actual RPS        : ${reqs  ? fmt(reqs.values.rate, 2)      : 'N/A'} req/s`,
    `  Dropped iters     : ${drp   ? fmt(drp.values.count, 0)      : '0'}`,
    '',
    '--- RESPONSE TIME ---',
    `  avg               : ${dur   ? fmt(dur.values.avg)            : 'N/A'} ms`,
    `  p(50) — median   : ${dur   ? fmt(dur.values['med'])          : 'N/A'} ms`,
    `  p(90)             : ${dur   ? fmt(dur.values['p(90)'])       : 'N/A'} ms`,
    `  p(95)             : ${dur   ? fmt(dur.values['p(95)'])       : 'N/A'} ms  [SLA: < 1500 ms]`,
    `  max               : ${dur   ? fmt(dur.values.max)            : 'N/A'} ms  [SLA: < 1500 ms]`,
    `  TTFB p(95)        : ${wait  ? fmt(wait.values['p(95)'])      : 'N/A'} ms`,
    '',
    '--- ERROR RATE ---',
    `  HTTP failure rate : ${fail  ? fmt(fail.values.rate * 100)    : 'N/A'} %  [SLA: < 3 %]`,
    '',
    '--- BUSINESS METRICS ---',
    `  Login attempts    : ${att   ? fmt(att.values.count, 0)       : 'N/A'}`,
    `  Login successes   : ${suc   ? fmt(suc.values.count, 0)       : 'N/A'}`,
    `  Login failures    : ${fal   ? fmt(fal.values.count, 0)       : '0'}`,
    `  Token success rate: ${slr   ? fmt(slr.values.rate * 100)     : 'N/A'} %  [SLA: > 97 %]`,
    '',
    '--- CHECKS (ALL NAMED CHECKS) ---',
    `  Total checks      : ${chk   ? (chk.values.passes + chk.values.fails) : 'N/A'}`,
    `  Passed            : ${chk   ? chk.values.passes                       : 'N/A'}`,
    `  FAILED            : ${chk   ? chk.values.fails                        : 'N/A'}  ${chk && chk.values.fails > 0 ? '<-- SEE NOTE BELOW' : ''}`,
    `  Pass rate         : ${chk   ? fmt(chk.values.rate * 100)              : 'N/A'} %`,
    ...(chk && chk.values.fails > 0 ? [
      '',
      `  NOTE: ${chk.values.fails} check(s) failed. These may include requests`,
      '  that exceeded the 1500ms SLA and were cut by REQUEST_TIMEOUT.',
      '  The test remains valid only if the global checks threshold stays',
      '  above 97%, aligned with the allowed error budget.',
    ] : []),
    '',
    '--- THRESHOLDS ---',
  ];

  // Append threshold pass/fail
  for (const [metricName, metric] of Object.entries(m)) {
    if (metric.thresholds) {
      for (const [condition, result] of Object.entries(metric.thresholds)) {
        const icon = result.ok ? '  \u2713' : '  \u2717';
        lines.push(`${icon} ${metricName}: ${condition}`);
      }
    }
  }

  lines.push('');
  lines.push('====================================================');
  lines.push('');

  return lines.join('\n');
}
