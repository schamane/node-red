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
declare const api: {
    init(_runtime: any): void;
    /**
     * Gets the current flow configuration
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Flows>} - the active flow configuration
     * @memberof @node-red/runtime_flows
     */
    getFlows(opts: any): any;
    /**
     * Sets the current flow configuration
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.flows - the flow configuration: `{flows: [..], credentials: {}}`
     * @param {Object} opts.deploymentType - the type of deployment - "full", "nodes", "flows", "reload"
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Flows>} - the active flow configuration
     * @memberof @node-red/runtime_flows
     */
    setFlows(opts: any): Promise<any>;
    /**
     * Adds a flow configuration
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.flow - the flow to add
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<String>} - the id of the added flow
     * @memberof @node-red/runtime_flows
     */
    addFlow(opts: any): Promise<any>;
    /**
     * Gets an individual flow configuration
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.id - the id of the flow to retrieve
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Flow>} - the active flow configuration
     * @memberof @node-red/runtime_flows
     */
    getFlow(opts: any): any;
    /**
     * Updates an existing flow configuration
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.id - the id of the flow to update
     * @param {Object} opts.flow - the flow configuration
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<String>} - the id of the updated flow
     * @memberof @node-red/runtime_flows
     */
    updateFlow(opts: any): Promise<any>;
    /**
     * Deletes a flow
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.id - the id of the flow to delete
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise} - resolves if successful
     * @memberof @node-red/runtime_flows
     */
    deleteFlow(opts: any): Promise<any>;
    /**
     * Gets the safe credentials for a node
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.type - the node type to return the credential information for
     * @param {String} opts.id - the node id
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - the safe credentials
     * @memberof @node-red/runtime_flows
     */
    getNodeCredentials(opts: any): {};
    /**
     * Gets running state of runtime flows
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.req - the request to log (optional)
     * @return {{state:string, started:boolean}} - the current run state of the flows
     * @memberof @node-red/runtime_flows
     */
    getState(opts: any): {
        state: any;
    };
    /**
     * Sets running state of runtime flows
     * @param {Object} opts
     * @param {Object} opts.req - the request to log (optional)
     * @param {User} opts.user - the user calling the api
     * @param {string} opts.state - the requested state. Valid values are "start" and "stop".
     * @return {Promise<Flow>} - the active flow configuration
     * @memberof @node-red/runtime_flows
     */
    setState(opts: any): Promise<{
        state: any;
    }>;
};
export default api;
