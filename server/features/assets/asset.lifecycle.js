/**
 * Asset Lifecycle State Machine
 *
 * Defines and enforces valid state transitions for assets.
 * REQ-AST-03: Restrict asset updates to valid state transitions.
 */

/**
 * Valid state transitions map.
 * Key: current status — Value: set of allowed next statuses.
 */
const VALID_TRANSITIONS = {
  AVAILABLE: new Set(['ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED']),
  ALLOCATED: new Set(['AVAILABLE', 'LOST']),
  RESERVED: new Set(['AVAILABLE']),
  UNDER_MAINTENANCE: new Set(['AVAILABLE']),
  LOST: new Set([]),
  RETIRED: new Set([]),
  DISPOSED: new Set([]),
};

/**
 * Terminal states — assets in these states cannot be allocated/reserved.
 */
export const TERMINAL_STATES = new Set(['LOST', 'RETIRED', 'DISPOSED']);

/**
 * Checks whether a state transition is permitted.
 *
 * @param {string} currentStatus - Current AssetStatus enum value.
 * @param {string} nextStatus - Intended next AssetStatus enum value.
 * @returns {boolean} true if the transition is allowed.
 */
export function isValidTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.has(nextStatus);
}

/**
 * Asserts that a transition is valid; throws a structured error if not.
 *
 * @param {string} currentStatus - Current AssetStatus enum value.
 * @param {string} nextStatus - Intended next AssetStatus enum value.
 * @throws {Error} with code INVALID_STATE_TRANSITION if blocked.
 */
export function assertValidTransition(currentStatus, nextStatus) {
  if (!isValidTransition(currentStatus, nextStatus)) {
    const error = new Error(
      `Cannot transition asset from '${currentStatus}' to '${nextStatus}'. Invalid lifecycle transition.`
    );
    error.status = 400;
    error.code = 'INVALID_STATE_TRANSITION';
    throw error;
  }
}

/**
 * Returns all valid next states for a given current status.
 *
 * @param {string} currentStatus
 * @returns {string[]}
 */
export function getValidNextStates(currentStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed ? [...allowed] : [];
}

export default { isValidTransition, assertValidTransition, getValidNextStates, TERMINAL_STATES };
