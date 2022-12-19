"use strict";
/* eslint-disable no-underscore-dangle */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clone_1 = __importDefault(require("clone"));
const util_1 = require("@node-red/util");
const subflow_js_1 = require("./subflow.js");
const registry_1 = require("@node-red/registry");
const subflowInstanceRE = /^subflow:(.+)$/;
let envVarExcludes = {};
function diffNodes(oldNode, newNode) {
    if (oldNode === null) {
        return true;
    }
    const oldKeys = Object.keys(oldNode).filter(function (p) {
        return p !== 'x' && p !== 'y' && p !== 'wires';
    });
    const newKeys = Object.keys(newNode).filter(function (p) {
        return p !== 'x' && p !== 'y' && p !== 'wires';
    });
    if (oldKeys.length !== newKeys.length) {
        return true;
    }
    for (let i = 0; i < newKeys.length; i++) {
        const p = newKeys[i];
        if (!util_1.util.compareObjects(oldNode[p], newNode[p])) {
            return true;
        }
    }
    return false;
}
const EnvVarPropertyRE_old = /^\$\((\S+)\)$/;
const EnvVarPropertyRE = /^\${(\S+)}$/;
function mapEnvVarProperties(obj, prop, flow, config) {
    const v = obj[prop];
    if (Buffer.isBuffer(v)) {
        return;
    }
    else if (Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) {
            mapEnvVarProperties(v, i, flow, config);
        }
    }
    else if (typeof obj[prop] === 'string') {
        if (obj[prop][0] === '$' && (EnvVarPropertyRE_old.test(v) || EnvVarPropertyRE.test(v))) {
            const envVar = v.substring(2, v.length - 1);
            const r = util_1.util.getSetting(config, envVar, flow);
            obj[prop] = r || obj[prop];
        }
    }
    else {
        for (const p in v) {
            if (v.hasOwnProperty(p)) {
                mapEnvVarProperties(v, p, flow, config);
            }
        }
    }
}
function createNode(flow, config) {
    let newNode = null;
    const type = config.type;
    try {
        const nodeTypeConstructor = (0, registry_1.get)(type);
        if (typeof nodeTypeConstructor === 'function') {
            const conf = (0, clone_1.default)(config);
            delete conf.credentials;
            try {
                Object.defineProperty(conf, '_module', { value: (0, registry_1.getNodeInfo)(type), enumerable: false, writable: true });
                Object.defineProperty(conf, '_flow', { value: flow, enumerable: false, writable: true });
                Object.defineProperty(conf, '_path', { value: `${flow.path}/${config._alias || config.id}`, enumerable: false, writable: true });
                for (const p in conf) {
                    if (conf.hasOwnProperty(p)) {
                        mapEnvVarProperties(conf, p, flow, conf);
                    }
                }
                newNode = new nodeTypeConstructor(conf);
            }
            catch (err) {
                util_1.log.log({
                    level: util_1.log.ERROR,
                    id: conf.id,
                    type,
                    msg: err
                });
            }
        }
        else if (nodeTypeConstructor) {
            // console.log(nodeTypeConstructor)
            const subflowConfig = parseConfig([nodeTypeConstructor.subflow].concat(nodeTypeConstructor.subflow.flow));
            const subflowInstanceConfig = subflowConfig.subflows[nodeTypeConstructor.subflow.id];
            delete subflowConfig.subflows[nodeTypeConstructor.subflow.id];
            subflowInstanceConfig.subflows = subflowConfig.subflows;
            const instanceConfig = (0, clone_1.default)(config);
            instanceConfig.env = (0, clone_1.default)(nodeTypeConstructor.subflow.env);
            instanceConfig.env = nodeTypeConstructor.subflow.env.map((nodeProp) => {
                let nodePropType;
                let nodePropValue = config[nodeProp.name];
                if (nodeProp.type === 'cred') {
                    nodePropType = 'cred';
                }
                else {
                    switch (typeof config[nodeProp.name]) {
                        case 'string':
                            nodePropType = 'str';
                            break;
                        case 'number':
                            nodePropType = 'num';
                            break;
                        case 'boolean':
                            nodePropType = 'bool';
                            nodePropValue = nodeProp ? 'true' : 'false';
                            break;
                        default:
                            nodePropType = config[nodeProp.name].type;
                            nodePropValue = config[nodeProp.name].value;
                    }
                }
                return {
                    name: nodeProp.name,
                    type: nodePropType,
                    value: nodePropValue
                };
            });
            const subflow = (0, subflow_js_1.createModuleInstance)(nodeTypeConstructor.type, flow, flow.global, subflowInstanceConfig, instanceConfig);
            // Register this subflow as an instance node of the parent flow.
            // This allows nodes inside the subflow to get ahold of each other
            // such as a node accessing its config node
            flow.subflowInstanceNodes[config.id] = subflow;
            subflow.start();
            return subflow.node;
        }
    }
    catch (err) {
        util_1.log.error(err);
    }
    return newNode;
}
function parseConfig(config) {
    const flow = {};
    flow.allNodes = {};
    flow.subflows = {};
    flow.configs = {};
    flow.flows = {};
    flow.groups = {};
    flow.missingTypes = [];
    config.forEach(function (n) {
        flow.allNodes[n.id] = (0, clone_1.default)(n);
        if (n.type === 'tab') {
            flow.flows[n.id] = n;
            flow.flows[n.id].subflows = {};
            flow.flows[n.id].configs = {};
            flow.flows[n.id].nodes = {};
        }
        if (n.type === 'group') {
            flow.groups[n.id] = n;
        }
    });
    // TODO: why a separate forEach? this can be merged with above
    config.forEach(function (n) {
        if (n.type === 'subflow') {
            flow.subflows[n.id] = n;
            flow.subflows[n.id].configs = {};
            flow.subflows[n.id].nodes = {};
            flow.subflows[n.id].instances = [];
        }
    });
    const linkWires = {};
    const linkOutNodes = [];
    config.forEach(function (n) {
        if (n.type !== 'subflow' && n.type !== 'tab' && n.type !== 'group') {
            const subflowDetails = subflowInstanceRE.exec(n.type);
            if ((subflowDetails && !flow.subflows[subflowDetails[1]]) || (!subflowDetails && !(0, registry_1.get)(n.type))) {
                if (flow.missingTypes.indexOf(n.type) === -1) {
                    flow.missingTypes.push(n.type);
                }
            }
            let container = null;
            if (flow.flows[n.z]) {
                container = flow.flows[n.z];
            }
            else if (flow.subflows[n.z]) {
                container = flow.subflows[n.z];
            }
            if (n.hasOwnProperty('x') && n.hasOwnProperty('y')) {
                if (subflowDetails) {
                    const subflowType = subflowDetails[1];
                    n.subflow = subflowType;
                    flow.subflows[subflowType].instances.push(n);
                }
                if (container) {
                    container.nodes[n.id] = n;
                }
            }
            else if (container) {
                container.configs[n.id] = n;
            }
            else {
                flow.configs[n.id] = n;
                flow.configs[n.id]._users = [];
            }
            if (n.type === 'link in' && n.links) {
                // Ensure wires are present in corresponding link out nodes
                n.links.forEach(function (id) {
                    linkWires[id] = linkWires[id] || {};
                    linkWires[id][n.id] = true;
                });
            }
            else if (n.type === 'link out' && n.links) {
                linkWires[n.id] = linkWires[n.id] || {};
                n.links.forEach(function (id) {
                    linkWires[n.id][id] = true;
                });
                linkOutNodes.push(n);
            }
        }
    });
    linkOutNodes.forEach(function (n) {
        const links = linkWires[n.id];
        const targets = Object.keys(links);
        n.wires = [targets];
    });
    const addedTabs = {};
    config.forEach(function (n) {
        if (n.type !== 'subflow' && n.type !== 'tab' && n.type !== 'group') {
            for (const prop in n) {
                if (n.hasOwnProperty(prop) &&
                    prop !== 'id' &&
                    prop !== 'wires' &&
                    prop !== 'type' &&
                    prop !== '_users' &&
                    flow.configs.hasOwnProperty(n[prop])) {
                    // This property references a global config node
                    flow.configs[n[prop]]._users.push(n.id);
                }
            }
            if (n.z && !flow.subflows[n.z]) {
                if (!flow.flows[n.z]) {
                    flow.flows[n.z] = { type: 'tab', id: n.z };
                    flow.flows[n.z].subflows = {};
                    flow.flows[n.z].configs = {};
                    flow.flows[n.z].nodes = {};
                    addedTabs[n.z] = flow.flows[n.z];
                }
                if (addedTabs[n.z]) {
                    if (n.hasOwnProperty('x') && n.hasOwnProperty('y')) {
                        addedTabs[n.z].nodes[n.id] = n;
                    }
                    else {
                        addedTabs[n.z].configs[n.id] = n;
                    }
                }
            }
        }
    });
    return flow;
}
exports.default = {
    init(runtime) {
        envVarExcludes = {};
        if (runtime.settings.hasOwnProperty('envVarExcludes') && Array.isArray(runtime.settings.envVarExcludes)) {
            runtime.settings.envVarExcludes.forEach((v) => (envVarExcludes[v] = true));
        }
    },
    getEnvVar(k) {
        return !envVarExcludes[k] ? process.env[k] : undefined;
    },
    diffNodes,
    mapEnvVarProperties,
    parseConfig,
    diffConfigs(oldConfig, newConfig) {
        let id;
        let node;
        let nn;
        let wires;
        let j, k;
        if (!oldConfig) {
            oldConfig = {
                flows: {},
                allNodes: {}
            };
        }
        const changedSubflows = {};
        const added = {};
        const removed = {};
        const changed = {};
        const wiringChanged = {};
        const linkMap = {};
        const changedTabs = {};
        // Look for tabs that have been removed
        for (id in oldConfig.flows) {
            if (oldConfig.flows.hasOwnProperty(id) && !newConfig.flows.hasOwnProperty(id)) {
                removed[id] = oldConfig.allNodes[id];
            }
        }
        // Look for tabs that have been disabled
        for (id in oldConfig.flows) {
            if (oldConfig.flows.hasOwnProperty(id) && newConfig.flows.hasOwnProperty(id)) {
                const originalState = oldConfig.flows[id].disabled || false;
                const newState = newConfig.flows[id].disabled || false;
                if (originalState !== newState) {
                    changedTabs[id] = true;
                    if (originalState) {
                        added[id] = oldConfig.allNodes[id];
                    }
                    else {
                        removed[id] = oldConfig.allNodes[id];
                    }
                }
            }
        }
        for (id in oldConfig.allNodes) {
            if (oldConfig.allNodes.hasOwnProperty(id)) {
                node = oldConfig.allNodes[id];
                if (node.type !== 'tab') {
                    // build the map of what this node was previously wired to
                    if (node.wires) {
                        linkMap[node.id] = linkMap[node.id] || [];
                        for (j = 0; j < node.wires.length; j++) {
                            wires = node.wires[j];
                            for (k = 0; k < wires.length; k++) {
                                linkMap[node.id].push(wires[k]);
                                nn = oldConfig.allNodes[wires[k]];
                                if (nn) {
                                    linkMap[nn.id] = linkMap[nn.id] || [];
                                    linkMap[nn.id].push(node.id);
                                }
                            }
                        }
                    }
                    // This node has been removed or its flow disabled
                    if (removed[node.z] || !newConfig.allNodes.hasOwnProperty(id)) {
                        removed[id] = node;
                        // Mark the container as changed
                        if (!removed[node.z] && newConfig.allNodes[removed[id].z]) {
                            changed[removed[id].z] = newConfig.allNodes[removed[id].z];
                            if (changed[removed[id].z].type === 'subflow') {
                                changedSubflows[removed[id].z] = changed[removed[id].z];
                                // delete removed[id];
                            }
                        }
                    }
                    else if (added[node.z]) {
                        added[id] = node;
                    }
                    else {
                        const currentState = node.d;
                        const newState = newConfig.allNodes[id].d;
                        if (!currentState && newState) {
                            removed[id] = node;
                        }
                        // This node has a material configuration change
                        if (diffNodes(node, newConfig.allNodes[id]) || newConfig.allNodes[id].credentials) {
                            changed[id] = newConfig.allNodes[id];
                            if (changed[id].type === 'subflow') {
                                changedSubflows[id] = changed[id];
                            }
                            // Mark the container as changed
                            if (newConfig.allNodes[changed[id].z]) {
                                changed[changed[id].z] = newConfig.allNodes[changed[id].z];
                                if (changed[changed[id].z].type === 'subflow') {
                                    changedSubflows[changed[id].z] = changed[changed[id].z];
                                    delete changed[id];
                                }
                            }
                        }
                        // This node's wiring has changed
                        if (!util_1.util.compareObjects(node.wires, newConfig.allNodes[id].wires)) {
                            wiringChanged[id] = newConfig.allNodes[id];
                            // Mark the container as changed
                            if (newConfig.allNodes[wiringChanged[id].z]) {
                                changed[wiringChanged[id].z] = newConfig.allNodes[wiringChanged[id].z];
                                if (changed[wiringChanged[id].z].type === 'subflow') {
                                    changedSubflows[wiringChanged[id].z] = changed[wiringChanged[id].z];
                                    delete wiringChanged[id];
                                }
                            }
                        }
                    }
                }
            }
        }
        // Look for added nodes
        for (id in newConfig.allNodes) {
            if (newConfig.allNodes.hasOwnProperty(id)) {
                node = newConfig.allNodes[id];
                // build the map of what this node is now wired to
                if (node.wires) {
                    linkMap[node.id] = linkMap[node.id] || [];
                    for (j = 0; j < node.wires.length; j++) {
                        wires = node.wires[j];
                        for (k = 0; k < wires.length; k++) {
                            if (linkMap[node.id].indexOf(wires[k]) === -1) {
                                linkMap[node.id].push(wires[k]);
                            }
                            nn = newConfig.allNodes[wires[k]];
                            if (nn) {
                                linkMap[nn.id] = linkMap[nn.id] || [];
                                if (linkMap[nn.id].indexOf(node.id) === -1) {
                                    linkMap[nn.id].push(node.id);
                                }
                            }
                        }
                    }
                }
                // This node has been added
                if (!oldConfig.allNodes.hasOwnProperty(id)) {
                    added[id] = node;
                    // Mark the container as changed
                    if (newConfig.allNodes[added[id].z]) {
                        changed[added[id].z] = newConfig.allNodes[added[id].z];
                        if (changed[added[id].z].type === 'subflow') {
                            changedSubflows[added[id].z] = changed[added[id].z];
                            delete added[id];
                        }
                    }
                }
            }
        }
        let madeChange;
        // Loop through the nodes looking for references to changed config nodes
        // Repeat the loop if anything is marked as changed as it may need to be
        // propagated to parent nodes.
        // TODO: looping through all nodes every time is a bit inefficient - could be more targeted
        do {
            madeChange = false;
            for (id in newConfig.allNodes) {
                if (newConfig.allNodes.hasOwnProperty(id)) {
                    node = newConfig.allNodes[id];
                    for (const prop in node) {
                        if (node.hasOwnProperty(prop) && prop !== 'z' && prop !== 'id' && prop !== 'wires') {
                            // This node has a property that references a changed/removed node
                            // Assume it is a config node change and mark this node as
                            // changed.
                            const changeOrigin = changed[node[prop]];
                            if (changeOrigin || removed[node[prop]]) {
                                if (!changed[node.id]) {
                                    if (changeOrigin && prop === 'g' && changeOrigin.type === 'group') {
                                        const oldNode = oldConfig.allNodes[node.id];
                                        // ignore change of group node
                                        // if group of this node not changed
                                        if (oldNode && node.g === oldNode.g) {
                                            continue;
                                        }
                                    }
                                    madeChange = true;
                                    changed[node.id] = node;
                                    // This node exists within subflow template
                                    // Mark the template as having changed
                                    if (newConfig.allNodes[node.z]) {
                                        changed[node.z] = newConfig.allNodes[node.z];
                                        if (changed[node.z].type === 'subflow') {
                                            changedSubflows[node.z] = changed[node.z];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } while (madeChange === true);
        // Find any nodes that exist on a subflow template and remove from changed
        // list as the parent subflow will now be marked as containing a change
        for (id in newConfig.allNodes) {
            if (newConfig.allNodes.hasOwnProperty(id)) {
                node = newConfig.allNodes[id];
                if (newConfig.allNodes[node.z] && newConfig.allNodes[node.z].type === 'subflow') {
                    delete changed[node.id];
                }
            }
        }
        // Recursively mark all instances of changed subflows as changed
        const changedSubflowStack = Object.keys(changedSubflows);
        while (changedSubflowStack.length > 0) {
            const subflowId = changedSubflowStack.pop();
            for (id in newConfig.allNodes) {
                if (newConfig.allNodes.hasOwnProperty(id)) {
                    node = newConfig.allNodes[id];
                    if (node.type === 'subflow:' + subflowId) {
                        if (!changed[node.id]) {
                            changed[node.id] = node;
                            if (!changed[changed[node.id].z] && newConfig.allNodes[changed[node.id].z]) {
                                changed[changed[node.id].z] = newConfig.allNodes[changed[node.id].z];
                                if (newConfig.allNodes[changed[node.id].z].type === 'subflow') {
                                    // This subflow instance is inside a subflow. Add the
                                    // containing subflow to the stack to mark
                                    changedSubflowStack.push(changed[node.id].z);
                                    delete changed[node.id];
                                }
                            }
                        }
                    }
                }
            }
        }
        const diff = {
            added: Object.keys(added),
            changed: Object.keys(changed),
            removed: Object.keys(removed),
            rewired: Object.keys(wiringChanged),
            linked: []
        };
        // Traverse the links of all modified nodes to mark the connected nodes
        let modifiedNodes = diff.added.concat(diff.changed).concat(diff.removed).concat(diff.rewired);
        const visited = {};
        while (modifiedNodes.length > 0) {
            node = modifiedNodes.pop();
            if (!visited[node]) {
                visited[node] = true;
                if (linkMap[node]) {
                    if (!changed[node] && !added[node] && !removed[node] && !wiringChanged[node]) {
                        diff.linked.push(node);
                    }
                    modifiedNodes = modifiedNodes.concat(linkMap[node]);
                }
            }
        }
        // console.log(diff);
        // for (id in newConfig.allNodes) {
        //     console.log(
        //         (added[id]?"a":(changed[id]?"c":" "))+(wiringChanged[id]?"w":" ")+(diff.linked.indexOf(id)!==-1?"l":" "),
        //         newConfig.allNodes[id].type.padEnd(10),
        //         id.padEnd(16),
        //         (newConfig.allNodes[id].z||"").padEnd(16),
        //         newConfig.allNodes[id].name||newConfig.allNodes[id].label||""
        //     );
        // }
        // for (id in removed) {
        //     console.log(
        //         "- "+(diff.linked.indexOf(id)!==-1?"~":" "),
        //         id,
        //         oldConfig.allNodes[id].type,
        //         oldConfig.allNodes[id].name||oldConfig.allNodes[id].label||""
        //     );
        // }
        return diff;
    },
    /**
     * Create a new instance of a node
     * @param  {Flow} flow     The containing flow
     * @param  {object} config The node configuration object
     * @return {Node}          The instance of the node
     */
    createNode
};
//# sourceMappingURL=util.js.map