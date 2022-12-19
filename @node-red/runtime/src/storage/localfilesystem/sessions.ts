/**
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

import fs from 'fs-extra';
import fspath from 'node:path';
import { log } from '@node-red/util';
import util from './util.js';

let sessionsFile;
let settings;

export default {
  init(_settings) {
    settings = _settings;
    sessionsFile = fspath.join(settings.userDir, '.sessions.json');
  },
  async getSessions() {
    return new Promise(function (resolve, reject) {
      fs.readFile(sessionsFile, 'utf8', function (err, data) {
        if (!err) {
          try {
            return resolve(util.parseJSON(data));
          } catch (err2) {
            log.trace('Corrupted sessions file - resetting');
          }
        }
        resolve({});
      });
    });
  },
  saveSessions(sessions) {
    if (settings.readOnly) {
      return;
    }
    return util.writeFile(sessionsFile, JSON.stringify(sessions));
  }
};
