/* eslint-disable no-loop-func */
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

import path from 'node:path';
import fs from 'node:fs';
import { addExamplesDir } from './library';
import { events, CustomErrorWithCode } from '@node-red/util';
import { register } from './subflow';
import { register as externalModulesRegister, registerSubflow as externalModulesRegisterSubflow } from './externalModules';

const iconPaths = {};
const iconCache = {};

let settings;
let loader;

let nodeConfigCache = {};
let moduleConfigs = {};
let nodeList = [];
let nodeConstructors = {};
let nodeOptions = {};
let subflowModules = {};

let nodeTypeToId = {};
const moduleNodes = {};

export function init(_settings, _loader) {
  settings = _settings;
  loader = _loader;
  clear();
}

export function load() {
  if (settings.available()) {
    moduleConfigs = loadNodeConfigs();
  } else {
    moduleConfigs = {};
  }
}

export function filterNodeInfo(n) {
  const r: Record<string, unknown> = {
    id: n.id || n.module + '/' + n.name,
    name: n.name,
    types: n.types,
    enabled: n.enabled,
    local: n.local || false,
    user: n.user || false
  };
  if (n.hasOwnProperty('module')) {
    r.module = n.module;
  }
  if (n.hasOwnProperty('err')) {
    r.err = n.err;
  }
  if (n.hasOwnProperty('plugins')) {
    r.plugins = n.plugins;
  }
  if (n.type === 'plugin') {
    r.editor = !!n.template;
    r.runtime = !!n.file;
  }
  return r;
}

export function getModuleFromSetId(id) {
  const parts = id.split('/');
  return parts.slice(0, parts.length - 1).join('/');
}

export function getNodeFromSetId(id) {
  const parts = id.split('/');
  return parts[parts.length - 1];
}

export function saveNodeList() {
  const moduleList = {};
  let hadPending = false;
  let hasPending = false;
  for (const module in moduleConfigs) {
    /* istanbul ignore else */
    if (moduleConfigs.hasOwnProperty(module)) {
      if (Object.keys(moduleConfigs[module].nodes).length > 0) {
        if (!moduleList[module]) {
          moduleList[module] = {
            name: module,
            version: moduleConfigs[module].version,
            local: moduleConfigs[module].local || false,
            user: moduleConfigs[module].user || false,
            nodes: {}
          };
          if (moduleConfigs[module].hasOwnProperty('pending_version')) {
            hadPending = true;
            if (moduleConfigs[module].pending_version !== moduleConfigs[module].version) {
              moduleList[module].pending_version = moduleConfigs[module].pending_version;
              hasPending = true;
            } else {
              delete moduleConfigs[module].pending_version;
            }
          }
        }
        const nodes = moduleConfigs[module].nodes;
        for (const node in nodes) {
          /* istanbul ignore else */
          if (nodes.hasOwnProperty(node)) {
            const config = nodes[node];
            const n = filterNodeInfo(config);
            delete n.err;
            delete n.file;
            delete n.id;
            n.file = config.file;
            moduleList[module].nodes[node] = n;
          }
        }
      }
    }
  }
  if (hadPending && !hasPending) {
    events.emit('runtime-event', { id: 'restart-required', retain: true });
  }
  if (settings.available()) {
    return settings.set('nodes', moduleList);
  }
  return Promise.reject('Settings unavailable');
}

