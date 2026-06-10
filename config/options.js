/**
 * config/options.js
 * K6 executor configuration for FakeStore Login Load Test.
 *
 * Strategy: constant-arrival-rate
 *   Guarantees a fixed number of iterations per second regardless of
 *   server response time. This is the correct approach to prove TPS targets.
 *
 * Three-phase load profile (simulated via separate scenario entries):
 *   warm_up   : 30s  @  5 req/s  — system stabilization
 *   main_load : 120s @ 20 req/s  — SLA measurement window
 *   cool_down : 30s  @  5 req/s  — graceful shutdown
 *
 * NOTE: constant-arrival-rate does NOT support stages natively.
 * The three phases are achieved by chaining scenarios with startTime offsets.
 */

import { thresholds } from './thresholds.js';
import { ENV } from './env.js';

/**
 * SMOKE TEST options.
 * Quick connectivity check: 5 req/s for 10 seconds.
 */
export const smokeOptions = {
  scenarios: {
    smoke: {
      executor:        'constant-arrival-rate',
      rate:            5,
      timeUnit:        '1s',
      duration:        '10s',
      preAllocatedVUs: 3,
      maxVUs:          10,
    },
  },
  thresholds: thresholds.smoke,
};

/**
 * LOAD TEST options.
 * Three scenarios chained by startTime:
 *   [0s]    warm_up   starts
 *   [30s]   main_load starts
 *   [150s]  cool_down starts
 *   [180s]  test ends
 */
export const loadOptions = {
  scenarios: {
    warm_up: {
      executor:        'constant-arrival-rate',
      rate:            ENV.WARM_TPS,
      timeUnit:        '1s',
      duration:        ENV.WARM_UP_DURATION,
      preAllocatedVUs: 5,
      maxVUs:          20,
      startTime:       '0s',
    },
    main_load: {
      executor:        'constant-arrival-rate',
      rate:            ENV.TPS_TARGET,          // default: 20 TPS
      timeUnit:        '1s',
      duration:        ENV.MAIN_LOAD_DURATION,  // default: 120s
      preAllocatedVUs: 15,
      maxVUs:          60,                      // headroom for slow responses
      startTime:       '30s',                   // starts after warm_up
    },
    cool_down: {
      executor:        'constant-arrival-rate',
      rate:            ENV.COOL_DOWN_TPS,
      timeUnit:        '1s',
      duration:        ENV.COOL_DOWN_DURATION,
      preAllocatedVUs: 5,
      maxVUs:          20,
      startTime:       '150s',                  // starts after main_load
    },
  },
  thresholds: thresholds.load,
};
