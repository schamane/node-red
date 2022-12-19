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
const util_js_1 = __importDefault(require("./util.js"));
const configSections = ['nodes', 'users', 'projects', 'modules'];
const settingsCache = { runtime: undefined };
let globalSettingsFile;
let globalSettingsBackup;
let settings;
async function migrateToMultipleConfigFiles() {
    const nodesFilename = getSettingsFilename('nodes');
    if (fs_extra_1.default.existsSync(nodesFilename)) {
        // We have both .config.json and .config.nodes.json
        // Use the more recently modified. This handles users going back to pre1.2
        // and up again.
        // We can remove this logic in 1.3+ and remove the old .config.json file entirely
        //
        const fsStatNodes = await fs_extra_1.default.stat(nodesFilename);
        const fsStatGlobal = await fs_extra_1.default.stat(globalSettingsFile);
        if (fsStatNodes.mtimeMs > fsStatGlobal.mtimeMs) {
            // .config.nodes.json is newer than .config.json - no migration needed
            return;
        }
    }
    const data = await util_js_1.default.readFile(globalSettingsFile, globalSettingsBackup, {});
    // In a later release we should remove the old settings file. But don't do
    // that *yet* otherwise users won't be able to downgrade easily.
    return writeSettings(data); // .then( () => fs.remove(globalSettingsFile) );
}
/**
 * Takes the single settings object and splits it into separate files. This makes
 * it easier to backup selected parts of the settings and also helps reduce the blast
 * radius if a file is lost.
 *
 * The settings are written to four files:
 *  - .config.nodes.json - the node registry
 *  - .config.users.json - user specific settings (eg editor settings)
 *  - .config.projects.json - project settings, including the active project
 *  - .config.modules.json - external modules installed by the runtime
 *  - .config.runtime.json - everything else - most notable _credentialSecret
 */
function writeSettings(data) {
    const configKeys = Object.keys(data);
    const writePromises = [];
    configSections.forEach((key) => {
        const sectionData = data[key] || {};
        delete data[key];
        const sectionFilename = getSettingsFilename(key);
        const sectionContent = JSON.stringify(sectionData, null, 4);
        if (sectionContent !== settingsCache[key]) {
            settingsCache[key] = sectionContent;
            writePromises.push(util_js_1.default.writeFile(sectionFilename, sectionContent, sectionFilename + '.backup'));
        }
    });
    // Having extracted nodes/users/projects, write whatever is left to the runtime config
    const sectionFilename = getSettingsFilename('runtime');
    const sectionContent = JSON.stringify(data, null, 4);
    if (sectionContent !== settingsCache.runtime) {
        settingsCache.runtime = sectionContent;
        writePromises.push(util_js_1.default.writeFile(sectionFilename, sectionContent, sectionFilename + '.backup'));
    }
    return Promise.all(writePromises);
}
async function readSettings() {
    // Read the 'runtime' settings file first
    const runtimeFilename = getSettingsFilename('runtime');
    const result = await util_js_1.default.readFile(runtimeFilename, runtimeFilename + '.backup', {});
    settingsCache.runtime = JSON.stringify(result, null, 4);
    const readPromises = [];
    // Read the other settings files and add them into the runtime settings
    configSections.forEach((key) => {
        const sectionFilename = getSettingsFilename(key);
        readPromises.push(util_js_1.default.readFile(sectionFilename, sectionFilename + '.backup', {}).then((sectionData) => {
            settingsCache[key] = JSON.stringify(sectionData, null, 4);
            if (Object.keys(sectionData).length > 0) {
                result[key] = sectionData;
            }
        }));
    });
    return Promise.all(readPromises).then(() => result);
}
function getSettingsFilename(section) {
    return node_path_1.default.join(settings.userDir, `.config.${section}.json`);
}
exports.default = {
    init(_settings) {
        settings = _settings;
        globalSettingsFile = node_path_1.default.join(settings.userDir, '.config.json');
        globalSettingsBackup = node_path_1.default.join(settings.userDir, '.config.json.backup');
        if (fs_extra_1.default.existsSync(globalSettingsFile) && !settings.readOnly) {
            return migrateToMultipleConfigFiles();
        }
        return Promise.resolve();
    },
    getSettings() {
        return readSettings();
    },
    saveSettings(newSettings) {
        if (settings.readOnly) {
            return Promise.resolve();
        }
        return writeSettings(newSettings);
    }
};
//# sourceMappingURL=settings.js.map