function loadNodeConfigs() {
  const configs = settings.get('nodes');

  if (!configs) {
    return {};
  } else if (configs['node-red']) {
    return configs;
  }
  // Migrate from the 0.9.1 format of settings
  const newConfigs = {};
  for (const id in configs) {
    /* istanbul ignore else */
    if (configs.hasOwnProperty(id)) {
      const nodeConfig = configs[id];
      let moduleName;
      let nodeSetName;

      if (nodeConfig.module) {
        moduleName = nodeConfig.module;
        nodeSetName = nodeConfig.name.split(':')[1];
      } else {
        moduleName = 'node-red';
        nodeSetName = nodeConfig.name.replace(/^\d+-/, '').replace(/\.js$/, '');
      }

      if (!newConfigs[moduleName]) {
        newConfigs[moduleName] = {
          name: moduleName,
          nodes: {}
        };
      }
      newConfigs[moduleName].nodes[nodeSetName] = {
        name: nodeSetName,
        types: nodeConfig.types,
        enabled: nodeConfig.enabled,
        module: moduleName
      };
    }
  }
  settings.set('nodes', newConfigs);
  return newConfigs;
}

export function addModule(module) {
  moduleNodes[module.name] = [];
  moduleConfigs[module.name] = module;
  for (const setName in module.nodes) {
    if (module.nodes.hasOwnProperty(setName)) {
      const set = module.nodes[setName];
      moduleNodes[module.name].push(set.name);
      nodeList.push(set.id);
      if (!set.err) {
        set.types.forEach(function (t) {
          if (nodeTypeToId.hasOwnProperty(t)) {
            set.err = new CustomErrorWithCode('Type already registered');
            set.err.code = 'type_already_registered';
            set.err.details = {
              type: t,
              moduleA: getNodeInfo(t).module,
              moduleB: set.module
            };
          }
        });
        if (!set.err) {
          set.types.forEach(function (t) {
            nodeTypeToId[t] = set.id;
          });
        }
      }
    }
  }
  if (module.icons) {
    iconPaths[module.name] = iconPaths[module.name] || [];
    module.icons.forEach((icon) => iconPaths[module.name].push(path.resolve(icon.path)));
  }
  if (module.examples) {
    addExamplesDir(module.name, module.examples.path);
  }
  nodeConfigCache = {};
}
function removeNode(id) {
  const config = moduleConfigs[getModuleFromSetId(id)].nodes[getNodeFromSetId(id)];
  if (!config) {
    throw new CustomErrorWithCode('Unrecognised id: ' + id);
  }
  delete moduleConfigs[getModuleFromSetId(id)].nodes[getNodeFromSetId(id)];
  const i = nodeList.indexOf(id);
  if (i > -1) {
    nodeList.splice(i, 1);
  }
  config.types.forEach(function (t) {
    const typeId = nodeTypeToId[t];
    if (typeId === id) {
      delete subflowModules[t];
      delete nodeConstructors[t];
      delete nodeOptions[t];
      delete nodeTypeToId[t];
    }
  });
  config.enabled = false;
  config.loaded = false;
  nodeConfigCache = {};
  return filterNodeInfo(config);
}

export function removeModule(name, skipSave?) {
  if (!settings.available()) {
    throw new CustomErrorWithCode('Settings unavailable');
  }
  const infoList = [];
  const module = moduleConfigs[name];
  const nodes = moduleNodes[name];
  if (!nodes) {
    throw new CustomErrorWithCode('Unrecognised module: ' + name);
  }
  if (module.usedBy && module.usedBy > 0) {
    // We are removing a module that is used by other modules... so whilst
    // this module should be removed from the editor palette, it needs to
    // stay in the runtime... for now.
    module.user = false;
    for (let i = 0; i < nodes.length; i++) {
      infoList.push(filterNodeInfo(nodes[i]));
    }
  } else {
    if (module.dependencies) {
      module.dependencies.forEach(function (dep) {
        // Check each dependency of this module to see if it is a non-user-installed
        // module that we can expect to disappear once npm uninstall is run
        if (!moduleConfigs[dep].user) {
          moduleConfigs[dep].usedBy = moduleConfigs[dep].usedBy.filter((m) => m !== name);
          if (moduleConfigs[dep].usedBy.length === 0) {
            // Remove the dependency
            removeModule(dep, true);
          }
        }
      });
    }
    for (let i = 0; i < nodes.length; i++) {
      infoList.push(removeNode(name + '/' + nodes[i]));
    }
    delete moduleNodes[name];
    delete moduleConfigs[name];
  }
  if (!skipSave) {
    saveNodeList();
  }
  return infoList;
}

