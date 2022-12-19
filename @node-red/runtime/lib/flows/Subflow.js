"use strict";
/* eslint-disable no-invalid-this */
/* eslint-disable consistent-this */
/* eslint-disable @typescript-eslint/no-this-alias */
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
exports.createModuleInstance = exports.createSubflow = exports.Subflow = void 0;
const clone_1 = __importDefault(require("clone"));
const index_js_1 = __importDefault(require("../nodes/context/index.js"));
const util = require("node:util");
const util_1 = require("@node-red/util");
const credentials_1 = __importDefault(require("../nodes/credentials"));
const node_js_1 = __importDefault(require("../nodes/node.js"));
const flow_js_1 = require("./flow.js");
console.debug('flow', util.inspect(flow_js_1.Flow));
/**
 * Create deep copy of object
 */
function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Evaluate Input Value
 */
function evaluateInputValue(value, type, node) {
    if (type === 'bool') {
        return value === 'true' || value === true;
    }
    if (type === 'cred') {
        return value;
    }
    return util_1.util.evaluateNodeProperty(value, type, node, null, null);
}
/**
 * This class represents a subflow - which is handled as a special type of Flow
 */
class Subflow extends flow_js_1.Flow {
    subflowDef;
    subflowInstance;
    node_map;
    templateCredentials;
    instanceCredentials;
    env;
    _context;
    _alias;
    z;
    statusNode;
    node;
    /**
     * Create a Subflow object.
     * This takes a subflow definition and instance node, creates a clone of the
     * definition with unique ids applied and passes to the super class.
     * @param {[type]} parent          [description]
     * @param {[type]} globalFlow      [description]
     * @param {[type]} subflowDef      [description]
     * @param {[type]} subflowInstance [description]
     */
    constructor(parent, globalFlow, subflowDef, subflowInstance) {
        // console.log("CREATE SUBFLOW",subflowDef.id,subflowInstance.id,"alias?",subflowInstance._alias);
        // console.log("SubflowInstance\n"+JSON.stringify(subflowInstance," ",2));
        // console.log("SubflowDef\n"+JSON.stringify(subflowDef," ",2));
        const subflows = parent.flow.subflows;
        const globalSubflows = parent.global.subflows;
        const node_map = {};
        let node;
        let wires;
        let i;
        const subflowInternalFlowConfig = {
            id: subflowInstance.id,
            configs: {},
            nodes: {},
            subflows: {}
        };
        if (subflowDef.configs) {
            // Clone all of the subflow config node definitions and give them new IDs
            for (i in subflowDef.configs) {
                if (subflowDef.configs.hasOwnProperty(i)) {
                    node = createNodeInSubflow(subflowInstance.id, subflowDef.configs[i]);
                    node_map[node._alias] = node;
                    subflowInternalFlowConfig.configs[node.id] = node;
                }
            }
        }
        if (subflowDef.nodes) {
            // Clone all of the subflow node definitions and give them new IDs
            for (i in subflowDef.nodes) {
                if (subflowDef.nodes.hasOwnProperty(i)) {
                    node = createNodeInSubflow(subflowInstance.id, subflowDef.nodes[i]);
                    node_map[node._alias] = node;
                    subflowInternalFlowConfig.nodes[node.id] = node;
                }
            }
        }
        subflowInternalFlowConfig.subflows = (0, clone_1.default)(subflowDef.subflows || {});
        remapSubflowNodes(subflowInternalFlowConfig.configs, node_map);
        remapSubflowNodes(subflowInternalFlowConfig.nodes, node_map);
        // console.log("Instance config\n",JSON.stringify(subflowInternalFlowConfig,"",2));
        super(parent, globalFlow, subflowInternalFlowConfig);
        this.TYPE = 'subflow';
        this.subflowDef = subflowDef;
        this.subflowInstance = subflowInstance;
        this.node_map = node_map;
        this.path = parent.path + '/' + (subflowInstance._alias || subflowInstance.id);
        let id = subflowInstance.id;
        if (subflowInstance._alias) {
            id = subflowInstance._alias;
        }
        this.templateCredentials = credentials_1.default.get(subflowDef.id) || {};
        this.instanceCredentials = credentials_1.default.get(id) || {};
        const env = [];
        if (this.subflowDef.env) {
            this.subflowDef.env.forEach((e) => {
                env[e.name] = e;
                if (e.type === 'cred') {
                    e.value = this.templateCredentials[e.name];
                }
            });
        }
        if (this.subflowInstance.env) {
            this.subflowInstance.env.forEach((e) => {
                const old = env[e.name];
                const ui = old ? old.ui : null;
                env[e.name] = e;
                if (ui) {
                    env[e.name].ui = ui;
                }
                if (e.type === 'cred') {
                    if (!old || this.instanceCredentials.hasOwnProperty(e.name)) {
                        e.value = this.instanceCredentials[e.name];
                    }
                    else if (old) {
                        e.value = this.templateCredentials[e.name];
                    }
                }
            });
        }
        this.env = env;
    }
    /**
     * Start the subflow.
     * This creates a subflow instance node to handle the inbound messages. It also
     * rewires an subflow internal node that is connected to an output so it is connected
     * to the parent flow nodes the subflow instance is wired to.
     * @param  {[type]} diff [description]
     * @return {[type]}      [description]
     */
    start(diff) {
        const self = this;
        if (this.subflowDef.status) {
            const subflowStatusConfig = {
                id: this.subflowInstance.id + ':status',
                type: 'subflow-status',
                z: this.subflowInstance.id,
                _flow: this.parent
            };
            this.statusNode = new node_js_1.default(subflowStatusConfig);
            this.statusNode.on('input', function (msg) {
                if (msg.payload !== undefined) {
                    if (typeof msg.payload === 'string') {
                        // if msg.payload is a String, use it as status text
                        self.node.status({ text: msg.payload });
                        return;
                    }
                    else if (Object.prototype.toString.call(msg.payload) === '[object Object]') {
                        if (msg.payload.hasOwnProperty('text') ||
                            msg.payload.hasOwnProperty('fill') ||
                            msg.payload.hasOwnProperty('shape') ||
                            Object.keys(msg.payload).length === 0) {
                            // msg.payload is an object that looks like a status object
                            self.node.status(msg.payload);
                            return;
                        }
                    }
                    // Anything else - inspect it and use as status text
                    let text = util.inspect(msg.payload);
                    if (text.length > 32) {
                        text = text.substr(0, 32) + '...';
                    }
                    self.node.status({ text });
                }
                else if (msg.status !== undefined) {
                    // if msg.status exists
                    if (msg.status.hasOwnProperty('text') && msg.status.text.indexOf('common.') === 0) {
                        msg.status.text = 'node-red:' + msg.status.text;
                    }
                    self.node.status(msg.status);
                }
            });
        }
        const subflowInstanceConfig = {
            id: this.subflowInstance.id,
            type: this.subflowInstance.type,
            z: this.subflowInstance.z,
            name: this.subflowInstance.name,
            wires: [],
            _flow: this,
            _originalWires: undefined
        };
        if (this.subflowDef.in) {
            subflowInstanceConfig.wires = this.subflowDef.in.map(function (n) {
                return n.wires.map(function (w) {
                    return self.node_map[w.id].id;
                });
            });
            subflowInstanceConfig._originalWires = (0, clone_1.default)(subflowInstanceConfig.wires);
        }
        this.node = new node_js_1.default(subflowInstanceConfig);
        this.node.on('input', function (msg) {
            this.send(msg);
        });
        // Called when the subflow instance node is being stopped
        this.node.on('close', function (done) {
            this.status({});
            // Stop the complete subflow
            self.stop().finally(done);
        });
        this.node.status = (status) => this.parent.handleStatus(this.node, status);
        // Create a context instance
        // console.log("Node.context",this.type,"id:",this._alias||this.id,"z:",this.z)
        this._context = index_js_1.default.get(this._alias || this.id, this.z);
        this.node._updateWires = this.node.updateWires;
        this.node.updateWires = function (newWires) {
            // Wire the subflow outputs
            if (self.subflowDef.out) {
                let node, wires, i, j;
                // Restore the original wiring to the internal nodes
                subflowInstanceConfig.wires = (0, clone_1.default)(subflowInstanceConfig._originalWires);
                for (i = 0; i < self.subflowDef.out.length; i++) {
                    wires = self.subflowDef.out[i].wires;
                    for (j = 0; j < wires.length; j++) {
                        if (wires[j].id !== self.subflowDef.id) {
                            node = self.node_map[wires[j].id];
                            if (node._originalWires) {
                                node.wires = (0, clone_1.default)(node._originalWires);
                            }
                        }
                    }
                }
                const modifiedNodes = {};
                let subflowInstanceModified = false;
                for (i = 0; i < self.subflowDef.out.length; i++) {
                    wires = self.subflowDef.out[i].wires;
                    for (j = 0; j < wires.length; j++) {
                        if (wires[j].id === self.subflowDef.id) {
                            subflowInstanceConfig.wires[wires[j].port] = subflowInstanceConfig.wires[wires[j].port].concat(newWires[i]);
                            subflowInstanceModified = true;
                        }
                        else {
                            node = self.node_map[wires[j].id];
                            node.wires[wires[j].port] = node.wires[wires[j].port].concat(newWires[i]);
                            modifiedNodes[node.id] = node;
                        }
                    }
                }
                Object.keys(modifiedNodes).forEach(function (id) {
                    const localNode = modifiedNodes[id];
                    self.activeNodes[id].updateWires(localNode.wires);
                });
                if (subflowInstanceModified) {
                    self.node._updateWires(subflowInstanceConfig.wires);
                }
            }
        };
        // Wire the subflow outputs
        if (this.subflowDef.out) {
            for (let i = 0; i < this.subflowDef.out.length; i++) {
                // i: the output index
                // This is what this Output is wired to
                const wires = this.subflowDef.out[i].wires;
                for (let j = 0; j < wires.length; j++) {
                    if (wires[j].id === this.subflowDef.id) {
                        // A subflow input wired straight to a subflow output
                        subflowInstanceConfig.wires[wires[j].port] = subflowInstanceConfig.wires[wires[j].port].concat(this.subflowInstance.wires[i]);
                        this.node._updateWires(subflowInstanceConfig.wires);
                    }
                    else {
                        const node = self.node_map[wires[j].id];
                        if (!node._originalWires) {
                            node._originalWires = (0, clone_1.default)(node.wires);
                        }
                        node.wires[wires[j].port] = (node.wires[wires[j].port] || []).concat(this.subflowInstance.wires[i]);
                    }
                }
            }
        }
        if (this.subflowDef.status) {
            const subflowStatusId = this.statusNode.id;
            const wires = this.subflowDef.status.wires;
            for (let j = 0; j < wires.length; j++) {
                if (wires[j].id === this.subflowDef.id) {
                    // A subflow input wired straight to a subflow output
                    subflowInstanceConfig.wires[wires[j].port].push(subflowStatusId);
                    this.node._updateWires(subflowInstanceConfig.wires);
                }
                else {
                    const node = self.node_map[wires[j].id];
                    if (!node._originalWires) {
                        node._originalWires = (0, clone_1.default)(node.wires);
                    }
                    node.wires[wires[j].port] = node.wires[wires[j].port] || [];
                    node.wires[wires[j].port].push(subflowStatusId);
                }
            }
        }
        super.start(diff);
    }
    /**
     * Stop this subflow.
     * The `stopList` argument helps define what needs to be stopped in the case
     * of a modified-nodes/flows type deploy.
     * @param  {[type]} stopList    [description]
     * @param  {[type]} removedList [description]
     * @return {[type]}             [description]
     */
    stop(stopList, removedList) {
        const nodes = Object.keys(this.activeNodes);
        return super.stop(stopList, removedList).then((res) => {
            nodes.forEach((id) => {
                util_1.events.emit('node-status', {
                    id
                });
            });
            return res;
        });
    }
    /**
     * Get environment variable of subflow
     * @param {String}   name   name of env var
     * @return {Object}  val    value of env var
     */
    getSetting(name) {
        if (!/^\$parent\./.test(name)) {
            const env = this.env;
            if (env && env.hasOwnProperty(name)) {
                const val = env[name];
                // If this is an env type property we need to be careful not
                // to get into lookup loops.
                // 1. if the value to lookup is the same as this one, go straight to parent
                // 2. otherwise, check if it is a compound env var ("foo $(bar)")
                //    and if so, substitute any instances of `name` with $parent.name
                // See https://github.com/node-red/node-red/issues/2099
                if (val.type !== 'env' || val.value !== name) {
                    let value = val.value;
                    const type = val.type;
                    if (type === 'env') {
                        value = value.replace(new RegExp('\\${' + name + '}', 'g'), '${$parent.' + name + '}');
                    }
                    try {
                        return evaluateInputValue(value, type, this.node);
                    }
                    catch (e) {
                        this.error(e);
                        return undefined;
                    }
                }
                else {
                    // This _is_ an env property pointing at itself - go to parent
                }
            }
        }
        else {
            // name starts $parent. ... so delegate to parent automatically
            name = name.substring(8);
        }
        const node = this.subflowInstance;
        if (node) {
            if (name === 'NR_NODE_NAME') {
                return node.name;
            }
            if (name === 'NR_NODE_ID') {
                return node.id;
            }
            if (name === 'NR_NODE_PATH') {
                return node._path;
            }
        }
        if (node.g) {
            const group = this.getGroupNode(node.g);
            const [result, newName] = this.getGroupEnvSetting(node, group, name);
            if (result) {
                return result.val;
            }
            name = newName;
        }
        const parent = this.parent;
        if (parent) {
            const val = parent.getSetting(name);
            return val;
        }
        return undefined;
    }
    /**
     * Get a node instance from this subflow.
     * If the subflow has a status node, check for that, otherwise use
     * the super-class function
     * @param  {String} id [description]
     * @param  {Boolean} cancelBubble    if true, prevents the flow from passing the request to the parent
     *                                   This stops infinite loops when the parent asked this Flow for the
     *                                   node to begin with.
     * @return {[type]}    [description]
     */
    getNode(id, cancelBubble) {
        if (this.statusNode && this.statusNode.id === id) {
            return this.statusNode;
        }
        return super.getNode(id, cancelBubble);
    }
    /**
     * Handle a status event from a node within this flow.
     * @param  {Node}    node          The original node that triggered the event
     * @param  {Object}  statusMessage The status object
     * @param  {Node}    reportingNode The node emitting the status event.
     *                                 This could be a subflow instance node when the status
     *                                 is being delegated up.
     * @param  {boolean} muteStatus    Whether to emit the status event
     * @return {[type]}               [description]
     */
    handleStatus(node, statusMessage, reportingNode, muteStatus) {
        let handled = super.handleStatus(node, statusMessage, reportingNode, muteStatus);
        if (!handled) {
            if (!this.statusNode || node === this.node) {
                // No status node on this subflow caught the status message.
                // AND there is no Subflow Status node - so the user isn't
                // wanting to manage status messages themselves
                // Pass up to the parent with this subflow's instance as the
                // reporting node
                handled = this.parent.handleStatus(node, statusMessage, this.node, true);
            }
        }
        return handled;
    }
    /**
     * Handle an error event from a node within this flow. If there are no Catch
     * nodes within this flow, pass the event to the parent flow.
     * @param  {[type]} node          [description]
     * @param  {[type]} logMessage    [description]
     * @param  {[type]} msg           [description]
     * @param  {[type]} reportingNode [description]
     * @return {[type]}               [description]
     */
    handleError(node, logMessage, msg, reportingNode) {
        let handled = super.handleError(node, logMessage, msg, reportingNode);
        if (!handled) {
            // No catch node on this subflow caught the error message.
            // Pass up to the parent with the subflow's instance as the
            // reporting node.
            handled = this.parent.handleError(node, logMessage, msg, this.node);
        }
        return handled;
    }
}
exports.Subflow = Subflow;
/**
 * Clone a node definition for use within a subflow instance.
 * Give the node a new id and set its _alias property to record
 * its association with the original node definition.
 * @param  {[type]} subflowInstanceId [description]
 * @param  {[type]} def               [description]
 * @return {[type]}                   [description]
 */
