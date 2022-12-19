"use strict";
/* eslint-disable no-loop-func */
/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-shadow */
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
const registry_1 = require("@node-red/registry");
const index_js_1 = __importDefault(require("../nodes/context/index.js"));
const credentials_js_1 = __importDefault(require("../nodes/credentials.js"));
const util_js_1 = __importDefault(require("./util.js"));
const util_1 = require("@node-red/util");
// TODO: import order shouldnt affect instances Now util should be imported befor flow
const flow_js_1 = require("./flow.js");
let log;
let storage = null;
let settings = null;
let activeConfig = null;
let activeFlowConfig = null;
const activeFlows = {};
let started = false;
let state = 'stop';
let credentialsPendingReset = false;
const activeNodesToFlow = {};
let typeEventRegistered = false;
const flowAPI = {
    getNode,
    handleError: () => false,
    handleStatus: () => false,
    getSetting: (k) => util_js_1.default.getEnvVar(k),
    log: (m) => log.log(m)
};
function init(runtime) {
    if (started) {
        throw new Error('Cannot init without a stop');
    }
    settings = runtime.settings;
    storage = runtime.storage;
    log = runtime.log;
    started = false;
    state = 'stop';
    if (!typeEventRegistered) {
        util_1.events.on('type-registered', function (type) {
            if (activeFlowConfig && activeFlowConfig.missingTypes.length > 0) {
                const i = activeFlowConfig.missingTypes.indexOf(type);
                if (i !== -1) {
                    log.info(log._('nodes.flows.registered-missing', { type }));
                    activeFlowConfig.missingTypes.splice(i, 1);
                    if (activeFlowConfig.missingTypes.length === 0 && started) {
                        util_1.events.emit('runtime-event', { id: 'runtime-state', retain: true });
                        start();
                    }
                }
            }
        });
        typeEventRegistered = true;
    }
    (0, flow_js_1.init)(runtime);
    util_js_1.default.init(runtime);
}
function loadFlows() {
    let config;
    return storage
        .getFlows()
        .then(function (_config) {
        config = _config;
        log.debug('loaded flow revision: ' + config.rev);
        return credentials_js_1.default.load(config.credentials).then(function () {
            util_1.events.emit('runtime-event', { id: 'runtime-state', retain: true });
            return config;
        });
    })
        .catch(function (err) {
        if (err.code === 'credentials_load_failed' && !storage.projects) {
            // project disabled, credential load failed
            credentialsPendingReset = true;
            log.warn(log._('nodes.flows.error', { message: err.toString() }));
            util_1.events.emit('runtime-event', {
                id: 'runtime-state',
                payload: { type: 'warning', error: err.code, text: 'notification.warnings.credentials_load_failed_reset' },
                retain: true
            });
            return config;
        }
        activeConfig = null;
        util_1.events.emit('runtime-event', {
            id: 'runtime-state',
            payload: { type: 'warning', error: err.code, project: err.project, text: 'notification.warnings.' + err.code },
            retain: true
        });
        if (err.code === 'project_not_found') {
            log.warn(log._('storage.localfilesystem.projects.project-not-found', { project: err.project }));
        }
        else {
            log.warn(log._('nodes.flows.error', { message: err.toString() }));
        }
        throw err;
    });
}
function load(forceStart = false) {
    if (forceStart && settings.safeMode) {
        // This is a force reload from the API - disable safeMode
        delete settings.safeMode;
    }
    return setFlows(null, null, 'load', false, forceStart);
}
/*
 * _config - new node array configuration
 * _credentials - new credentials configuration (optional)
 * type - full/nodes/flows/load (default full)
 * muteLog - don't emit the standard log messages (used for individual flow api)
 */
