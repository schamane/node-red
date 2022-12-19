"use strict";
/* eslint-disable no-prototype-builtins */
/* eslint-disable camelcase */
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const async_mutex_1 = require("async-mutex");
let runtime;
let storageModule;
let settingsAvailable;
let sessionsAvailable;
const settingsSaveMutex = new async_mutex_1.Mutex();
let libraryFlowsCachedResult = null;
async function moduleSelector(aSettings) {
    var _a;
    if (aSettings.storageModule) {
        let toReturn;
        if (typeof aSettings.storageModule === 'string') {
            // TODO: allow storage modules to be specified by absolute path
            toReturn = await (_a = './' + aSettings.storageModule, Promise.resolve().then(() => __importStar(require(_a))));
        }
        else {
            toReturn = aSettings.storageModule;
        }
        return toReturn;
    }
    const { localfilesystem } = await Promise.resolve().then(() => __importStar(require('./localfilesystem')));
    return localfilesystem;
}
function is_malicious(path) {
    return path.indexOf('../') !== -1 || path.indexOf('..\\') !== -1;
}
const storageModuleInterface = {
    projects: undefined,
    sshkeys: undefined,
    async init(_runtime) {
        runtime = _runtime;
        // Any errors thrown by the module will get passed up to the called
        // as a rejected promise
        storageModule = await moduleSelector(runtime.settings);
        settingsAvailable = storageModule.hasOwnProperty('getSettings') && storageModule.hasOwnProperty('saveSettings');
        sessionsAvailable = storageModule.hasOwnProperty('getSessions') && storageModule.hasOwnProperty('saveSessions');
        if (storageModule.projects) {
            let projectsEnabled = false;
            if (runtime.settings.hasOwnProperty('editorTheme') && runtime.settings.editorTheme.hasOwnProperty('projects')) {
                projectsEnabled = runtime.settings.editorTheme.projects.enabled === true;
            }
            if (projectsEnabled) {
                storageModuleInterface.projects = storageModule.projects;
            }
        }
        if (storageModule.sshkeys) {
            storageModuleInterface.sshkeys = storageModule.sshkeys;
        }
        return storageModule.init(runtime.settings, runtime);
    },
    getFlows() {
        return storageModule.getFlows().then(function (flows) {
            return storageModule.getCredentials().then(function (creds) {
                const result = {
                    flows,
                    credentials: creds,
                    rev: undefined
                };
                result.rev = node_crypto_1.default.createHash('md5').update(JSON.stringify(result.flows)).digest('hex');
                return result;
            });
        });
    },
    saveFlows(config, user) {
        const flows = config.flows;
        const credentials = config.credentials;
        let credentialSavePromise;
        if (config.credentialsDirty) {
            credentialSavePromise = storageModule.saveCredentials(credentials);
        }
        else {
            credentialSavePromise = Promise.resolve();
        }
        delete config.credentialsDirty;
        return credentialSavePromise.then(function () {
            return storageModule.saveFlows(flows, user).then(function () {
                return node_crypto_1.default.createHash('md5').update(JSON.stringify(config.flows)).digest('hex');
            });
        });
    },
    saveCredentials(credentials) {
        return storageModule.saveCredentials(credentials);
    },
    getSettings() {
        if (settingsAvailable) {
            return storageModule.getSettings();
        }
        return null;
    },
    async saveSettings(settings) {
        if (settingsAvailable) {
            return settingsSaveMutex.runExclusive(() => storageModule.saveSettings(settings));
        }
    },
    getSessions() {
        if (sessionsAvailable) {
            return storageModule.getSessions();
        }
        return null;
    },
    saveSessions(sessions) {
        if (sessionsAvailable) {
            return storageModule.saveSessions(sessions);
        }
    },
    /* Library Functions */
    getLibraryEntry(type, path) {
        if (is_malicious(path)) {
            const err = new Error();
            err.code = 'forbidden';
            throw err;
        }
        return storageModule.getLibraryEntry(type, path);
    },
    saveLibraryEntry(type, path, meta, body) {
        if (is_malicious(path)) {
            const err = new Error();
            err.code = 'forbidden';
            throw err;
        }
        return storageModule.saveLibraryEntry(type, path, meta, body);
    },
    /* Deprecated functions */
    getAllFlows() {
        if (storageModule.hasOwnProperty('getAllFlows')) {
            return storageModule.getAllFlows();
        }
        else if (libraryFlowsCachedResult) {
            return libraryFlowsCachedResult;
        }
        return listFlows('/').then(function (result) {
            libraryFlowsCachedResult = result;
            return result;
        });
    },
    getFlow(fn) {
        if (is_malicious(fn)) {
            const err = new Error();
            err.code = 'forbidden';
            throw err;
        }
        if (storageModule.hasOwnProperty('getFlow')) {
            return storageModule.getFlow(fn);
        }
        return storageModule.getLibraryEntry('flows', fn);
    },
    saveFlow(fn, data) {
        if (is_malicious(fn)) {
            const err = new Error();
            err.code = 'forbidden';
            throw err;
        }
        libraryFlowsCachedResult = null;
        if (storageModule.hasOwnProperty('saveFlow')) {
            return storageModule.saveFlow(fn, data);
        }
        return storageModule.saveLibraryEntry('flows', fn, {}, data);
    }
    /* End deprecated functions */
};
function listFlows(path) {
    return storageModule.getLibraryEntry('flows', path).then(function (res) {
        const promises = [];
        res.forEach(function (r) {
            if (typeof r === 'string') {
                promises.push(listFlows(node_path_1.default.join(path, r)));
            }
            else {
                promises.push(Promise.resolve(r));
            }
        });
        return Promise.all(promises).then((res2) => {
            let i = 0;
            const result = {};
            res2.forEach(function (r) {
                // TODO: name||fn
                if (r.fn) {
                    let name = r.name;
                    if (!name) {
                        name = r.fn.replace(/\.json$/, '');
                    }
                    result.f = result.f || [];
                    result.f.push(name);
                }
                else {
                    result.d = result.d || {};
                    result.d[res[i]] = r;
                    // console.log(">",r.value);
                }
                i++;
            });
            return result;
        });
    });
}
exports.default = storageModuleInterface;
//# sourceMappingURL=index.js.map