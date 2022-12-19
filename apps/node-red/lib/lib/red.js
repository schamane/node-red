"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-underscore-dangle */
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
const node_path_1 = __importDefault(require("node:path"));
const runtime_1 = __importDefault(require("@node-red/runtime"));
const util_1 = require("@node-red/util");
const editor_api_1 = __importDefault(require("@node-red/editor-api"));
const semver_1 = __importDefault(require("semver"));
let server = null;
let apiEnabled = false;
function checkVersion(userSettings) {
    if (!semver_1.default.satisfies(process.version, '>=8.9.0')) {
        // TODO: in the future, make this a hard error.
        // var e = new Error("Unsupported version of Node.js");
        // e.code = "unsupported_version";
        // throw e;
        userSettings.UNSUPPORTED_VERSION = process.version;
    }
}
/**
 * This module provides the full Node-RED application, with both the runtime
 * and editor components built in.
 *
 * The API this module exposes allows it to be embedded within another Node.js
 * application.
 *
 * @namespace node-red
 */
exports.default = {
    /**
     * Initialise the Node-RED application.
     * @param {server} httpServer - the HTTP server object to use
     * @param {Object} userSettings - an object containing the runtime settings
     * @memberof node-red
     */
    init(httpServer, userSettings) {
        if (!userSettings) {
            userSettings = httpServer;
            httpServer = null;
        }
        if (!userSettings.SKIP_BUILD_CHECK) {
            checkVersion(userSettings);
        }
        if (!userSettings.hasOwnProperty('coreNodesDir')) {
            userSettings.coreNodesDir = node_path_1.default.dirname(require.resolve('@node-red/nodes'));
        }
        (0, util_1.init)(userSettings);
        if (userSettings.httpAdminRoot !== false) {
            // Initialise the runtime
            runtime_1.default.init(userSettings, httpServer, editor_api_1.default);
            // Initialise the editor-api
            editor_api_1.default.init(userSettings, httpServer, runtime_1.default.storage, runtime_1.default);
            // Attach the runtime admin app to the api admin app
            editor_api_1.default.httpAdmin.use(runtime_1.default.httpAdmin);
            apiEnabled = true;
            server = httpServer;
        }
        else {
            runtime_1.default.init(userSettings, httpServer);
            apiEnabled = false;
            if (httpServer) {
                server = httpServer;
            }
            else {
                server = null;
            }
        }
        return;
    },
    /**
     * Start the Node-RED application.
     * @return {Promise} - resolves when complete
     * @memberof node-red
     */
    start() {
        // The top level red.js has always used 'otherwise' on the promise returned
        // here. This is a non-standard promise function coming from our early use
        // of the when.js library.
        // We want to remove all dependency on when.js as native Promises now exist.
        // But we have the issue that some embedders of Node-RED may have copied our
        // top-level red.js a bit too much.
        //
        const startPromise = runtime_1.default.start().then(function () {
            if (apiEnabled) {
                return editor_api_1.default.start();
            }
        });
        startPromise._then = startPromise.then;
        startPromise.then = function (resolve, reject) {
            const inner = startPromise._then(resolve, reject);
            inner.otherwise = function (cb) {
                util_1.log.error('**********************************************');
                util_1.log.error('* Deprecated call to RED.start().otherwise() *');
                util_1.log.error('* This will be removed in Node-RED 2.x       *');
                util_1.log.error('* Use RED.start().catch() instead            *');
                util_1.log.error('**********************************************');
                return inner.catch(cb);
            };
            return inner;
        };
        return startPromise;
    },
    /**
     * Stop the Node-RED application.
     *
     * Once called, Node-RED should not be restarted until the Node.JS process is
     * restarted.
     *
     * @return {Promise} - resolves when complete
     * @memberof node-red
     */
    stop() {
        return runtime_1.default.stop().then(function () {
            if (apiEnabled) {
                return editor_api_1.default.stop();
            }
        });
    },
    /**
     * Logging utilities
     * @see @node-red/util_log
     * @memberof node-red
     */
    log: util_1.log,
    /**
     * General utilities
     * @see @node-red/util_util
     * @memberof node-red
     */
    util: util_1.util,
    /**
     * This provides access to the internal nodes module of the
     * runtime. The details of this API remain undocumented as they should not
     * be used directly.
     *
     * Most administrative actions should be performed use the runtime api
     * under [node-red.runtime]{@link node-red.runtime}.
     *
     * @memberof node-red
     */
    get nodes() {
        return runtime_1.default._.nodes;
    },
    /**
     * Runtime events emitter
     * @see @node-red/util_events
     * @memberof node-red
     */
    events: util_1.events,
    /**
     * Runtime hooks engine
     * @see @node-red/runtime_hooks
     * @memberof node-red
     */
    hooks: runtime_1.default.hooks,
    /**
     * This provides access to the internal settings module of the
     * runtime.
     *
     * @memberof node-red
     */
    get settings() {
        return runtime_1.default._.settings;
    },
    /**
     * Get the version of the runtime
     * @return {String} - the runtime version
     * @function
     * @memberof node-red
     */
    get version() {
        return runtime_1.default._.version;
    },
    /**
     * The express application for the Editor Admin API
     * @type ExpressApplication
     * @memberof node-red
     */
    get httpAdmin() {
        return editor_api_1.default.httpAdmin;
    },
    /**
     * The express application for HTTP Nodes
     * @type ExpressApplication
     * @memberof node-red
     */
    get httpNode() {
        return runtime_1.default.httpNode;
    },
    /**
     * The HTTP Server used by the runtime
     * @type HTTPServer
     * @memberof node-red
     */
    get server() {
        return server;
    },
    /**
     * The runtime api
     * @see @node-red/runtime
     * @memberof node-red
     */
    runtime: runtime_1.default,
    /**
     * The editor authentication api.
     * @see @node-red/editor-api_auth
     * @memberof node-red
     */
    auth: editor_api_1.default.auth,
    /**
     * The editor authentication api.
     * @see @node-red/editor-api_auth
     * @memberof node-red
     */
    get diagnostics() {
        return editor_api_1.default.diagnostics;
    }
};
//# sourceMappingURL=red.js.map