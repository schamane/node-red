"use strict";
/* eslint-disable no-prototype-builtins */
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
exports.persistentSettings = void 0;
const clone_1 = __importDefault(require("clone"));
const assert_1 = __importDefault(require("assert"));
const util_1 = require("@node-red/util");
// localSettings are those provided in the runtime settings.js file
let localSettings = null;
// globalSettings are provided by storage - .config.json on localfilesystem
let globalSettings = null;
// nodeSettings are those settings that a node module defines as being available
let nodeSettings = null;
// A subset of globalSettings that deal with per-user settings
let userSettings = null;
let disableNodeSettings = null;
let storage = null;
exports.persistentSettings = {
    init(settings) {
        localSettings = settings;
        for (const i in settings) {
            /* istanbul ignore else */
            if (settings.hasOwnProperty(i) && i !== 'load' && i !== 'get' && i !== 'set' && i !== 'available' && i !== 'reset') {
                // Don't allow any of the core functions get replaced via settings
                // eslint-disable-next-line no-loop-func
                (function () {
                    const j = i;
                    // eslint-disable-next-line no-underscore-dangle
                    exports.persistentSettings.__defineGetter__(j, function () {
                        return localSettings[j];
                    });
                    // eslint-disable-next-line no-underscore-dangle
                    exports.persistentSettings.__defineSetter__(j, function () {
                        throw new Error("Property '" + j + "' is read-only");
                    });
                })();
            }
        }
        globalSettings = null;
        nodeSettings = {};
        disableNodeSettings = {};
    },
    load(_storage) {
        storage = _storage;
        return storage.getSettings().then(function (_settings) {
            globalSettings = _settings;
            if (globalSettings) {
                userSettings = globalSettings.users || {};
            }
            else {
                userSettings = {};
            }
        });
    },
    get(prop) {
        if (prop === 'users') {
            throw new Error('Do not access user settings directly. Use settings.getUserSettings');
        }
        if (localSettings.hasOwnProperty(prop)) {
            return (0, clone_1.default)(localSettings[prop]);
        }
        if (globalSettings === null) {
            throw new Error(util_1.log._('settings.not-available'));
        }
        return (0, clone_1.default)(globalSettings[prop]);
    },
    set(prop, value) {
        if (prop === 'users') {
            throw new Error('Do not access user settings directly. Use settings.setUserSettings');
        }
        if (localSettings.hasOwnProperty(prop)) {
            throw new Error(util_1.log._('settings.property-read-only', { prop }));
        }
        if (globalSettings === null) {
            throw new Error(util_1.log._('settings.not-available'));
        }
        const current = globalSettings[prop];
        globalSettings[prop] = (0, clone_1.default)(value);
        try {
            assert_1.default.deepEqual(current, value);
        }
        catch (err) {
            return storage.saveSettings((0, clone_1.default)(globalSettings));
        }
        return Promise.resolve();
    },
    delete(prop) {
        if (localSettings.hasOwnProperty(prop)) {
            throw new Error(util_1.log._('settings.property-read-only', { prop }));
        }
        if (globalSettings === null) {
            throw new Error(util_1.log._('settings.not-available'));
        }
        if (globalSettings.hasOwnProperty(prop)) {
            delete globalSettings[prop];
            return storage.saveSettings((0, clone_1.default)(globalSettings));
        }
        return Promise.resolve();
    },
    available() {
        return globalSettings !== null;
    },
    reset() {
        for (const i in localSettings) {
            /* istanbul ignore else */
            if (localSettings.hasOwnProperty(i)) {
                delete exports.persistentSettings[i];
            }
        }
        localSettings = null;
        globalSettings = null;
        userSettings = null;
        storage = null;
    },
    registerNodeSettings(type, opts) {
        const normalisedType = util_1.util.normaliseNodeTypeName(type);
        for (const property in opts) {
            if (opts.hasOwnProperty(property)) {
                if (!property.startsWith(normalisedType)) {
                    throw new Error("Registered invalid property name '" + property + "'. Properties for this node must start with '" + normalisedType + "'");
                }
            }
        }
        nodeSettings[type] = opts;
    },
    exportNodeSettings(safeSettings) {
        for (const type in nodeSettings) {
            if (nodeSettings.hasOwnProperty(type) && !disableNodeSettings[type]) {
                const nodeTypeSettings = nodeSettings[type];
                for (const property in nodeTypeSettings) {
                    if (nodeTypeSettings.hasOwnProperty(property)) {
                        const setting = nodeTypeSettings[property];
                        if (setting.exportable) {
                            if (safeSettings.hasOwnProperty(property)) {
                                // Cannot overwrite existing setting
                            }
                            else if (localSettings.hasOwnProperty(property)) {
                                safeSettings[property] = localSettings[property];
                            }
                            else if (setting.hasOwnProperty('value')) {
                                safeSettings[property] = setting.value;
                            }
                        }
                    }
                }
            }
        }
        return safeSettings;
    },
    enableNodeSettings(types) {
        types.forEach(function (type) {
            disableNodeSettings[type] = false;
        });
    },
    disableNodeSettings(types) {
        types.forEach(function (type) {
            disableNodeSettings[type] = true;
        });
    },
    getUserSettings(username) {
        return (0, clone_1.default)(userSettings[username]);
    },
    setUserSettings(username, settings) {
        if (globalSettings === null) {
            throw new Error(util_1.log._('settings.not-available'));
        }
        const current = userSettings[username];
        userSettings[username] = settings;
        try {
            assert_1.default.deepEqual(current, settings);
            return Promise.resolve();
        }
        catch (err) {
            globalSettings.users = userSettings;
            return storage.saveSettings((0, clone_1.default)(globalSettings));
        }
    },
    runtimeMetricInterval: undefined,
    version: undefined,
    UNSUPPORTED_VERSION: undefined,
    externalModules: undefined,
    settingsFile: undefined,
    httpRoot: undefined,
    readOnly: undefined,
    httpStatic: undefined,
    autoInstallModulesRetry: undefined
};
//# sourceMappingURL=settings.js.map