function createNodeInSubflow(subflowInstanceId, def) {
    const node = (0, clone_1.default)(def);
    const nid = util_1.util.generateId();
    // console.log("Create Node In subflow",node._alias, "--->",nid, "(",node.type,")")
    // node_map[node.id] = node;
    node._alias = node.id;
    node.id = nid;
    node.z = subflowInstanceId;
    return node;
}
/**
 * Given an object of {id:nodes} and a map of {old-id:node}, modifiy all
 * properties in the nodes object to reference the new node ids.
 * This handles:
 *  - node.wires,
 *  - node.scope of Complete, Catch and Status nodes,
 *  - node.XYZ for any property where XYZ is recognised as an old property
 * @param  {[type]} nodes   [description]
 * @param  {[type]} nodeMap [description]
 * @return {[type]}         [description]
 */
function remapSubflowNodes(nodes, nodeMap) {
    for (const id in nodes) {
        if (nodes.hasOwnProperty(id)) {
            const node = nodes[id];
            if (node.wires) {
                const outputs = node.wires;
                for (let j = 0; j < outputs.length; j++) {
                    const wires = outputs[j];
                    for (let k = 0; k < wires.length; k++) {
                        if (nodeMap[outputs[j][k]]) {
                            outputs[j][k] = nodeMap[outputs[j][k]].id;
                        }
                        else {
                            outputs[j][k] = null;
                        }
                    }
                }
            }
            if ((node.type === 'complete' || node.type === 'catch' || node.type === 'status') && node.scope) {
                node.scope = node.scope.map(function (scopeId) {
                    return nodeMap[scopeId] ? nodeMap[scopeId].id : '';
                });
            }
            else {
                for (const prop in node) {
                    if (node.hasOwnProperty(prop) && prop !== '_alias') {
                        if (nodeMap[node[prop]]) {
                            node[prop] = nodeMap[node[prop]].id;
                        }
                    }
                }
            }
        }
    }
}
class SubflowModule extends Subflow {
    subflowType;
    /**
     * Create a Subflow Module object.
     * This is a node that has been published as a subflow.
     * @param {[type]} parent          [description]
     * @param {[type]} globalFlow      [description]
     * @param {[type]} subflowDef      [description]
     * @param {[type]} subflowInstance [description]
     */
    constructor(type, parent, globalFlow, subflowDef, subflowInstance) {
        super(parent, globalFlow, subflowDef, subflowInstance);
        this.TYPE = `module:${type}`;
        this.subflowType = type;
    }
    /**
     * [log description]
     * @param  {[type]} msg [description]
     * @return {[type]}     [description]
     */
    log(msg) {
        if (msg.id) {
            msg.id = this.id;
        }
        if (msg.type) {
            msg.type = this.subflowType;
        }
        super.log(msg);
    }
}
function createSubflow(parent, globalFlow, subflowDef, subflowInstance) {
    return new Subflow(parent, globalFlow, subflowDef, subflowInstance);
}
exports.createSubflow = createSubflow;
function createModuleInstance(type, parent, globalFlow, subflowDef, subflowInstance) {
    return new SubflowModule(type, parent, globalFlow, subflowDef, subflowInstance);
}
exports.createModuleInstance = createModuleInstance;
//# sourceMappingURL=subflow.js.map