function setFlows(_config, _credentials, type, muteLog, forceStart, user) {
    if (typeof _credentials === 'string') {
        type = _credentials;
        _credentials = null;
    }
    type = type || 'full';
    if (settings.safeMode) {
        if (type !== 'load') {
            // If in safeMode, the flows are stopped. We cannot do a modified nodes/flows
            // type deploy as nothing is running. Can only do a "load" or "full" deploy.
            // The "load" case is already handled in `load()` to distinguish between
            // startup-load and api-request-load.
            type = 'full';
            delete settings.safeMode;
        }
    }
    let configSavePromise = null;
    let config = null;
    let diff;
    let newFlowConfig;
    let isLoad = false;
    if (type === 'load') {
        isLoad = true;
        configSavePromise = loadFlows().then(function (_config) {
            config = (0, clone_1.default)(_config.flows);
            newFlowConfig = util_js_1.default.parseConfig((0, clone_1.default)(config));
            type = 'full';
            return _config.rev;
        });
    }
    else {
        // Clone the provided config so it can be manipulated
        config = (0, clone_1.default)(_config);
        // Parse the configuration
        newFlowConfig = util_js_1.default.parseConfig((0, clone_1.default)(config));
        // Generate a diff to identify what has changed
        diff = util_js_1.default.diffConfigs(activeFlowConfig, newFlowConfig);
        // Now the flows have been compared, remove any credentials from newFlowConfig
        // so they don't cause false-positive diffs the next time a flow is deployed
        for (const id in newFlowConfig.allNodes) {
            if (newFlowConfig.allNodes.hasOwnProperty(id)) {
                delete newFlowConfig.allNodes[id].credentials;
            }
        }
        let credsDirty;
        if (_credentials) {
            if (_credentials.$) {
                // this is a set of encrypted credentials - pass to load to decrypt
                // the complete set
                configSavePromise = credentials_js_1.default.load(_credentials);
            }
            else {
                credentials_js_1.default.clean(config);
                // A full set of credentials have been provided. Use those instead
                const credentialSavePromises = [];
                for (const id in _credentials) {
                    if (_credentials.hasOwnProperty(id)) {
                        credentialSavePromises.push(credentials_js_1.default.add(id, _credentials[id]));
                    }
                }
                configSavePromise = Promise.all(credentialSavePromises);
                credsDirty = true;
            }
        }
        else {
            // Allow the credential store to remove anything no longer needed
            credentials_js_1.default.clean(config);
            // Remember whether credentials need saving or not
            const credsDirty = credentials_js_1.default.dirty();
            configSavePromise = Promise.resolve();
        }
        // Get the latest credentials and ask storage to save them (if needed)
        // as well as the new flow configuration.
        configSavePromise = configSavePromise
            .then(function () {
            return credentials_js_1.default.export();
        })
            .then(function (creds) {
            const saveConfig = {
                flows: config,
                credentialsDirty: credsDirty,
                credentials: creds
            };
            return storage.saveFlows(saveConfig, user);
        });
    }
    return configSavePromise.then((flowRevision) => {
        if (!isLoad) {
            log.debug('saved flow revision: ' + flowRevision);
        }
        activeConfig = {
            flows: config,
            rev: flowRevision
        };
        activeFlowConfig = newFlowConfig;
        if (forceStart || started) {
            // Flows are running (or should be)
            // Stop the active flows (according to deploy type and the diff)
            return stop(type, diff, muteLog, true)
                .then(() => {
                // Once stopped, allow context to remove anything no longer needed
                return index_js_1.default.clean(activeFlowConfig);
            })
                .then(() => {
                if (!isLoad) {
                    log.info(log._('nodes.flows.updated-flows'));
                }
                // Start the active flows
                start(type, diff, muteLog, true).then(() => {
                    util_1.events.emit('runtime-event', { id: 'runtime-deploy', payload: { revision: flowRevision }, retain: true });
                });
                // Return the new revision asynchronously to the actual start
                return flowRevision;
            })
                .catch();
        }
        if (!isLoad) {
            log.info(log._('nodes.flows.updated-flows'));
        }
        util_1.events.emit('runtime-event', { id: 'runtime-deploy', payload: { revision: flowRevision }, retain: true });
        return flowRevision;
    });
}
function getNode(id) {
    let node;
    if (activeNodesToFlow[id] && activeFlows[activeNodesToFlow[id]]) {
        return activeFlows[activeNodesToFlow[id]].getNode(id, true);
    }
    for (const flowId in activeFlows) {
        if (activeFlows.hasOwnProperty(flowId)) {
            node = activeFlows[flowId].getNode(id, true);
            if (node) {
                return node;
            }
        }
    }
    return null;
}
function eachNode(cb) {
    for (const id in activeFlowConfig.allNodes) {
        if (activeFlowConfig.allNodes.hasOwnProperty(id)) {
            cb(activeFlowConfig.allNodes[id]);
        }
    }
}
function getFlows() {
    return activeConfig;
}
async function start(type, diff, muteLog, isDeploy) {
    type = type || 'full';
    started = true;
    state = 'start';
    let i;
    // If there are missing types, report them, emit the necessary runtime event and return
    if (activeFlowConfig.missingTypes.length > 0) {
        log.info(log._('nodes.flows.missing-types'));
        let knownUnknowns = 0;
        for (i = 0; i < activeFlowConfig.missingTypes.length; i++) {
            const nodeType = activeFlowConfig.missingTypes[i];
            const info = registry_1.deprecated.get(nodeType);
            if (info) {
                log.info(log._('nodes.flows.missing-type-provided', { type: activeFlowConfig.missingTypes[i], module: info.module }));
                knownUnknowns += 1;
            }
            else {
                log.info(' - ' + activeFlowConfig.missingTypes[i]);
            }
        }
        if (knownUnknowns > 0) {
            log.info(log._('nodes.flows.missing-type-install-1'));
            log.info('  npm install <module name>');
            log.info(log._('nodes.flows.missing-type-install-2'));
            log.info('  ' + settings.userDir);
        }
        util_1.events.emit('runtime-event', {
            id: 'runtime-state',
            payload: {
                state: 'stop',
                error: 'missing-types',
                type: 'warning',
                text: 'notification.warnings.missing-types',
                types: activeFlowConfig.missingTypes
            },
            retain: true
        });
        return;
    }
    try {
        await (0, registry_1.checkFlowDependencies)(activeConfig.flows);
    }
    catch (err) {
        log.info('Failed to load external modules required by this flow:');
        const missingModules = [];
        for (i = 0; i < err.length; i++) {
            const errMessage = err[i].error.toString();
            missingModules.push({ module: err[i].module.module, error: err[i].error.code || err[i].error.toString() });
            log.info(` - ${err[i].module.spec} [${err[i].error.code || 'unknown_error'}]`);
        }
        util_1.events.emit('runtime-event', {
            id: 'runtime-state',
            payload: {
                state: 'stop',
                error: 'missing-modules',
                type: 'warning',
                text: 'notification.warnings.missing-modules',
                modules: missingModules
            },
            retain: true
        });
        return;
    }
    // In safe mode, don't actually start anything, emit the necessary runtime event and return
    if (settings.safeMode) {
        log.info('*****************************************************************');
        log.info(log._('nodes.flows.safe-mode'));
        log.info('*****************************************************************');
        state = 'safe';
        util_1.events.emit('runtime-event', {
            id: 'runtime-state',
            payload: { state: 'safe', error: 'safe-mode', type: 'warning', text: 'notification.warnings.safe-mode' },
            retain: true
        });
        return;
    }
    let runtimeState;
    try {
        runtimeState = settings.get('runtimeFlowState') || 'start';
    }
    catch {
        //
    }
    if (runtimeState === 'stop') {
        log.info(log._('nodes.flows.stopped-flows'));
        util_1.events.emit('runtime-event', { id: 'runtime-state', payload: { state: 'stop', deploy: isDeploy }, retain: true });
        state = 'stop';
        started = false;
        return;
    }
    if (!muteLog) {
        if (type !== 'full') {
            log.info(log._('nodes.flows.starting-modified-' + type));
        }
        else {
            log.info(log._('nodes.flows.starting-flows'));
        }
    }
    util_1.events.emit('flows:starting', { config: activeConfig, type, diff });
    let id;
    if (type === 'full') {
        // A full start means everything should
        // Check the 'global' flow is running
        if (!activeFlows.global) {
            log.debug('red/nodes/flows.start : starting flow : global');
            activeFlows.global = new flow_js_1.Flow(flowAPI, activeFlowConfig);
        }
        // Check each flow in the active configuration
        for (id in activeFlowConfig.flows) {
            if (activeFlowConfig.flows.hasOwnProperty(id)) {
                if (!activeFlowConfig.flows[id].disabled && !activeFlows[id]) {
                    // This flow is not disabled, nor is it currently active, so create it
                    activeFlows[id] = new flow_js_1.Flow(flowAPI, activeFlowConfig, activeFlowConfig.flows[id]);
                    log.debug('red/nodes/flows.start : starting flow : ' + id);
                }
                else {
                    log.debug('red/nodes/flows.start : not starting disabled flow : ' + id);
                }
            }
        }
    }
    else {
        // A modified-type deploy means restarting things that have changed
        // Update the global flow
        activeFlows.global.update(activeFlowConfig, activeFlowConfig);
        for (id in activeFlowConfig.flows) {
            if (activeFlowConfig.flows.hasOwnProperty(id)) {
                if (!activeFlowConfig.flows[id].disabled) {
                    if (activeFlows[id]) {
                        // This flow exists and is not disabled, so update it
                        activeFlows[id].update(activeFlowConfig, activeFlowConfig.flows[id]);
                    }
                    else {
                        // This flow didn't previously exist, so create it
                        activeFlows[id] = new flow_js_1.Flow(flowAPI, activeFlowConfig, activeFlowConfig.flows[id]);
                        log.debug('red/nodes/flows.start : starting flow : ' + id);
                    }
                }
                else {
                    log.debug('red/nodes/flows.start : not starting disabled flow : ' + id);
                }
            }
        }
    }
    for (id in activeFlows) {
        if (activeFlows.hasOwnProperty(id)) {
            try {
                activeFlows[id].start(diff);
                // Create a map of node id to flow id and also a subflowInstance lookup map
                const activeNodes = activeFlows[id].getActiveNodes();
                Object.keys(activeNodes).forEach(function (nid) {
                    activeNodesToFlow[nid] = id;
                });
            }
            catch (err) {
                console.log(err.stack);
            }
        }
    }
    util_1.events.emit('flows:started', { config: activeConfig, type, diff });
    // Deprecated event
    util_1.events.emit('nodes-started');
    if (credentialsPendingReset === true) {
        credentialsPendingReset = false;
    }
    else {
        util_1.events.emit('runtime-event', { id: 'runtime-state', payload: { state: 'start', deploy: isDeploy }, retain: true });
    }
    if (!muteLog) {
        if (type !== 'full') {
            log.info(log._('nodes.flows.started-modified-' + type));
        }
        else {
            log.info(log._('nodes.flows.started-flows'));
        }
    }
    return;
}
function stop(type, diff, muteLog, isDeploy) {
    if (!started) {
        return Promise.resolve();
    }
    type = type || 'full';
    diff = diff || {
        added: [],
        changed: [],
        removed: [],
        rewired: [],
        linked: []
    };
    if (!muteLog) {
        if (type !== 'full') {
            log.info(log._('nodes.flows.stopping-modified-' + type));
        }
        else {
            log.info(log._('nodes.flows.stopping-flows'));
        }
    }
    started = false;
    state = 'stop';
    const promises = [];
    let stopList;
    const removedList = diff.removed;
    if (type === 'nodes') {
        stopList = diff.changed.concat(diff.removed);
    }
    else if (type === 'flows') {
        stopList = diff.changed.concat(diff.removed).concat(diff.linked);
    }
    util_1.events.emit('flows:stopping', { config: activeConfig, type, diff });
    // Stop the global flow object last
    const activeFlowIds = Object.keys(activeFlows);
    const globalIndex = activeFlowIds.indexOf('global');
    if (globalIndex !== -1) {
        activeFlowIds.splice(globalIndex, 1);
        activeFlowIds.push('global');
    }
    activeFlowIds.forEach((id) => {
        if (activeFlows.hasOwnProperty(id)) {
            const flowStateChanged = diff && (diff.added.indexOf(id) !== -1 || diff.removed.indexOf(id) !== -1);
            log.debug('red/nodes/flows.stop : stopping flow : ' + id);
            promises.push(activeFlows[id].stop(flowStateChanged ? null : stopList, removedList));
            if (type === 'full' || flowStateChanged || diff.removed.indexOf(id) !== -1) {
                delete activeFlows[id];
            }
        }
    });
    return Promise.all(promises).then(function () {
        for (const id in activeNodesToFlow) {
            if (activeNodesToFlow.hasOwnProperty(id)) {
                if (!activeFlows[activeNodesToFlow[id]]) {
                    delete activeNodesToFlow[id];
                }
            }
        }
        if (stopList) {
            stopList.forEach(function (id) {
                delete activeNodesToFlow[id];
            });
        }
        if (!muteLog) {
            if (type !== 'full') {
                log.info(log._('nodes.flows.stopped-modified-' + type));
            }
            else {
                log.info(log._('nodes.flows.stopped-flows'));
            }
        }
        util_1.events.emit('flows:stopped', { config: activeConfig, type, diff });
        util_1.events.emit('runtime-event', { id: 'runtime-state', payload: { state: 'stop', deploy: isDeploy }, retain: true });
        // Deprecated event
        util_1.events.emit('nodes-stopped');
    });
}
function checkTypeInUse(id) {
    const nodeInfo = (0, registry_1.getNodeInfo)(id);
    if (!nodeInfo) {
        throw new Error(log._('nodes.index.unrecognised-id', { id }));
    }
    else {
        const inUse = {};
        const config = getFlows();
        config.flows.forEach(function (n) {
            inUse[n.type] = (inUse[n.type] || 0) + 1;
        });
        const nodesInUse = [];
        nodeInfo.types.forEach(function (t) {
            if (inUse[t]) {
                nodesInUse.push(t);
            }
        });
        if (nodesInUse.length > 0) {
            const msg = nodesInUse.join(', ');
            const err = new Error(log._('nodes.index.type-in-use', { msg }));
            err.code = 'type_in_use';
            throw err;
        }
    }
}
function updateMissingTypes() {
    const subflowInstanceRE = /^subflow:(.+)$/;
    activeFlowConfig.missingTypes = [];
    for (const id in activeFlowConfig.allNodes) {
        if (activeFlowConfig.allNodes.hasOwnProperty(id)) {
            const node = activeFlowConfig.allNodes[id];
            if (node.type !== 'tab' && node.type !== 'subflow') {
                const subflowDetails = subflowInstanceRE.exec(node.type);
                if ((subflowDetails && !activeFlowConfig.subflows[subflowDetails[1]]) || (!subflowDetails && !(0, registry_1.get)(node.type))) {
                    if (activeFlowConfig.missingTypes.indexOf(node.type) === -1) {
                        activeFlowConfig.missingTypes.push(node.type);
                    }
                }
            }
        }
    }
}
function addFlow(flow, user) {
    let i, node;
    if (!flow.hasOwnProperty('nodes')) {
        throw new Error('missing nodes property');
    }
    flow.id = util_1.util.generateId();
    const tabNode = {
        type: 'tab',
        label: flow.label,
        id: flow.id
    };
    if (flow.hasOwnProperty('info')) {
        tabNode.info = flow.info;
    }
    if (flow.hasOwnProperty('disabled')) {
        tabNode.disabled = flow.disabled;
    }
    if (flow.hasOwnProperty('env')) {
        tabNode.env = flow.env;
    }
    const nodes = [tabNode];
    for (i = 0; i < flow.nodes.length; i++) {
        node = flow.nodes[i];
        if (activeFlowConfig.allNodes[node.id]) {
            // TODO nls
            throw new Error('duplicate id');
        }
        if (node.type === 'tab' || node.type === 'subflow') {
            throw new Error('invalid node type: ' + node.type);
        }
        node.z = flow.id;
        nodes.push(node);
    }
    if (flow.configs) {
        for (i = 0; i < flow.configs.length; i++) {
            node = flow.configs[i];
            if (activeFlowConfig.allNodes[node.id]) {
                // TODO nls
                throw new Error('duplicate id');
            }
            if (node.type === 'tab' || node.type === 'subflow') {
                throw new Error('invalid node type: ' + node.type);
            }
            node.z = flow.id;
            nodes.push(node);
        }
    }
    let newConfig = (0, clone_1.default)(activeConfig.flows);
    newConfig = newConfig.concat(nodes);
    return setFlows(newConfig, null, 'flows', true, null, user).then(function () {
        log.info(log._('nodes.flows.added-flow', { label: (flow.label ? flow.label + ' ' : '') + '[' + flow.id + ']' }));
        return flow.id;
    });
}
function getFlow(id) {
    let flow;
    if (id === 'global') {
        flow = activeFlowConfig;
    }
    else {
        flow = activeFlowConfig.flows[id];
    }
    if (!flow) {
        return null;
    }
    const result = {
        id
    };
    if (flow.label) {
        result.label = flow.label;
    }
    if (flow.hasOwnProperty('disabled')) {
        result.disabled = flow.disabled;
    }
    if (flow.hasOwnProperty('info')) {
        result.info = flow.info;
    }
    if (flow.hasOwnProperty('env')) {
        result.env = flow.env;
    }
    if (id !== 'global') {
        result.nodes = [];
    }
    if (flow.nodes) {
        const nodeIds = Object.keys(flow.nodes);
        if (nodeIds.length > 0) {
            result.nodes = nodeIds.map(function (nodeId) {
                const node = (0, clone_1.default)(flow.nodes[nodeId]);
                if (node.type === 'link out') {
                    delete node.wires;
                }
                return node;
            });
        }
    }
    if (flow.configs) {
        const configIds = Object.keys(flow.configs);
        result.configs = configIds.map(function (configId) {
            return (0, clone_1.default)(flow.configs[configId]);
        });
        if (result.configs.length === 0) {
            delete result.configs;
        }
    }
    if (flow.subflows) {
        const subflowIds = Object.keys(flow.subflows);
        result.subflows = subflowIds.map(function (subflowId) {
            const subflow = (0, clone_1.default)(flow.subflows[subflowId]);
            const nodeIds = Object.keys(subflow.nodes);
            subflow.nodes = nodeIds.map(function (id) {
                return subflow.nodes[id];
            });
            if (subflow.configs) {
                const configIds = Object.keys(subflow.configs);
                subflow.configs = configIds.map(function (id) {
                    return subflow.configs[id];
                });
            }
            delete subflow.instances;
            return subflow;
        });
        if (result.subflows.length === 0) {
            delete result.subflows;
        }
    }
    return result;
}
function updateFlow(id, newFlow, user) {
    let label = id;
    if (id !== 'global') {
        if (!activeFlowConfig.flows[id]) {
            const e = new Error();
            e.code = 404;
            throw e;
        }
        label = activeFlowConfig.flows[id].label;
    }
    let newConfig = (0, clone_1.default)(activeConfig.flows);
    let nodes;
    if (id === 'global') {
        // Remove all nodes whose z is not a known flow
        // When subflows can be owned by a flow, this logic will have to take
        // that into account
        newConfig = newConfig.filter(function (node) {
            return node.type === 'tab' || (node.hasOwnProperty('z') && activeFlowConfig.flows.hasOwnProperty(node.z));
        });
        // Add in the new config nodes
        nodes = newFlow.configs || [];
        if (newFlow.subflows) {
            // Add in the new subflows
            newFlow.subflows.forEach(function (sf) {
                nodes = nodes.concat(sf.nodes || []).concat(sf.configs || []);
                delete sf.nodes;
                delete sf.configs;
                nodes.push(sf);
            });
        }
    }
    else {
        newConfig = newConfig.filter(function (node) {
            return node.z !== id && node.id !== id;
        });
        const tabNode = {
            type: 'tab',
            label: newFlow.label,
            id
        };
        if (newFlow.hasOwnProperty('info')) {
            tabNode.info = newFlow.info;
        }
        if (newFlow.hasOwnProperty('disabled')) {
            tabNode.disabled = newFlow.disabled;
        }
        if (newFlow.hasOwnProperty('env')) {
            tabNode.env = newFlow.env;
        }
        if (newFlow.hasOwnProperty('credentials')) {
            tabNode.credentials = newFlow.credentials;
        }
        nodes = [tabNode].concat(newFlow.nodes || []).concat(newFlow.configs || []);
        nodes.forEach(function (n) {
            if (n.type !== 'tab') {
                n.z = id;
            }
        });
    }
    newConfig = newConfig.concat(nodes);
    return setFlows(newConfig, null, 'flows', true, null, user).then(function () {
        log.info(log._('nodes.flows.updated-flow', { label: (label ? label + ' ' : '') + '[' + id + ']' }));
    });
}
function removeFlow(id, user) {
    if (id === 'global') {
        // TODO: nls + error code
        throw new Error('not allowed to remove global');
    }
    const flow = activeFlowConfig.flows[id];
    if (!flow) {
        const e = new Error();
        e.code = 404;
        throw e;
    }
    let newConfig = (0, clone_1.default)(activeConfig.flows);
    newConfig = newConfig.filter(function (node) {
        return node.z !== id && node.id !== id;
    });
    return setFlows(newConfig, null, 'flows', true, null, user).then(function () {
        log.info(log._('nodes.flows.removed-flow', { label: (flow.label ? flow.label + ' ' : '') + '[' + flow.id + ']' }));
    });
}
exports.default = {
    init,
    /**
     * Load the current flow configuration from storage
     * @return a promise for the loading of the config
     */
    load,
    loadFlows: load,
    get: getNode,
    eachNode,
    /**
     * Gets the current flow configuration
     */
    getFlows,
    /**
     * Sets the current active config.
     * @param config the configuration to enable
     * @param type the type of deployment to do: full (default), nodes, flows, load
     * @return a promise for the saving/starting of the new flow
     */
    setFlows,
    /**
     * Starts the current flow configuration
     */
    startFlows: start,
    /**
     * Stops the current flow configuration
     * @return a promise for the stopping of the flow
     */
    stopFlows: stop,
    get started() {
        return started;
    },
    state: () => {
        return state;
    },
    // handleError: handleError,
    // handleStatus: handleStatus,
    checkTypeInUse,
    addFlow,
    getFlow,
    updateFlow,
    removeFlow,
    disableFlow: null,
    enableFlow: null,
    isDeliveryModeAsync() {
        // If settings is null, this is likely being run by unit tests
        return !settings || !settings.runtimeSyncDelivery;
    }
};
//# sourceMappingURL=index.js.map