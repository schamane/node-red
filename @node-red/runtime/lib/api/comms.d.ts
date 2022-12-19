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
     * Registers a new comms connection
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {CommsConnection} opts.client - the client connection
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_comms
     */
    addConnection(opts: any): void;
    /**
     * Unregisters a comms connection
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {CommsConnection} opts.client - the client connection
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_comms
     */
    removeConnection(opts: any): void;
    /**
     * Subscribes a comms connection to a given topic. Currently, all clients get
     * automatically subscribed to everything and cannot unsubscribe. Sending a subscribe
     * request will trigger retained messages to be sent.
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {CommsConnection} opts.client - the client connection
     * @param {String} opts.topic - the topic to subscribe to
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_comms
     */
    subscribe(opts: any): void;
    /**
     * TODO: Unsubscribes a comms connection from a given topic
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {CommsConnection} opts.client - the client connection
     * @param {String} opts.topic - the topic to unsubscribe from
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_comms
     */
    unsubscribe(opts: any): Promise<void>;
};
export default api;
