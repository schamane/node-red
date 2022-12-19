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
import { Flow } from './flow.js';
/**
 * This class represents a subflow - which is handled as a special type of Flow
 */
export declare class Subflow extends Flow {
    subflowDef: any;
    subflowInstance: any;
    node_map: any;
    templateCredentials: any;
    instanceCredentials: any;
    env: any;
    _context: any;
    _alias: any;
    z: any;
    statusNode: any;
    node: any;
    /**
     * Create a Subflow object.
     * This takes a subflow definition and instance node, creates a clone of the
     * definition with unique ids applied and passes to the super class.
     * @param {[type]} parent          [description]
     * @param {[type]} globalFlow      [description]
     * @param {[type]} subflowDef      [description]
     * @param {[type]} subflowInstance [description]
     */
    constructor(parent: any, globalFlow: any, subflowDef: any, subflowInstance: any);
    /**
     * Start the subflow.
     * This creates a subflow instance node to handle the inbound messages. It also
     * rewires an subflow internal node that is connected to an output so it is connected
     * to the parent flow nodes the subflow instance is wired to.
     * @param  {[type]} diff [description]
     * @return {[type]}      [description]
     */
    start(diff?: any): void;
    /**
     * Stop this subflow.
     * The `stopList` argument helps define what needs to be stopped in the case
     * of a modified-nodes/flows type deploy.
     * @param  {[type]} stopList    [description]
     * @param  {[type]} removedList [description]
     * @return {[type]}             [description]
     */
    stop(stopList?: any, removedList?: any): Promise<any[]>;
    /**
     * Get environment variable of subflow
     * @param {String}   name   name of env var
     * @return {Object}  val    value of env var
     */
    getSetting(name: any): any;
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
    getNode(id: any, cancelBubble: any): any;
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
    handleStatus(node: any, statusMessage: any, reportingNode: any, muteStatus: any): boolean;
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
}
declare class SubflowModule extends Subflow {
    subflowType: string;
    /**
     * Create a Subflow Module object.
     * This is a node that has been published as a subflow.
     * @param {[type]} parent          [description]
     * @param {[type]} globalFlow      [description]
     * @param {[type]} subflowDef      [description]
     * @param {[type]} subflowInstance [description]
     */
    constructor(type: any, parent: any, globalFlow: any, subflowDef: any, subflowInstance: any);
    /**
     * [log description]
     * @param  {[type]} msg [description]
     * @return {[type]}     [description]
     */
    log(msg: any): void;
}
export declare function createSubflow(parent: any, globalFlow: any, subflowDef: any, subflowInstance: any): Subflow;
export declare function createModuleInstance(type: any, parent: any, globalFlow: any, subflowDef: any, subflowInstance: any): SubflowModule;
export {};