export function getNodeInfo(typeOrId) {
  let id = typeOrId;
  if (nodeTypeToId.hasOwnProperty(typeOrId)) {
    id = nodeTypeToId[typeOrId];
  }
  /* istanbul ignore else */
  if (id) {
    const module = moduleConfigs[getModuleFromSetId(id)];
    if (module) {
      const config = module.nodes[getNodeFromSetId(id)];
      if (config) {
        const info = filterNodeInfo(config);
        if (config.hasOwnProperty('loaded')) {
          info.loaded = config.loaded;
        }
        if (module.pending_version) {
          info.pending_version = module.pending_version;
        }

        info.version = module.version;
        return info;
      }
    }
  }
  return null;
}

export function getFullNodeInfo(typeOrId) {
  // Used by index.enableNodeSet so that .file can be retrieved to pass
  // to loader.loadNodeSet
  let id = typeOrId;
  if (nodeTypeToId.hasOwnProperty(typeOrId)) {
    id = nodeTypeToId[typeOrId];
  }
  /* istanbul ignore else */
  if (id) {
    const module = moduleConfigs[getModuleFromSetId(id)];
    if (module) {
      return module.nodes[getNodeFromSetId(id)];
    }
  }
  return null;
}

export function getNodeList(filter) {
  const list = [];
  for (const module in moduleConfigs) {
    /* istanbul ignore else */
    if (moduleConfigs.hasOwnProperty(module)) {
      if (!moduleConfigs[module].user && moduleConfigs[module].usedBy && moduleConfigs[module].usedBy.length > 0) {
        continue;
      }
      const nodes = moduleConfigs[module].nodes;
      for (const node in nodes) {
        /* istanbul ignore else */
        if (nodes.hasOwnProperty(node)) {
          const nodeInfo = filterNodeInfo(nodes[node]);
          nodeInfo.version = moduleConfigs[module].version;
          if (moduleConfigs[module].pending_version) {
            nodeInfo.pending_version = moduleConfigs[module].pending_version;
          }
          if (!filter || filter(nodes[node])) {
            list.push(nodeInfo);
          }
        }
      }
    }
  }
  return list;
}

export const getModuleList = () => moduleConfigs;

export const getModule = (id) => moduleConfigs[id];

export function getModuleInfo(module) {
  if (moduleNodes[module]) {
    const nodes = moduleNodes[module];
    const m: Record<string, any> = {
      name: module,
      version: moduleConfigs[module].version,
      local: moduleConfigs[module].local,
      user: moduleConfigs[module].user,
      path: moduleConfigs[module].path,
      nodes: []
    };
    if (moduleConfigs[module].dependencies) {
      m.dependencies = moduleConfigs[module].dependencies;
    }
    if (moduleConfigs[module] && moduleConfigs[module].pending_version) {
      m.pending_version = moduleConfigs[module].pending_version;
    }
    for (let i = 0; i < nodes.length; ++i) {
      const nodeInfo = filterNodeInfo(moduleConfigs[module].nodes[nodes[i]]);
      nodeInfo.version = m.version;
      m.nodes.push(nodeInfo);
    }
    return m;
  }
  return null;
}

