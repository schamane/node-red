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
exports.localfilesystem = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const node_path_1 = __importDefault(require("node:path"));
const util_js_1 = __importDefault(require("./util.js"));
const library_js_1 = __importDefault(require("./library.js"));
const sessions_js_1 = __importDefault(require("./sessions.js"));
const settings_js_1 = __importDefault(require("./settings.js"));
const index_js_1 = __importDefault(require("./projects/index.js"));
const initialFlowLoadComplete = false;
let settings;
function checkForConfigFile(dir) {
    return fs_extra_1.default.existsSync(node_path_1.default.join(dir, '.config.json')) || fs_extra_1.default.existsSync(node_path_1.default.join(dir, '.config.nodes.json'));
}
exports.localfilesystem = {
    async init(_settings, runtime) {
        settings = _settings;
        if (!settings.userDir) {
            if (checkForConfigFile(process.env.NODE_RED_HOME)) {
                settings.userDir = process.env.NODE_RED_HOME;
            }
            else if (process.env.HOMEPATH && checkForConfigFile(node_path_1.default.join(process.env.HOMEPATH, '.node-red'))) {
                settings.userDir = node_path_1.default.join(process.env.HOMEPATH, '.node-red');
            }
            else {
                settings.userDir = node_path_1.default.join(process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || process.env.NODE_RED_HOME, '.node-red');
            }
        }
        if (!settings.readOnly) {
            await fs_extra_1.default.ensureDir(node_path_1.default.join(settings.userDir, 'node_modules'));
        }
        sessions_js_1.default.init(settings);
        await settings_js_1.default.init(settings);
        await library_js_1.default.init(settings);
        await index_js_1.default.init(settings, runtime);
        const packageFile = node_path_1.default.join(settings.userDir, 'package.json');
        if (!settings.readOnly) {
            try {
                fs_extra_1.default.statSync(packageFile);
            }
            catch (err) {
                const defaultPackage = {
                    name: 'node-red-project',
                    description: 'A Node-RED Project',
                    version: '0.0.1',
                    private: true
                };
                return util_js_1.default.writeFile(packageFile, JSON.stringify(defaultPackage, undefined, 4));
            }
        }
    },
    getFlows: index_js_1.default.getFlows,
    saveFlows: index_js_1.default.saveFlows,
    getCredentials: index_js_1.default.getCredentials,
    saveCredentials: index_js_1.default.saveCredentials,
    getSettings: settings_js_1.default.getSettings,
    saveSettings: settings_js_1.default.saveSettings,
    getSessions: sessions_js_1.default.getSessions,
    saveSessions: sessions_js_1.default.saveSessions,
    getLibraryEntry: library_js_1.default.getLibraryEntry,
    saveLibraryEntry: library_js_1.default.saveLibraryEntry,
    projects: index_js_1.default
};
//# sourceMappingURL=index.js.map