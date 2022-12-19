"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const util_1 = require("@node-red/util");
const local_js_1 = __importDefault(require("./local.js"));
const examples_js_1 = __importDefault(require("./examples.js"));
const knownTypes = {};
const libraries = {};
const libraryConfigs = {};
const libraryPlugins = {};
// Libraries defined in the settings file. Their configurations
// cannot be modified in the editor.
let runtimeLibraries = [];
let runtime;
function init(_runtime) {
    runtime = _runtime;
    util_1.events.removeListener('registry:plugin-added', onPluginAdded);
    util_1.events.on('registry:plugin-added', onPluginAdded);
    knownTypes.flows = 'node-red';
    libraries.local = local_js_1.default;
    libraries.local.init(runtime);
    libraryConfigs.local = libraries.local;
    libraries.examples = examples_js_1.default;
    libraries.examples.init(runtime);
    libraryConfigs.examples = libraries.examples;
    try {
        runtimeLibraries = runtime.settings.editorTheme.library.sources;
    }
    catch (err) {
        runtimeLibraries = [];
    }
    // userLibraries = runtime.settings.get("library")
}
function onPluginAdded(id) {
    const plugin = runtime.plugins.getPlugin(id);
    if (plugin.type === 'node-red-library-source') {
        libraryPlugins[plugin.id] = plugin;
        runtimeLibraries.forEach((library) => {
            if (library.type === id) {
                library.local = false;
                if (!/^[a-z0-9-_]+$/.test(library.id)) {
                    util_1.log.warn(util_1.log._('library.failedToInit', { error: util_1.log._('library.invalidProperty', { prop: 'id', value: library.id }) }));
                    return;
                }
                try {
                    libraries[library.id] = new plugin.class(library);
                    libraryConfigs[library.id] = library;
                    libraryConfigs[library.id].type = id;
                    if (libraries[library.id].init) {
                        libraries[library.id].init().catch((err) => {
                            delete libraries[library.id];
                            delete libraryConfigs[library.id];
                            util_1.log.warn(util_1.log._('library.failedToInit', { library: library.id, error: err.toString() }));
                        });
                    }
                }
                catch (err) {
                    util_1.log.warn(util_1.log._('library.failedToInit', { library: library.id, error: err.toString() }));
                }
            }
        });
    }
}
function registerType(id, type) {
    // TODO: would like to enforce this, but currently the tests register the same type multiple
    //       times and have no way to remove themselves.
    // if (knownTypes.hasOwnProperty(type)) {
    //     throw new Error(`Library type '${type}' already registered by ${id}'`)
    // }
    knownTypes[type] = id;
}
function getEntry(library, type, path) {
    if (!knownTypes.hasOwnProperty(type)) {
        throw new Error(util_1.log._('library.unknownType', { type }));
    }
    if (libraries.hasOwnProperty(library)) {
        return libraries[library].getEntry(type, path);
    }
    throw new Error(util_1.log._('library.unknownLibrary', { library }));
}
function saveEntry(library, type, path, meta, body) {
    if (!knownTypes.hasOwnProperty(type)) {
        throw new Error(util_1.log._('library.unknownType', { type }));
    }
    if (libraries.hasOwnProperty(library)) {
        if (libraries[library].saveEntry) {
            return libraries[library].saveEntry(type, path, meta, body);
        }
        throw new Error(util_1.log._('library.readOnly', { library }));
    }
    else {
        throw new Error(util_1.log._('library.unknownLibrary', { library }));
    }
}
function getLibraries() {
    const libraryList = [];
    for (const id in libraries) {
        if (libraries.hasOwnProperty(id)) {
            const config = getConfig(id);
            // Don't include the full configuration of each library when providing
            // the list of all libraries
            delete config.config;
            libraryList.push(config);
        }
    }
    return libraryList;
}
function getConfig(id) {
    const lib = {
        id,
        label: libraryConfigs[id].label || id,
        user: false,
        icon: libraryConfigs[id].icon,
        config: undefined,
        types: undefined,
        readOnly: undefined,
        type: undefined
    };
    if (libraryConfigs[id].types) {
        lib.types = libraryConfigs[id].types;
    }
    if (libraryConfigs[id].readOnly) {
        lib.readOnly = libraryConfigs[id].readOnly;
    }
    if (libraryConfigs[id].type) {
        lib.type = libraryConfigs[id].type;
        const def = libraryPlugins[lib.type];
        if (def && def.defaults) {
            lib.config = {};
            for (const d in def.defaults) {
                if (def.defaults.hasOwnProperty(d)) {
                    if (def.defaults[d].type !== 'password') {
                        lib.config[d] = libraryConfigs[id][d];
                    }
                    else if (libraryConfigs[id][d]) {
                        lib.config['has_' + d] = true;
                    }
                }
            }
        }
    }
    return lib;
}
exports.default = {
    init,
    getLibraries,
    register: registerType,
    getEntry,
    saveEntry
};
//# sourceMappingURL=index.js.map