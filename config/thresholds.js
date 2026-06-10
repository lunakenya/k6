/**
 * config/thresholds.js
 * SLA threshold definitions for FakeStore Login Load Test.
 *
 * SLA requirements from the challenge:
 *   - Throughput  : >= 20 TPS (enforced by constant-arrival-rate executor)
 *   - Response time: max < 1500 ms and p(95) < 1500 ms
 *   - Error rate  : < 3%
 *   - Token success: > 97% (business metric)
 */

export const thresholds = {
  /**
   * SMOKE — Same SLA rules as the load test, at lower volume.
   * Purpose: Confirm endpoint is reachable before committing to the main load.
   */
  smoke: {
    http_req_failed: ['rate<0.03'],
    http_req_duration: ['max<1500', 'p(95)<1500'],
    login_success_rate: ['rate>0.97'],
    checks: ['rate>0.97'],
  },

  /**
   * LOAD — Hard SLA bounds measured during the main_load phase.
   * All criteria must pass for the test to exit with status 0.
   */
  load: {
    // === SLA #1: Error rate < 3% ===
    http_req_failed: ['rate<0.03'],

    // === SLA #2: Response time max < 1500 ms and p(95) < 1500 ms ===
    // REQUEST_TIMEOUT is set below 1500ms so requests that exceed the
    // maximum allowed time are cut and counted as failed.
    http_req_duration: [
      'max<1500',
      'p(95)<1500',
    ],

    // === SLA #3: Business metric — token success rate > 97% ===
    login_success_rate: ['rate>0.97'],

    // === SLA guard: Per-request checks aligned with the 3% error budget ===
    checks: ['rate>0.97'],
  },
};

/**
 * Threshold interpretation guide:
 *
 * PASS (exit code 0):
 *   ✓ http_req_failed rate < 3%
 *   ✓ http_req_duration max < 1500 ms
 *   ✓ http_req_duration p(95) < 1500 ms
 *   ✓ login_success_rate > 97%
 *
 * FAIL (exit code non-zero):
 *   ✗ Any of the above conditions are not met.
 *   ✗ The test also fails if dropped_iterations > 0 and the target TPS
 *     was not sustained — check the execution summary for context.
 */
