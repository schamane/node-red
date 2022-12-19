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

import clone from 'clone';
import util from 'node:util';
import {
  registerType as registry_registerType,
  registerSubflow as registry_registerSubflow,
  init as registry_init,
  disableNode as registry_disableNode,
  enableNodeSet,
  installModule as registry_installModule,
  getModuleInfo,
  uninstallModule as registry_uninstallModule,
  load,
  installerEnabled,
  get,
  getNodeInfo,
  getNodeList,
  getNodeConfigs,
  getNodeConfig,
  getNodeIconPath,
  getNodeIcons,
  getNodeExampleFlows,
  getNodeExampleFlowPath,
  getModuleResource,
  clear,
  cleanModuleList
} from '@node-red/registry';
import credentials from './credentials.js';
import flows from '../flows/index.js';
import flowUtil from '../flows/util.js';
import context from './context/index.js';
import Node from './node.js';
import { events } from '@node-red/util';

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
      credentials.register(type, opts.credentials);
    }
    if (opts.settings) {
      try {
        settings.registerNodeSettings(type, opts.settings);
      } catch (err) {
        log.warn('[' + type + '] ' + err.message);
      }
    }
  }
  if (!(constructor.prototype instanceof Node)) {
    if (Object.getPrototypeOf(constructor.prototype) === Object.prototype) {
      util.inherits(constructor, Node);
    } else {
      let proto = constructor.prototype;
      while (Object.getPrototypeOf(proto) !== Object.prototype) {
        proto = Object.getPrototypeOf(proto);
      }
      // TODO: This is a partial implementation of util.inherits >= node v5.0.0
      //      which should be changed when support for node < v5.0.0 is dropped
      //      see: https://github.com/nodejs/node/pull/3455
      proto.constructor.super_ = Node;
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(proto, Node.prototype);
      } else {
        // hack for node v0.10
        proto.__proto__ = Node.prototype;
      }
    }
  }
  registry_registerType(nodeSet, type, constructor, opts);
}

/**
 * Called from a Node's constructor function, invokes the super-class
 * constructor and attaches any credentials to the node.
 * @param node the node object being created
 * @param def the instance definition for the node
 */
function createNode(node, def) {
  Node.call(node, def);
  let id = node.id;
  if (def._alias) {
    id = def._alias;
  }
  let creds = credentials.get(id);
  if (creds) {
    creds = clone(creds);
    // console.log("Attaching credentials to ",node.id);
    // allow $(foo) syntax to substitute env variables for credentials also...
    for (const p in creds) {
      if (creds.hasOwnProperty(p)) {
        flowUtil.mapEnvVarProperties(creds, p, node._flow, node);
      }
    }
    node.credentials = creds;
  } else if (credentials.getDefinition(node.type)) {
    node.credentials = {};
  }
}

function registerSubflow(nodeSet, subflow) {
  // TODO: extract credentials definition from subflow properties
  const registeredType = registry_registerSubflow(nodeSet, subflow);

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
      credentials.register(registeredType.type, creds);
    }
  }
}

function init(runtime) {
  settings = runtime.settings;
  log = runtime.log;
  credentials.init(runtime);
  flows.init(runtime);
  registry_init(runtime);
  context.init(runtime.settings);
}

function disableNode(id) {
  flows.checkTypeInUse(id);
  return registry_disableNode(id).then(function (info) {
    reportNodeStateChange(info, false);
    return info;
  });
}

function enableNode(id) {
  return enableNodeSet(id).then(function (info) {
    reportNodeStateChange(info, true);
    return info;
  });
}

function reportNodeStateChange(info, enabled) {
  if (info.enabled === enabled && !info.err) {
    events.emit('runtime-event', { id: 'node/' + (enabled ? 'enabled' : 'disabled'), retain: false, payload: info });
    log.info(' ' + log._('api.nodes.' + (enabled ? 'enabled' : 'disabled')));
    for (let i = 0; i < info.types.length; i++) {
      log.info(' - ' + info.types[i]);
    }
  } else if (enabled && info.err) {
    log.warn(log._('api.nodes.error-enable'));
    log.warn(' - ' + info.name + ' : ' + info.err);
  }
}

function installModule(module, version, url?) {
  return registry_installModule(module, version, url).then(function (info) {
    if (info.pending_version) {
      events.emit('runtime-event', { id: 'node/upgraded', retain: false, payload: { module: info.name, version: info.pending_version } });
    } else {
      events.emit('runtime-event', { id: 'node/added', retain: false, payload: info.nodes });
    }
    return info;
  });
}

function uninstallModule(module) {
  const info = getModuleInfo(module);
  if (!info || !info.user) {
    throw new Error(log._('nodes.index.unrecognised-module', { module }));
  } else {
    const nodeTypesToCheck = info.nodes.map((n) => `${module}/${n.name}`);
    for (let i = 0; i < nodeTypesToCheck.length; i++) {
      flows.checkTypeInUse(nodeTypesToCheck[i]);
    }
    return registry_uninstallModule(module).then(function (list) {
      events.emit('runtime-event', { id: 'node/removed', retain: false, payload: list });
      return list;
    });
  }
}

export default {
  // Lifecycle
  init,
  load,

  // Node registry
  createNode,
  getNode: flows.get,
  eachNode: flows.eachNode,
  getContext: context.get,

  clearContext: context.clear,

  installerEnabled,
  installModule,
  uninstallModule,

  enableNode,
  disableNode,

  // Node type registry
  registerType,
  registerSubflow,
  getType: get,

  getNodeInfo,
  getNodeList,

  getModuleInfo,

  getNodeConfigs,
  getNodeConfig,
  getNodeIconPath,
  getNodeIcons,
  getNodeExampleFlows,
  getNodeExampleFlowPath,
  getModuleResource,

  clearRegistry: clear,
  cleanModuleList,

  // Flow handling
  loadFlows: flows.load,
  startFlows: flows.startFlows,
  stopFlows: flows.stopFlows,
  setFlows: flows.setFlows,
  getFlows: flows.getFlows,

  addFlow: flows.addFlow,
  getFlow: flows.getFlow,
  updateFlow: flows.updateFlow,
  removeFlow: flows.removeFlow,
  // disableFlow: flows.disableFlow,
  // enableFlow:  flows.enableFlow,

  // Credentials
  addCredentials: credentials.add,
  getCredentials: credentials.get,
  deleteCredentials: credentials.delete,
  getCredentialDefinition: credentials.getDefinition,
  setCredentialSecret: credentials.setKey,
  clearCredentials: credentials.clear,
  exportCredentials: credentials.export,
  getCredentialKeyType: credentials.getKeyType,

  // Contexts
  loadContextsPlugin: context.load,
  closeContextsPlugin: context.close,
  listContextStores: context.listStores
};
