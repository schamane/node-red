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
 * Run system commands with event-log integration
 * @mixin @node-red/util_exec
 */

import ChildProcess from 'node:child_process';
import { events } from './events.js';
import { generateId } from './util.js';

const logLines = (id, type, data) => {
  events.emit('event-log', { id, payload: { ts: Date.now(), data, type } });
};

/**
     * Run a system command with stdout/err being emitted as 'event-log' events
     * on the @node-red/util/events handler.
     *
     * The main arguments to this function are the same as passed to `child_process.spawn`
     *
     * @param {String} command - the command to run
     * @param {Array}  args - arguments for the command
     * @param {Object} options - options to pass child_process.spawn
     * @param {Boolean} emit - whether to emit events to the event-log for each line of stdout/err
     * @return {Promise} A promise that resolves (rc=0) or rejects (rc!=0) when the command completes. The value
     *                   of the promise is an object of the form:
     *
     *       {
     *           code: <exit code>,
     *           stdout: <standard output from the command>,
     *           stderr: <standard error from the command>
     *       }

     * @memberof @node-red/util_exec
     */
export function run(command, args, options, emit) {
  const invocationId = generateId();

  emit && events.emit('event-log', { ts: Date.now(), id: invocationId, payload: { ts: Date.now(), data: command + ' ' + args.join(' ') } });

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const child = ChildProcess.spawn(command, args, options);
    child.stdout.on('data', (data) => {
      const str = '' + data;
      stdout += str;
      emit && logLines(invocationId, 'out', str);
    });
    child.stderr.on('data', (data) => {
      const str = '' + data;
      stderr += str;
      emit && logLines(invocationId, 'err', str);
    });
    child.on('error', function (err) {
      stderr = err.toString();
      emit && logLines(invocationId, 'err', stderr);
    });
    child.on('close', (code) => {
      const result = {
        code,
        stdout,
        stderr
      };
      emit && events.emit('event-log', { id: invocationId, payload: { ts: Date.now(), data: 'rc=' + code } });

      if (code === 0) {
        resolve(result);
      } else {
        reject(result);
      }
    });
  });
}
