/* eslint-disable import/no-namespace */
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
/**
 * This module provides the node registry for the Node-RED runtime.
 *
 * It is responsible for loading node modules and making them available
 * to the runtime.
 *
 * @namespace @node-red/registry
 */

import {
  init as registryInit,
  load as registryLoad,
  getFullNodeInfo,
  getModuleInfo,
  getNodeInfo,
  enableNodeSet as registryEnableNodeSet
} from './registry';
import * as loader from './loader';
import { init as installerInit, checkPrereq } from './installer';
import { init as libraryInit } from './library';
import { init as externalModulesInit } from './externalModules';
import { init as pluginsInit } from './plugins';

export * as get1 from './deprecated';

/**
 * Initialise the registry with a reference to a runtime object
 * @param  {Object} runtime - a runtime object
 * @memberof @node-red/registry
 */
export function init(runtime) {
  installerInit(runtime.settings);
  // Loader requires the full runtime object because it initialises
  // the util module it. The Util module is responsible for constructing the
  // RED object passed to node modules when they are loaded.
  loader.init(runtime);
  pluginsInit(runtime.settings);
  registryInit(runtime.settings, loader);
  libraryInit();
  externalModulesInit(runtime.settings);
}

/**
 * Triggers the intial discovery and loading of all Node-RED node modules.
 * found on the node path.
 * @return {Promise} - resolves when the registry has finised discovering node modules.
 * @memberof @node-red/registry
 */
export function load() {
  registryLoad();
  return checkPrereq().then(loader.load);
}

/**
 * Loads a new module into the registry.
 *
 * This will rescan the node module paths looking for this module.
 *
 * @param {String} module - the name of the module to add
 * @return {Promise<Object>} A promise that resolves with the module information once it has been added
 * @throws if the module has already been added or the runtime settings are unavailable
 * @function
 * @memberof @node-red/registry
 */
export function addModule(module) {
  return loader.addModule(module).then(function () {
    return getModuleInfo(module);
  });
}

/**
 * Enables a node set, making it available for use.
 *
 * @param {String} type - the node type or set identifier
 * @return {Promise} A promise that resolves when the node set has been enabled
 * @throws if the identifier is not recognised or runtime settings are unavailable
 * @function
 * @memberof @node-red/registry
 */
export function enableNodeSet(typeOrId) {
  return registryEnableNodeSet(typeOrId).then(function () {
    const nodeSet = getNodeInfo(typeOrId);
    if (!nodeSet.loaded) {
      return loader.loadNodeSet(getFullNodeInfo(typeOrId)).then(function () {
        return getNodeInfo(typeOrId);
      });
    }
    return Promise.resolve(nodeSet);
  });
}

export {
  clear,
  registerSubflow,
  getNodeInfo,
  getNodeList,
  getModuleInfo,
  getModuleList,
  getNodeConfig,
  getNodeIconPath,
  getNodeIcons,
  removeModule,
  cleanModuleList,
  getModuleResource,
  registerNodeConstructor as registerType,
  getNodeConstructor as get,
  getAllNodeConfigs as getNodeConfigs,
  disableNodeSet as disableNode
} from './registry';
export * as registry from './registry';
export { installerEnabled, installModule, uninstallModule } from './installer';
export * as installer from './installer';
export { getExampleFlows as getNodeExampleFlows, getExampleFlowPath as getNodeExampleFlowPath } from './library';
export { checkFlowDependencies } from './externalModules';
export { registerPlugin, getPlugin, getPluginsByType, getPluginList, getPluginConfigs, exportPluginSettings } from './plugins';
export * as plugins from './plugins';

export * as deprecated from './deprecated';
