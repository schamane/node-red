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
declare function init(_settings: any): void;
declare function load(): Promise<unknown>;
/**
 * Get a flow-level context object.
 * @param  {string} flowId       [description]
 * @param  {string} parentFlowId the id of the parent flow. undefined
 * @return {object}}             the context object
 */
declare function getFlowContext(flowId: any, parentFlowId: any): any;
declare function getContext(nodeId: any, flowId: any): any;
/**
 * Delete the context of the given node/flow/global
 *
 * If the user has configured a context store, this
 * will no-op a request to delete node/flow context.
 */
declare function deleteContext(id: any, flowId?: any): any;
/**
 * Delete any contexts that are no longer in use
 * @param flowConfig object includes allNodes as object of id->node
 *
 * If flowConfig is undefined, all flow/node contexts will be removed
 **/
declare function clean(flowConfig?: any): Promise<any[]>;
/**
 * Deletes all contexts, including global and reinitialises global to
 * initial state.
 */
declare function clear(): Promise<any>;
declare function close(): Promise<any[]>;
declare function listStores(): {
    default: any;
    stores: any[];
};
declare const _default: {
    init: typeof init;
    load: typeof load;
    listStores: typeof listStores;
    get: typeof getContext;
    getFlowContext: typeof getFlowContext;
    delete: typeof deleteContext;
    clean: typeof clean;
    clear: typeof clear;
    close: typeof close;
};
export default _default;
