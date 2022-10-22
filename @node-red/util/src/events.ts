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

/**
 * Runtime events
 * @mixin @node-red/util_events
 */
import { EventEmitter } from 'node:events';
import { warn } from './log';

export const events1 = new EventEmitter();

const deprecatedEvents = {
  'nodes-stopped': 'flows:stopped',
  'nodes-started': 'flows:started'
};

function wrapEventFunction(obj, func) {
  obj['_' + func] = obj[func];
  return function (eventName, listener) {
    if (Object.prototype.hasOwnProperty.call(deprecatedEvents, eventName)) {
      const stack = new Error().stack.split('\n');
      // See https://github.com/node-red/node-red/issues/3292
      const location = stack.length > 2 ? stack[2].split('(')[1].slice(0, -1) : '(unknown)';
      warn(`[RED.events] Deprecated use of "${eventName}" event from "${location}". Use "${deprecatedEvents[eventName]}" instead.`);
    }
    // eslint-disable-next-line no-useless-call
    return obj['_' + func].call(obj, eventName, listener);
  };
}

events1.on = wrapEventFunction(events1, 'on');
events1.once = wrapEventFunction(events1, 'once');
events1.addListener = events1.on;

export const events = events1;

/**
 * Runtime events emitter
 * @mixin @node-red/util_events
 */

/**
 * Register an event listener for a runtime event
 * @name on
 * @function
 * @memberof @node-red/util_events
 * @param {String} eventName - the name of the event to listen to
 * @param {Function} listener - the callback function for the event
 */

/**
 * Emit an event to all of its registered listeners
 * @name emit
 * @function
 * @memberof @node-red/util_events
 * @param {String} eventName - the name of the event to emit
 * @param {any} ...args - the arguments to pass in the event
 * @return {Boolean} - whether the event had listeners or not
 */
