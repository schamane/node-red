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
export declare function init(runtime: any): void;
/**
 * This class represents a flow within the runtime. It is responsible for
 * creating, starting and stopping all nodes within the flow.
 */
export declare class Flow {
    TYPE: string;
    parent: any;
    global: any;
    flow: any;
    isGlobalFlow: boolean;
    id: string;
    activeNodes: any;
    subflowInstanceNodes: any;
    catchNodes: any[];
    statusNodes: any[];
    path: string;
    context: any;
    completeNodeMap: any;
    /**
     * Create a Flow object.
     * @param {[type]} parent     The parent flow
     * @param {[type]} globalFlow The global flow definition
     * @param {[type]} flow       This flow's definition
     */
    constructor(parent: any, globalFlow: any, flow?: any);
    /**
     * Log a debug-level message from this flow
     * @param  {[type]} msg [description]
     * @return {[type]}     [description]
     */
    debug(msg: any): void;
    /**
     * Log an error-level message from this flow
     * @param  {[type]} msg [description]
     * @return {[type]}     [description]
     */
    error(msg: any): void;
    /**
     * Log a info-level message from this flow
     * @param  {[type]} msg [description]
     * @return {[type]}     [description]
     */
    info(msg: any): void;
    /**
     * Log a trace-level message from this flow
     * @param  {[type]} msg [description]
     * @return {[type]}     [description]
     */
    trace(msg: any): void;
    /**
     * [log description]
     * @param  {[type]} msg [description]
     * @return {[type]}     [description]
     */
    log(msg: any): void;
    /**
     * Start this flow.
     * The `diff` argument helps define what needs to be started in the case
     * of a modified-nodes/flows type deploy.
     * @param  {[type]} msg [description]
     * @return {[type]}     [description]
     */
    start(diff: any): void;
    /**
     * Stop this flow.
     * The `stopList` argument helps define what needs to be stopped in the case
     * of a modified-nodes/flows type deploy.
     * @param  {[type]} stopList    [description]
     * @param  {[type]} removedList [description]
     * @return {[type]}             [description]
     */
    stop(stopList: any, removedList: any): Promise<any[]>;
    /**
     * Update the flow definition. This doesn't change anything that is running.
     * This should be called after `stop` and before `start`.
     * @param  {[type]} _global [description]
     * @param  {[type]} _flow   [description]
     * @return {[type]}         [description]
     */
    update(_global: any, _flow: any): void;
    /**
     * Get a node instance from this flow. If the node is not known to this
     * flow, pass the request up to the parent.
     * @param  {String} id [description]
     * @param  {Boolean} cancelBubble    if true, prevents the flow from passing the request to the parent
     *                                   This stops infinite loops when the parent asked this Flow for the
     *                                   node to begin with.
     * @return {[type]}    [description]
     */
    getNode(id: any, cancelBubble: any): any;
    /**
     * Get a group node instance
     * @param  {String} id
     * @return {Node}   group node
     */
    getGroupNode(id: any): any;
    /**
     * Get all of the nodes instantiated within this flow
     * @return {[type]} [description]
     */
    getActiveNodes(): any;
    getGroupEnvSetting(node: any, group: any, name: any): any;
    /**
     * Get a flow setting value. This currently automatically defers to the parent
     * flow which, as defined in ./index.js returns `process.env[key]`.
     * This lays the groundwork for Subflow to have instance-specific settings
     * @param  {[type]} key [description]
     * @return {[type]}     [description]
     */
    getSetting(key: any): any;
    /**
     * Handle a status event from a node within this flow.
     * @param  {Node}    node            The original node that triggered the event
     * @param  {Object}  statusMessage   The status object
     * @param  {Node}    reportingNode   The node emitting the status event.
     *                                   This could be a subflow instance node when the status
     *                                   is being delegated up.
     * @param  {boolean} muteStatusEvent Whether to emit the status event
     * @return {[type]}                  [description]
     */
    handleStatus(node: any, statusMessage: any, reportingNode: any, muteStatusEvent: any): boolean;
    /**
     * Handle an error event from a node within this flow. If there are no Catch
     * nodes within this flow, pass the event to the parent flow.
     * @param  {[type]} node          [description]
     * @param  {[type]} logMessage    [description]
     * @param  {[type]} msg           [description]
     * @param  {[type]} reportingNode [description]
     * @return {[type]}               [description]
     */
    handleError(node: any, logMessage: any, msg: any, reportingNode: any): boolean;
    handleComplete(node: any, msg: any): void;
    send(sendEvents: any): void;
    dump(): void;
}
