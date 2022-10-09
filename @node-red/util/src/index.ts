/* !
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

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
export const init = (settings) => {
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
