import { init as logInit } from './log.js';
import { init as i18nInit } from './i18n.js';

/**
 * This module provides common utilities for the Node-RED runtime and editor
 *
 * @namespace @node-red/util
 */

/**
 * Initialise the module with the runtime settings
 * @param {Object} settings
 * @memberof @node-red/util
 */
export const init = (settings): void => {
  logInit(settings);
  i18nInit(settings);
};
/**
 * Logging utilities
 * @mixes @node-red/util_log
 * @memberof @node-red/util
 */
export * as log from './log.js';

/**
 * Internationalization utilities
 * @mixes @node-red/util_i18n
 * @memberof @node-red/util
 */
export * as i18n from './i18n.js';

/**
 * General utilities
 * @mixes @node-red/util_util
 * @memberof @node-red/util
 */
export * as util from './util.js';

/**
 * Runtime events
 * @mixes @node-red/util_event
 * @memberof @node-red/util
 */
export * from './events.js';

/**
 * Run system commands with event-log integration
 * @mixes @node-red/util_exec
 * @memberof @node-red/util
 */
export * as exec from './exec.js';

/**
 * Runtime hooks
 * @mixes @node-red/util_hooks
 * @memberof @node-red/util
 */
export * as hooks from './hooks.js';

export { CustomErrorWithCode } from './error.js';