export function registerNodeConstructor(nodeSet, type, constructor, options) {
  if (nodeConstructors.hasOwnProperty(type)) {
    throw new Error(type + ' already registered');
  }
  // TODO: Ensure type is known - but doing so will break some tests
  //      that don't have a way to register a node template ahead
  //      of registering the constructor

  const nodeSetInfo = getFullNodeInfo(nodeSet);
  if (nodeSetInfo) {
    if (nodeSetInfo.types.indexOf(type) === -1) {
      // A type is being registered for a known set, but for some reason
      // we didn't spot it when parsing the HTML file.
      // Registered a type is the definitive action - not the presence
      // of an edit template. Ensure it is on the list of known types.
      nodeSetInfo.types.push(type);
    }
  }

  nodeConstructors[type] = constructor;
  nodeOptions[type] = options;
  if (options) {
    if (options.dynamicModuleList) {
      externalModulesRegister(type, options.dynamicModuleList);
    }
  }
  events.emit('type-registered', type);
}

export function registerSubflow(nodeSet, subflow) {
  const nodeSetInfo = getFullNodeInfo(nodeSet);

  const result = register(nodeSet, subflow);

  if (subflowModules.hasOwnProperty(result.type)) {
    throw new Error(result.type + ' already registered');
  }

  if (nodeSetInfo) {
    if (nodeSetInfo.types.indexOf(result.type) === -1) {
      nodeSetInfo.types.push(result.type);
      nodeTypeToId[result.type] = nodeSetInfo.id;
    }
    nodeSetInfo.config = result.config;
  }
  subflowModules[result.type] = result;
  externalModulesRegisterSubflow(result.type, subflow);
  events.emit('type-registered', result.type);
  return result;
}

export function getAllNodeConfigs(lang) {
  if (!nodeConfigCache[lang]) {
    let result = '';
    for (let i = 0; i < nodeList.length; i++) {
      const id = nodeList[i];
      const module = moduleConfigs[getModuleFromSetId(id)];
      if (!module.user && module.usedBy && module.usedBy.length > 0) {
        continue;
      }
      const config = module.nodes[getNodeFromSetId(id)];
      if (config.enabled && !config.err) {
        result += '\n<!-- --- [red-module:' + id + '] --- -->\n';
        result += config.config;
        result += loader.getNodeHelp(config, lang || 'en-US') || '';
      }
    }
    nodeConfigCache[lang] = result;
  }
  return nodeConfigCache[lang];
}

export function getNodeConfig(id, lang) {
  let config = moduleConfigs[getModuleFromSetId(id)];
  if (!config) {
    return null;
  }
  config = config.nodes[getNodeFromSetId(id)];
  if (config) {
    let result = '<!-- --- [red-module:' + id + '] --- -->\n' + config.config;
    result += loader.getNodeHelp(config, lang || 'en-US');

    // if (config.script) {
    //    result += '<script type="text/javascript">'+config.script+'</script>';
    // }
    return result;
  }
  return null;
}

export function getNodeConstructor(type) {
  const id = nodeTypeToId[type];

  let config;
  if (typeof id === 'undefined') {
    config = undefined;
  } else {
    config = moduleConfigs[getModuleFromSetId(id)].nodes[getNodeFromSetId(id)];
  }

  if (!config || (config.enabled && !config.err)) {
    return nodeConstructors[type] || subflowModules[type];
  }
  return null;
}

export function clear() {
  nodeConfigCache = {};
  moduleConfigs = {};
  nodeList = [];
  nodeConstructors = {};
  nodeOptions = {};
  subflowModules = {};
  nodeTypeToId = {};
}

export function getTypeId(type) {
  if (nodeTypeToId.hasOwnProperty(type)) {
    return nodeTypeToId[type];
  }
  return null;
}

export function enableNodeSet(typeOrId) {
  if (!settings.available()) {
    throw new Error('Settings unavailable');
  }

  let id = typeOrId;
  if (nodeTypeToId.hasOwnProperty(typeOrId)) {
    id = nodeTypeToId[typeOrId];
  }
  let config;
  try {
    config = moduleConfigs[getModuleFromSetId(id)].nodes[getNodeFromSetId(id)];
    delete config.err;
    config.enabled = true;
    nodeConfigCache = {};
    settings.enableNodeSettings(config.types);
    return saveNodeList().then(function () {
      return filterNodeInfo(config);
    });
  } catch (err) {
    throw new Error('Unrecognised id: ' + typeOrId);
  }
}

