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
declare function init(runtime: any): void;
declare function load(forceStart?: boolean): any;
declare function setFlows(_config: any, _credentials: any, type: any, muteLog: any, forceStart: any, user?: any): any;
declare function getNode(id: any): any;
declare function eachNode(cb: any): void;
declare function getFlows(): any;
declare function start(type?: any, diff?: any, muteLog?: any, isDeploy?: any): Promise<void>;
declare function stop(type?: any, diff?: any, muteLog?: any, isDeploy?: any): Promise<void>;
declare function checkTypeInUse(id: any): void;
declare function addFlow(flow: any, user: any): any;
declare function getFlow(id: any): any;
declare function updateFlow(id: any, newFlow: any, user: any): any;
declare function removeFlow(id: any, user: any): any;
declare const _default: {
    init: typeof init;
    /**
     * Load the current flow configuration from storage
     * @return a promise for the loading of the config
     */
    load: typeof load;
    loadFlows: typeof load;
    get: typeof getNode;
    eachNode: typeof eachNode;
    /**
     * Gets the current flow configuration
     */
    getFlows: typeof getFlows;
    /**
     * Sets the current active config.
     * @param config the configuration to enable
     * @param type the type of deployment to do: full (default), nodes, flows, load
     * @return a promise for the saving/starting of the new flow
     */
    setFlows: typeof setFlows;
    /**
     * Starts the current flow configuration
     */
    startFlows: typeof start;
    /**
     * Stops the current flow configuration
     * @return a promise for the stopping of the flow
     */
    stopFlows: typeof stop;
    readonly started: boolean;
    state: () => string;
    checkTypeInUse: typeof checkTypeInUse;
    addFlow: typeof addFlow;
    getFlow: typeof getFlow;
    updateFlow: typeof updateFlow;
    removeFlow: typeof removeFlow;
    disableFlow: any;
    enableFlow: any;
    isDeliveryModeAsync(): boolean;
};
export default _default;
