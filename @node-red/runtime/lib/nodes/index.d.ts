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
import { getModuleInfo, load, get, getNodeInfo, getNodeList, getNodeConfigs, getNodeConfig, getNodeIconPath, getNodeIcons, getNodeExampleFlows, getNodeExampleFlowPath, getModuleResource, clear, cleanModuleList } from '@node-red/registry';
/**
 * Registers a node constructor
 * @param nodeSet - the nodeSet providing the node (module/set)
 * @param type - the string type name
 * @param constructor - the constructor function for this node type
 * @param opts - optional additional options for the node
 */
declare function registerType(nodeSet: any, type: any, constructor: any, opts: any): void;
/**
 * Called from a Node's constructor function, invokes the super-class
 * constructor and attaches any credentials to the node.
 * @param node the node object being created
 * @param def the instance definition for the node
 */
declare function createNode(node: any, def: any): void;
declare function registerSubflow(nodeSet: any, subflow: any): void;
declare function init(runtime: any): void;
declare function disableNode(id: any): any;
declare function enableNode(id: any): any;
declare function installModule(module: any, version: any, url?: any): any;
declare function uninstallModule(module: any): Promise<unknown>;
declare const _default: {
    init: typeof init;
    load: typeof load;
    createNode: typeof createNode;
    getNode: (id: any) => any;
    eachNode: (cb: any) => void;
    getContext: (nodeId: any, flowId: any) => any;
    clearContext: () => Promise<any>;
    installerEnabled: () => boolean;
    installModule: typeof installModule;
    uninstallModule: typeof uninstallModule;
    enableNode: typeof enableNode;
    disableNode: typeof disableNode;
    registerType: typeof registerType;
    registerSubflow: typeof registerSubflow;
    getType: typeof get;
    getNodeInfo: typeof getNodeInfo;
    getNodeList: typeof getNodeList;
    getModuleInfo: typeof getModuleInfo;
    getNodeConfigs: typeof getNodeConfigs;
    getNodeConfig: typeof getNodeConfig;
    getNodeIconPath: typeof getNodeIconPath;
    getNodeIcons: typeof getNodeIcons;
    getNodeExampleFlows: typeof getNodeExampleFlows;
    getNodeExampleFlowPath: typeof getNodeExampleFlowPath;
    getModuleResource: typeof getModuleResource;
    clearRegistry: typeof clear;
    cleanModuleList: typeof cleanModuleList;
    loadFlows: (forceStart?: boolean) => any;
    startFlows: (type?: any, diff?: any, muteLog?: any, isDeploy?: any) => Promise<void>;
    stopFlows: (type?: any, diff?: any, muteLog?: any, isDeploy?: any) => Promise<void>;
    setFlows: (_config: any, _credentials: any, type: any, muteLog: any, forceStart: any, user?: any) => any;
    getFlows: () => any;
    addFlow: (flow: any, user: any) => any;
    getFlow: (id: any) => any;
    updateFlow: (id: any, newFlow: any, user: any) => any;
    removeFlow: (id: any, user: any) => any;
    addCredentials: (id: any, creds: any) => void;
    getCredentials: (id: any) => any;
    deleteCredentials: (id: any) => void;
    getCredentialDefinition: (type: any) => any;
    setCredentialSecret: (key: any) => void;
    clearCredentials: () => void;
    exportCredentials: () => any;
    getCredentialKeyType: () => any;
    loadContextsPlugin: () => Promise<unknown>;
    closeContextsPlugin: () => Promise<any[]>;
    listContextStores: () => {
        default: any;
        stores: any[];
    };
};
export default _default;
