"use strict";
/* eslint-disable no-use-before-define */
/* eslint-disable no-prototype-builtins */
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
const settings_js_1 = require("./settings.js");
const plugins_js_1 = __importDefault(require("./plugins.js"));
const util_1 = require("@node-red/util");
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const express_1 = __importDefault(require("express"));
const index_js_1 = __importDefault(require("./api/index.js"));
const index_js_2 = __importDefault(require("./nodes/index.js"));
const index_js_3 = __importDefault(require("./flows/index.js"));
const index_js_4 = __importDefault(require("./storage/index.js"));
const index_js_5 = __importDefault(require("./library/index.js"));
let runtimeMetricInterval = null;
let started = false;
const stubbedExpressApp = {
    get() {
        //
    },
    post() {
        //
    },
    put() {
        //
    },
    delete() {
        //
    }
};
let adminApi = {
    auth: {
        needsPermission() {
            return function (req, res, next) {
                next();
            };
        }
    },
    adminApp: stubbedExpressApp,
    server: {}
};
let nodeApp;
let adminApp;
let server;
/**
 * Initialise the runtime module.
 * @param {Object} settings - the runtime settings object
 * @param {HTTPServer} server - the http server instance for the server to use
 * @param {AdminAPI} adminApi - an instance of @node-red/editor-api. <B>TODO</B>: This needs to be
 *                              better abstracted.
 * @memberof @node-red/runtime
 */
function init(userSettings, httpServer, _adminApi) {
    server = httpServer;
    if (server && server.on) {
        // Add a listener to the upgrade event so that we can properly timeout connection
        // attempts that do not get handled by any nodes in the user's flow.
        // See #2956
        server.on('upgrade', (request, socket, head) => {
            // Add a no-op handler to the error event in case nothing upgrades this socket
            // before the remote end closes it. This ensures we don't get as uncaughtException
            socket.on('error', (err) => {
                //
            });
            setTimeout(function () {
                // If this request has been handled elsewhere, the upgrade will have
                // been completed and bytes written back to the client.
                // If nothing has been written on the socket, nothing has handled the
                // upgrade, so we can consider this an unhandled upgrade.
                if (socket.bytesWritten === 0) {
                    socket.destroy();
                }
            }, userSettings.inboundWebSocketTimeout || 5000);
        });
    }
    userSettings.version = getVersion();
    settings_js_1.persistentSettings.init(userSettings);
    nodeApp = (0, express_1.default)();
    adminApp = (0, express_1.default)();
    if (_adminApi) {
        adminApi = _adminApi;
    }
    index_js_2.default.init(runtime);
    index_js_1.default.init(runtime);
}
let version;
async function getVersion() {
    var _a;
    if (!version) {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        version = await (_a = node_path_1.default.join(__dirname, '..', 'package.json'), Promise.resolve().then(() => __importStar(require(_a)))).then(({ version }) => version);
        /* istanbul ignore else */
        try {
            node_fs_1.default.statSync(node_path_1.default.join(__dirname, '..', '..', '..', '..', '.git'));
            version += '-git';
        }
        catch (err) {
            // No git directory
        }
    }
    return version;
}
/**
 * Start the runtime.
 * @return {Promise} - resolves when the runtime is started. This does not mean the
 *   flows will be running as they are started asynchronously.
 * @memberof @node-red/runtime
 */