export function disableNodeSet(typeOrId) {
  if (!settings.available()) {
    throw new Error('Settings unavailable');
  }
  let id = typeOrId;
  if (nodeTypeToId.hasOwnProperty(typeOrId)) {
    id = nodeTypeToId[typeOrId];
  }
  let config;
  try {
    config = moduleConfigs[getModuleFromSetId(id)].nodes[getNodeFromSetId(id)];
    // TODO: persist setting
    config.enabled = false;
    nodeConfigCache = {};
    settings.disableNodeSettings(config.types);
    return saveNodeList().then(function () {
      return filterNodeInfo(config);
    });
  } catch (err) {
    throw new Error('Unrecognised id: ' + id);
  }
}

export function cleanModuleList() {
  let removed = false;
  for (const mod in moduleConfigs) {
    /* istanbul ignore else */
    if (moduleConfigs.hasOwnProperty(mod)) {
      const nodes = moduleConfigs[mod].nodes;
      let node;
      if (mod === 'node-red') {
        // For core nodes, look for nodes that are enabled, !loaded and !errored
        for (node in nodes) {
          /* istanbul ignore else */
          if (nodes.hasOwnProperty(node)) {
            const n = nodes[node];
            if (n.enabled && !n.err && !n.loaded) {
              removeNode(mod + '/' + node);
              removed = true;
            }
          }
        }
      } else if (moduleConfigs[mod] && !moduleNodes[mod]) {
        // For node modules, look for missing ones
        for (node in nodes) {
          /* istanbul ignore else */
          if (nodes.hasOwnProperty(node)) {
            removeNode(mod + '/' + node);
            removed = true;
          }
        }
        delete moduleConfigs[mod];
      }
    }
  }
  if (removed) {
    saveNodeList();
  }
}
export function setModulePendingUpdated(module, version) {
  moduleConfigs[module].pending_version = version;
  return saveNodeList().then(function () {
    return getModuleInfo(module);
  });
}

export function setUserInstalled(module, userInstalled) {
  moduleConfigs[module].user = userInstalled;
  return saveNodeList().then(function () {
    return getModuleInfo(module);
  });
}
export function addModuleDependency(module, usedBy) {
  moduleConfigs[module].usedBy = moduleConfigs[module].usedBy || [];
  moduleConfigs[module].usedBy.push(usedBy);
}

export function getNodeIconPath(module, icon) {
  if (/\.\./.test(icon)) {
    throw new Error();
  }
  const iconName = module + '/' + icon;
  if (iconCache[iconName]) {
    return iconCache[iconName];
  }
  const paths = iconPaths[module];
  if (paths) {
    for (let p = 0; p < paths.length; p++) {
      const iconPath = path.join(paths[p], icon);
      try {
        fs.statSync(iconPath);
        iconCache[iconName] = iconPath;
        return iconPath;
      } catch (err) {
        // iconPath doesn't exist
      }
    }
  }
  if (module !== 'node-red') {
    return getNodeIconPath('node-red', icon);
  }
  return null;
}

export function getNodeIcons() {
  const iconList = {};
  for (const module in moduleConfigs) {
    if (moduleConfigs.hasOwnProperty(module)) {
      if (moduleConfigs[module].icons) {
        iconList[module] = [];
        moduleConfigs[module].icons.forEach((icon) => {
          iconList[module] = iconList[module].concat(icon.icons);
        });
      }
    }
  }
  return iconList;
}

export function getModuleResource(module, resourcePath) {
  const mod = moduleConfigs[module];
  if (mod && mod.resources) {
    const basePath = mod.resources.path;
    const fullPath = path.join(basePath, resourcePath);
    if (/^\.\./.test(path.relative(basePath, fullPath))) {
      return null;
    }
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}
