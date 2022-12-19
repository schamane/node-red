"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This is the comms subsystem of the runtime.
 * @mixin @node-red/runtime_comms
 */
/**
 * A WebSocket connection between the runtime and the editor.
 * @typedef CommsConnection
 * @type {object}
 * @property {string} session - a unique session identifier
 * @property {Object} user - the user associated with the connection
 * @property {Function} send - publish a message to the connection
 */
const util_1 = require("@node-red/util");
let runtime;
let retained = {};
let connections = [];
function handleCommsEvent(event) {
    publish(event.topic, event.data, event.retain);
}
function handleStatusEvent(event) {
    if (!event.status) {
        delete retained['status/' + event.id];
    }
    else if (!event.status.text && !event.status.fill && !event.status.shape) {
        if (retained['status/' + event.id]) {
            publish('status/' + event.id, {}, false);
        }
    }
    else {
        const status = {
            text: event.status.text,
            fill: event.status.fill,
            shape: event.status.shape
        };
        publish('status/' + event.id, status, true);
    }
}
function handleRuntimeEvent(event) {
    runtime.log.trace('runtime event: ' + JSON.stringify(event));
    publish('notification/' + event.id, event.payload || {}, event.retain);
}
function handleEventLog(event) {
    const type = event.payload.type;
    const id = event.id;
    if (event.payload.data) {
        let data = event.payload.data;
        if (data.endsWith('\n')) {
            data = data.substring(0, data.length - 1);
        }
        const lines = data.split(/\n/);
        lines.forEach((line) => {
            runtime.log.debug((type ? '[' + type + '] ' : '') + line);
        });
    }
    publish('event-log/' + event.id, event.payload || {});
}
function publish(topic, data, retain) {
    if (retain) {
        retained[topic] = data;
    }
    else {
        delete retained[topic];
    }
    connections.forEach((connection) => connection.send(topic, data));
}
const api = {
    init(_runtime) {
        runtime = _runtime;
        connections = [];
        retained = {};
        util_1.events.removeListener('node-status', handleStatusEvent);
        util_1.events.on('node-status', handleStatusEvent);
        util_1.events.removeListener('runtime-event', handleRuntimeEvent);
        util_1.events.on('runtime-event', handleRuntimeEvent);
        util_1.events.removeListener('comms', handleCommsEvent);
        util_1.events.on('comms', handleCommsEvent);
        util_1.events.removeListener('event-log', handleEventLog);
        util_1.events.on('event-log', handleEventLog);
    },
    /**
     * Registers a new comms connection
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {CommsConnection} opts.client - the client connection
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_comms
     */
    addConnection(opts) {
        connections.push(opts.client);
    },
    /**
     * Unregisters a comms connection
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {CommsConnection} opts.client - the client connection
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_comms
     */
    removeConnection(opts) {
        for (let i = 0; i < connections.length; i++) {
            if (connections[i] === opts.client) {
                connections.splice(i, 1);
                break;
            }
        }
    },
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
    subscribe(opts) {
        const re = new RegExp('^' +
            opts.topic
                .replace(/([[\]?()\\\\$^*.|])/g, '\\$1')
                .replace(/\+/g, '[^/]+')
                .replace(/\/#$/, '(/.*)?') +
            '$');
        for (const t in retained) {
            if (re.test(t)) {
                opts.client.send(t, retained[t]);
            }
        }
    },
    /**
     * TODO: Unsubscribes a comms connection from a given topic
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {CommsConnection} opts.client - the client connection
     * @param {String} opts.topic - the topic to unsubscribe from
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_comms
     */
    async unsubscribe(opts) {
        //
    }
};
exports.default = api;
//# sourceMappingURL=comms.js.map