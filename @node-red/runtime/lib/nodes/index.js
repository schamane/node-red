"use strict";
/* eslint-disable camelcase */
/* eslint-disable no-proto */
/* eslint-disable no-underscore-dangle */
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
const clone_1 = __importDefault(require("clone"));
const node_util_1 = __importDefault(require("node:util"));
const registry_1 = require("@node-red/registry");
const credentials_js_1 = __importDefault(require("./credentials.js"));
const index_js_1 = __importDefault(require("../flows/index.js"));
const util_js_1 = __importDefault(require("../flows/util.js"));
const index_js_2 = __importDefault(require("./context/index.js"));
const node_js_1 = __importDefault(require("./node.js"));
const util_1 = require("@node-red/util");
let log;
let settings;
/**
 * Registers a node constructor
 * @param nodeSet - the nodeSet providing the node (module/set)
 * @param type - the string type name
 * @param constructor - the constructor function for this node type
 * @param opts - optional additional options for the node
 */
function registerType(nodeSet, type, constructor, opts) {
    if (typeof type !== 'string') {
        // This is someone calling the api directly, rather than via the
        // RED object provided to a node. Log a warning
        log.warn('[' + nodeSet + '] Deprecated call to RED.runtime.nodes.registerType - node-set name must be provided as first argument');
        opts = constructor;
        constructor = type;
        type = nodeSet;
        nodeSet = '';
    }
    if (opts) {
        if (opts.credentials) {
            credentials_js_1.default.register(type, opts.credentials);
        }
        if (opts.settings) {
            try {
                settings.registerNodeSettings(type, opts.settings);
            }
            catch (err) {
                log.warn('[' + type + '] ' + err.message);
            }
        }
    }
    if (!(constructor.prototype instanceof node_js_1.default)) {
        if (Object.getPrototypeOf(constructor.prototype) === Object.prototype) {
            node_util_1.default.inherits(constructor, node_js_1.default);
        }
        else {
            let proto = constructor.prototype;
            while (Object.getPrototypeOf(proto) !== Object.prototype) {
                proto = Object.getPrototypeOf(proto);
            }
            // TODO: This is a partial implementation of util.inherits >= node v5.0.0
            //      which should be changed when support for node < v5.0.0 is dropped
            //      see: https://github.com/nodejs/node/pull/3455
            proto.constructor.super_ = node_js_1.default;
            if (Object.setPrototypeOf) {
                Object.setPrototypeOf(proto, node_js_1.default.prototype);
            }
            else {
                // hack for node v0.10
                proto.__proto__ = node_js_1.default.prototype;
            }
        }
    }
    (0, registry_1.registerType)(nodeSet, type, constructor, opts);
}
/**
 * Called from a Node's constructor function, invokes the super-class
 * constructor and attaches any credentials to the node.
 * @param node the node object being created
 * @param def the instance definition for the node
 */