function start() {
    return util_1.i18n
        .registerMessageCatalog('runtime', node_path_1.default.resolve(node_path_1.default.join(__dirname, '..', 'locales')), 'runtime.json')
        .then(function () {
        return index_js_4.default.init(runtime);
    })
        .then(function () {
        return settings_js_1.persistentSettings.load(index_js_4.default);
    })
        .then(function () {
        return index_js_5.default.init(runtime);
    })
        .then(function () {
        if (util_1.log.metric()) {
            runtimeMetricInterval = setInterval(function () {
                reportMetrics();
            }, settings_js_1.persistentSettings.runtimeMetricInterval || 15000);
        }
        util_1.log.info('\n\n' + util_1.log._('runtime.welcome') + '\n===================\n');
        if (settings_js_1.persistentSettings.version) {
            util_1.log.info(util_1.log._('runtime.version', { component: 'Node-RED', version: 'v' + settings_js_1.persistentSettings.version }));
        }
        util_1.log.info(util_1.log._('runtime.version', { component: 'Node.js ', version: process.version }));
        if (settings_js_1.persistentSettings.UNSUPPORTED_VERSION) {
            util_1.log.error('*****************************************************************');
            util_1.log.error('* ' + util_1.log._('runtime.unsupported_version', { component: 'Node.js', version: process.version, requires: '>=8.9.0' }) + ' *');
            util_1.log.error('*****************************************************************');
            util_1.events.emit('runtime-event', {
                id: 'runtime-unsupported-version',
                payload: { type: 'error', text: 'notification.errors.unsupportedVersion' },
                retain: true
            });
        }
        util_1.log.info(node_os_1.default.type() + ' ' + node_os_1.default.release() + ' ' + node_os_1.default.arch() + ' ' + node_os_1.default.endianness());
        return index_js_2.default.load().then(function () {
            let autoInstallModules = false;
            if (settings_js_1.persistentSettings.hasOwnProperty('autoInstallModules')) {
                util_1.log.warn(util_1.log._('server.deprecatedOption', { old: 'autoInstallModules', new: 'externalModules.autoInstall' }));
                autoInstallModules = true;
            }
            if (settings_js_1.persistentSettings.externalModules) {
                // autoInstallModules = autoInstall enabled && (no palette setting || palette install not disabled)
                autoInstallModules =
                    settings_js_1.persistentSettings.externalModules.autoInstall &&
                        (!settings_js_1.persistentSettings.externalModules.palette || settings_js_1.persistentSettings.externalModules.palette.allowInstall !== false);
            }
            let i;
            const nodeErrors = index_js_2.default.getNodeList(function (n) {
                return n.err !== null;
            });
            const nodeMissing = index_js_2.default.getNodeList(function (n) {
                return n.module && n.enabled && !n.loaded && !n.err;
            });
            if (nodeErrors.length > 0) {
                util_1.log.warn('------------------------------------------------------');
                for (i = 0; i < nodeErrors.length; i += 1) {
                    if (nodeErrors[i]?.err?.code === 'type_already_registered') {
                        util_1.log.warn('[' +
                            nodeErrors[i].id +
                            '] ' +
                            util_1.log._('server.type-already-registered', {
                                type: nodeErrors[i].err.details.type,
                                module: nodeErrors[i].err.details.moduleA
                            }));
                    }
                    else {
                        util_1.log.warn('[' + nodeErrors[i].id + '] ' + nodeErrors[i].err);
                    }
                }
                util_1.log.warn('------------------------------------------------------');
            }
            if (nodeMissing.length > 0) {
                util_1.log.warn(util_1.log._('server.missing-modules'));
                const missingModules = {};
                for (i = 0; i < nodeMissing.length; i++) {
                    const missing = nodeMissing[i];
                    missingModules[missing.module] = missingModules[missing.module] || {
                        module: missing.module,
                        version: missing.pending_version || missing.version,
                        types: []
                    };
                    missingModules[missing.module].types = missingModules[missing.module].types.concat(missing.types);
                }
                const moduleList = [];
                const promises = [];
                const installingModules = [];
                for (i in missingModules) {
                    if (missingModules.hasOwnProperty(i)) {
                        util_1.log.warn(' - ' + i + ' (' + missingModules[i].version + '): ' + missingModules[i].types.join(', '));
                        if (autoInstallModules && i !== 'node-red') {
                            installingModules.push({ id: i, version: missingModules[i].version });
                        }
                    }
                }
                if (!autoInstallModules) {
                    util_1.log.info(util_1.log._('server.removing-modules'));
                    index_js_2.default.cleanModuleList();
                }
                else if (installingModules.length > 0) {
                    reinstallAttempts = 0;
                    reinstallModules(installingModules);
                }
            }
            if (settings_js_1.persistentSettings.settingsFile) {
                util_1.log.info(util_1.log._('runtime.paths.settings', { path: settings_js_1.persistentSettings.settingsFile }));
            }
            if (settings_js_1.persistentSettings.httpRoot !== undefined) {
                util_1.log.warn(util_1.log._('server.deprecatedOption', { old: 'httpRoot', new: 'httpNodeRoot/httpAdminRoot' }));
            }
            if (settings_js_1.persistentSettings.readOnly) {
                util_1.log.info(util_1.log._('settings.readonly-mode'));
            }
            if (settings_js_1.persistentSettings.httpStatic && settings_js_1.persistentSettings.httpStatic.length) {
                for (let si = 0; si < settings_js_1.persistentSettings.httpStatic.length; si++) {
                    const p = node_path_1.default.resolve(settings_js_1.persistentSettings.httpStatic[si].path);
                    const r = settings_js_1.persistentSettings.httpStatic[si].root || '/';
                    util_1.log.info(util_1.log._('runtime.paths.httpStatic', { path: `${p} > ${r}` }));
                }
            }
            return index_js_2.default.loadContextsPlugin().then(function () {
                index_js_2.default
                    .loadFlows()
                    .then(() => {
                    index_js_2.default.startFlows();
                })
                    .catch();
                started = true;
            });
        });
    });
}
let reinstallAttempts = 0;
let reinstallTimeout;
function reinstallModules(moduleList) {
    const promises = [];
    const reinstallList = [];
    let installRetry = 30000;
    if (settings_js_1.persistentSettings.autoInstallModulesRetry) {
        util_1.log.warn(util_1.log._('server.deprecatedOption', { old: 'autoInstallModulesRetry', new: 'externalModules.autoInstallRetry' }));
        installRetry = settings_js_1.persistentSettings.autoInstallModulesRetry;
    }
    if (settings_js_1.persistentSettings.externalModules && settings_js_1.persistentSettings.externalModules.hasOwnProperty('autoInstallRetry')) {
        installRetry = settings_js_1.persistentSettings.externalModules.autoInstallRetry * 1000;
    }
    for (let i = 0; i < moduleList.length; i++) {
        if (moduleList[i].id !== 'node-red') {
            (function (mod) {
                promises.push(index_js_2.default
                    .installModule(mod.id, mod.version)
                    .then((m) => {
                    util_1.events.emit('runtime-event', { id: 'node/added', retain: false, payload: m.nodes });
                })
                    .catch((err) => {
                    reinstallList.push(mod);
                }));
            })(moduleList[i]);
        }
    }
    Promise.all(promises).then(function (results) {
        if (reinstallList.length > 0) {
            reinstallAttempts++;
            // First 5 at 1x timeout, next 5 at 2x, next 5 at 4x, then 8x
            const timeout = installRetry * Math.pow(2, Math.min(Math.floor(reinstallAttempts / 5), 3));
            reinstallTimeout = setTimeout(function () {
                reinstallModules(reinstallList);
            }, timeout);
        }
    });
}
function reportMetrics() {
    const memUsage = process.memoryUsage();
    util_1.log.log({
        level: util_1.log.METRIC,
        event: 'runtime.memory.rss',
        value: memUsage.rss
    });
    util_1.log.log({
        level: util_1.log.METRIC,
        event: 'runtime.memory.heapTotal',
        value: memUsage.heapTotal
    });
    util_1.log.log({
        level: util_1.log.METRIC,
        event: 'runtime.memory.heapUsed',
        value: memUsage.heapUsed
    });
}
/**
 * Stops the runtime.
 *
 * Once called, Node-RED should not be restarted until the Node.JS process is
 * restarted.
 *
 * @return {Promise} - resolves when the runtime is stopped.
 * @memberof @node-red/runtime
 */
