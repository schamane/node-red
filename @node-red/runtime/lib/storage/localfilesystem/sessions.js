"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const node_path_1 = __importDefault(require("node:path"));
const util_1 = require("@node-red/util");
const util_js_1 = __importDefault(require("./util.js"));
let sessionsFile;
let settings;
exports.default = {
    init(_settings) {
        settings = _settings;
        sessionsFile = node_path_1.default.join(settings.userDir, '.sessions.json');
    },
    async getSessions() {
        return new Promise(function (resolve, reject) {
            fs_extra_1.default.readFile(sessionsFile, 'utf8', function (err, data) {
                if (!err) {
                    try {
                        return resolve(util_js_1.default.parseJSON(data));
                    }
                    catch (err2) {
                        util_1.log.trace('Corrupted sessions file - resetting');
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
        return util_js_1.default.writeFile(sessionsFile, JSON.stringify(sessions));
    }
};
//# sourceMappingURL=sessions.js.map