function createNode(node, def) {
    node_js_1.default.call(node, def);
    let id = node.id;
    if (def._alias) {
        id = def._alias;
    }
    let creds = credentials_js_1.default.get(id);
    if (creds) {
        creds = (0, clone_1.default)(creds);
        // console.log("Attaching credentials to ",node.id);
        // allow $(foo) syntax to substitute env variables for credentials also...
        for (const p in creds) {
            if (creds.hasOwnProperty(p)) {
                util_js_1.default.mapEnvVarProperties(creds, p, node._flow, node);
            }
        }
        node.credentials = creds;
    }
    else if (credentials_js_1.default.getDefinition(node.type)) {
        node.credentials = {};
    }
}
function registerSubflow(nodeSet, subflow) {
    // TODO: extract credentials definition from subflow properties
    const registeredType = (0, registry_1.registerSubflow)(nodeSet, subflow);
    if (subflow.env) {
        const creds = {};
        let hasCreds = false;
        subflow.env.forEach((e) => {
            if (e.type === 'cred') {
                creds[e.name] = { type: 'password' };
                hasCreds = true;
            }
        });
        if (hasCreds) {
            credentials_js_1.default.register(registeredType.type, creds);
        }
    }
}
function init(runtime) {
    settings = runtime.settings;
    log = runtime.log;
    credentials_js_1.default.init(runtime);
    index_js_1.default.init(runtime);
    (0, registry_1.init)(runtime);
    index_js_2.default.init(runtime.settings);
}
function disableNode(id) {
    index_js_1.default.checkTypeInUse(id);
    return (0, registry_1.disableNode)(id).then(function (info) {
        reportNodeStateChange(info, false);
        return info;
    });
}
function enableNode(id) {
    return (0, registry_1.enableNodeSet)(id).then(function (info) {
        reportNodeStateChange(info, true);
        return info;
    });
}
function reportNodeStateChange(info, enabled) {
    if (info.enabled === enabled && !info.err) {
        util_1.events.emit('runtime-event', { id: 'node/' + (enabled ? 'enabled' : 'disabled'), retain: false, payload: info });
        log.info(' ' + log._('api.nodes.' + (enabled ? 'enabled' : 'disabled')));
        for (let i = 0; i < info.types.length; i++) {
            log.info(' - ' + info.types[i]);
        }
    }
    else if (enabled && info.err) {
        log.warn(log._('api.nodes.error-enable'));
        log.warn(' - ' + info.name + ' : ' + info.err);
    }
}
function installModule(module, version, url) {
    return (0, registry_1.installModule)(module, version, url).then(function (info) {
        if (info.pending_version) {
            util_1.events.emit('runtime-event', { id: 'node/upgraded', retain: false, payload: { module: info.name, version: info.pending_version } });
        }
        else {
            util_1.events.emit('runtime-event', { id: 'node/added', retain: false, payload: info.nodes });
        }
        return info;
    });
}
function uninstallModule(module) {
    const info = (0, registry_1.getModuleInfo)(module);
    if (!info || !info.user) {
        throw new Error(log._('nodes.index.unrecognised-module', { module }));
    }
    else {
        const nodeTypesToCheck = info.nodes.map((n) => `${module}/${n.name}`);
        for (let i = 0; i < nodeTypesToCheck.length; i++) {
            index_js_1.default.checkTypeInUse(nodeTypesToCheck[i]);
        }
        return (0, registry_1.uninstallModule)(module).then(function (list) {
            util_1.events.emit('runtime-event', { id: 'node/removed', retain: false, payload: list });
            return list;
        });
    }
}
exports.default = {
    // Lifecycle
    init,
    load: registry_1.load,
    // Node registry
    createNode,
    getNode: index_js_1.default.get,
    eachNode: index_js_1.default.eachNode,
    getContext: index_js_2.default.get,
    clearContext: index_js_2.default.clear,
    installerEnabled: registry_1.installerEnabled,
    installModule,
    uninstallModule,
    enableNode,
    disableNode,
    // Node type registry
    registerType,
    registerSubflow,
    getType: registry_1.get,
    getNodeInfo: registry_1.getNodeInfo,
    getNodeList: registry_1.getNodeList,
    getModuleInfo: registry_1.getModuleInfo,
    getNodeConfigs: registry_1.getNodeConfigs,
    getNodeConfig: registry_1.getNodeConfig,
    getNodeIconPath: registry_1.getNodeIconPath,
    getNodeIcons: registry_1.getNodeIcons,
    getNodeExampleFlows: registry_1.getNodeExampleFlows,
    getNodeExampleFlowPath: registry_1.getNodeExampleFlowPath,
    getModuleResource: registry_1.getModuleResource,
    clearRegistry: registry_1.clear,
    cleanModuleList: registry_1.cleanModuleList,
    // Flow handling
    loadFlows: index_js_1.default.load,
    startFlows: index_js_1.default.startFlows,
    stopFlows: index_js_1.default.stopFlows,
    setFlows: index_js_1.default.setFlows,
    getFlows: index_js_1.default.getFlows,
    addFlow: index_js_1.default.addFlow,
    getFlow: index_js_1.default.getFlow,
    updateFlow: index_js_1.default.updateFlow,
    removeFlow: index_js_1.default.removeFlow,
    // disableFlow: flows.disableFlow,
    // enableFlow:  flows.enableFlow,
    // Credentials
    addCredentials: credentials_js_1.default.add,
    getCredentials: credentials_js_1.default.get,
    deleteCredentials: credentials_js_1.default.delete,
    getCredentialDefinition: credentials_js_1.default.getDefinition,
    setCredentialSecret: credentials_js_1.default.setKey,
    clearCredentials: credentials_js_1.default.clear,
    exportCredentials: credentials_js_1.default.export,
    getCredentialKeyType: credentials_js_1.default.getKeyType,
    // Contexts
    loadContextsPlugin: index_js_2.default.load,
    closeContextsPlugin: index_js_2.default.close,
    listContextStores: index_js_2.default.listStores
};
//# sourceMappingURL=index.js.map