function stop() {
    if (runtimeMetricInterval) {
        clearInterval(runtimeMetricInterval);
        runtimeMetricInterval = null;
    }
    if (reinstallTimeout) {
        clearTimeout(reinstallTimeout);
    }
    started = false;
    return index_js_2.default.stopFlows().then(function () {
        return index_js_2.default.closeContextsPlugin();
    });
}
// This is the internal api
const runtime = {
    version: getVersion,
    log: util_1.log,
    i18n: util_1.i18n,
    events: util_1.events,
    settings: settings_js_1.persistentSettings,
    storage: index_js_4.default,
    hooks: util_1.hooks,
    nodes: index_js_2.default,
    plugins: plugins_js_1.default,
    flows: index_js_3.default,
    library: index_js_5.default,
    exec: util_1.exec,
    util: util_1.util,
    get adminApi() {
        return adminApi;
    },
    get adminApp() {
        return adminApp;
    },
    get nodeApp() {
        return nodeApp;
    },
    get server() {
        return server;
    },
    isStarted() {
        return started;
    }
};
/**
 * This module provides the core runtime component of Node-RED.
 * It does *not* include the Node-RED editor. All interaction with
 * this module is done using the api provided.
 *
 * @namespace @node-red/runtime
 */
exports.default = {
    init,
    start,
    stop,
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_comms
     */
    comms: index_js_1.default.comms,
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_flows
     */
    flows: index_js_1.default.flows,
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_library
     */
    library: index_js_1.default.library,
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_nodes
     */
    nodes: index_js_1.default.nodes,
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_settings
     */
    settings: index_js_1.default.settings,
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_projects
     */
    projects: index_js_1.default.projects,
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_context
     */
    context: index_js_1.default.context,
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_plugins
     */
    plugins: index_js_1.default.plugins,
    /**
     * Returns whether the runtime is started
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @return {Promise<Boolean>} - whether the runtime is started
     * @function
     * @memberof @node-red/runtime
     */
    isStarted: index_js_1.default.isStarted,
    /**
     * Returns version number of the runtime
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @return {Promise<String>} - the runtime version number
     * @function
     * @memberof @node-red/runtime
     */
    version: index_js_1.default.version,
    /**
     * @memberof @node-red/diagnostics
     */
    diagnostics: index_js_1.default.diagnostics,
    storage: index_js_4.default,
    events: util_1.events,
    hooks: util_1.hooks,
    util: util_1.util,
    get httpNode() {
        return nodeApp;
    },
    get httpAdmin() {
        return adminApp;
    },
    get server() {
        return server;
    },
    _: runtime
};
/**
 * A user accessing the API
 * @typedef User
 * @type {object}
 */
//# sourceMappingURL=index.js.map