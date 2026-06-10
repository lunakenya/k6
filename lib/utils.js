/**
 * lib/utils.js
 * Shared utilities for FakeStore Login Load Test.
 *
 * CSV Loading Strategy:
 *   K6 requires all file I/O to happen in the INIT CONTEXT (module top-level).
 *   SharedArray parses the CSV once and shares the read-only result across all
 *   VUs with minimal memory overhead.
 *
 * Path resolution:
 *   open() resolves paths relative to the SCRIPT FILE that imports this module,
 *   not the process CWD. Since scripts/ imports lib/utils.js, the relative path
 *   from utils.js to the CSV is '../data/users.csv'.
 */

import { SharedArray } from 'k6/data';
import { ENV } from '../config/env.js';

// ── Shared Credential Dataset (init context) ───────────────────────────────────
// The factory function runs ONCE at startup. All VUs share the same array.
const _credentials = new SharedArray('fakestore-login-credentials', function () {
  const raw = open('../data/users.csv');
  return parseCSV(raw);
});

// ── CSV Parser ─────────────────────────────────────────────────────────────────

/**
 * Parse a CSV string with header row 'user,passwd'.
 * @param {string} raw - Raw CSV file content
 * @returns {Array<{username: string, password: string}>}
 */
function parseCSV(raw) {
  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) {
    throw new Error(
      `CSV must have a header row and at least one data row. Found ${lines.length} line(s).`
    );
  }

  // Validate header
  const header = lines[0];
  if (header !== 'user,passwd') {
    throw new Error(`Expected CSV header "user,passwd" but got "${header}".`);
  }

  // Parse data rows
  const credentials = [];
  for (let i = 1; i < lines.length; i++) {
    const commaIndex = lines[i].indexOf(',');
    if (commaIndex === -1) continue;

    const username = lines[i].substring(0, commaIndex).trim();
    const password = lines[i].substring(commaIndex + 1).trim();

    if (username && password) {
      credentials.push({ username, password });
    }
  }

  if (credentials.length === 0) {
    throw new Error('CSV contains no valid credential rows.');
  }

  return credentials;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Return the full shared credential array.
 * Safe to call from setup(), default(), or teardown().
 * @returns {Array<{username: string, password: string}>}
 */
export function getCredentials() {
  return _credentials;
}

/**
 * Get credential for the current VU iteration using global round-robin.
 * Offset by __VU index so concurrent VUs use different credentials.
 *
 * @param {Array<{username: string, password: string}>} credentials
 * @returns {{username: string, password: string}}
 */
export function getCredential(credentials) {
  const index = (__VU - 1 + __ITER) % credentials.length;

  if (ENV.DEBUG_MODE) {
    console.log(`[VU ${__VU} | Iter ${__ITER}] using: ${credentials[index].username}`);
  }

  return credentials[index];
}

/**
 * Build the JSON payload for POST /auth/login.
 * @param {{username: string, password: string}} credential
 * @returns {string} JSON string
 */
export function buildLoginPayload(credential) {
  return JSON.stringify({
    username: credential.username,
    password: credential.password,
  });
}
