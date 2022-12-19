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

/**
 * @mixin @node-red/runtime_flows
 */

/**
 * @typedef Flows
 * @type {object}
 * @property {string} rev - the flow revision identifier
 * @property {Array}  flows - the flow configuration, an array of node configuration objects
 */

/**
 * @typedef Flow
 * @type {object}
 * @property {string} id - the flow identifier
 * @property {string} label - a label for the flow
 * @property {Array}  nodes - an array of node configuration objects
 */

import { Mutex } from 'async-mutex';

let runtime;

const mutex = new Mutex();

const api = {
  init(_runtime) {
    runtime = _runtime;
  },
  /**
   * Gets the current flow configuration
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<Flows>} - the active flow configuration
   * @memberof @node-red/runtime_flows
   */
  getFlows(opts) {
    runtime.log.audit({ event: 'flows.get' }, opts.req);
    return runtime.flows.getFlows();
  },
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
  async setFlows(opts) {
    return mutex.runExclusive(function () {
      const flows = opts.flows;
      const deploymentType = opts.deploymentType || 'full';
      runtime.log.audit({ event: 'flows.set', type: deploymentType }, opts.req);

      let apiPromise;
      if (deploymentType === 'reload') {
        apiPromise = runtime.flows.loadFlows(true);
      } else {
        if (flows.hasOwnProperty('rev')) {
          const currentVersion = runtime.flows.getFlows().rev;
          if (currentVersion !== flows.rev) {
            const err = new Error() as any;
            err.code = 'version_mismatch';
            err.status = 409;
            // TODO: log warning
            throw err;
          }
        }
        apiPromise = runtime.flows.setFlows(flows.flows, flows.credentials, deploymentType, null, null, opts.user);
      }
      return apiPromise
        .then(function (flowId) {
          return { rev: flowId };
        })
        .catch(function (err) {
          runtime.log.warn(runtime.log._('api.flows.error-' + (deploymentType === 'reload' ? 'reload' : 'save'), { message: err.message }));
          runtime.log.warn(err.stack);
          throw err;
        });
    });
  },

  /**
   * Adds a flow configuration
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {Object} opts.flow - the flow to add
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<String>} - the id of the added flow
   * @memberof @node-red/runtime_flows
   */
  async addFlow(opts) {
    return mutex.runExclusive(function () {
      const flow = opts.flow;
      return runtime.flows
        .addFlow(flow, opts.user)
        .then(function (id) {
          runtime.log.audit({ event: 'flow.add', id }, opts.req);
          return id;
        })
        .catch(function (err) {
          runtime.log.audit(
            {
              event: 'flow.add',
              error: err.code || 'unexpected_error',
              message: err.toString()
            },
            opts.req
          );
          err.status = 400;
          throw err;
        });
    });
  },

  /**
   * Gets an individual flow configuration
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {Object} opts.id - the id of the flow to retrieve
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<Flow>} - the active flow configuration
   * @memberof @node-red/runtime_flows
   */
  getFlow(opts) {
    const flow = runtime.flows.getFlow(opts.id);
    if (flow) {
      runtime.log.audit({ event: 'flow.get', id: opts.id }, opts.req);
      return flow;
    }
    runtime.log.audit({ event: 'flow.get', id: opts.id, error: 'not_found' }, opts.req);
    const err = new Error() as any;
    err.code = 'not_found';
    err.status = 404;
    throw err;
  },
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
  async updateFlow(opts) {
    return mutex.runExclusive(function () {
      const flow = opts.flow;
      const id = opts.id;
      return runtime.flows
        .updateFlow(id, flow, opts.user)
        .then(function () {
          runtime.log.audit({ event: 'flow.update', id }, opts.req);
          return id;
        })
        .catch(function (err) {
          if (err.code === 404) {
            runtime.log.audit({ event: 'flow.update', id, error: 'not_found' }, opts.req);
            // TODO: this swap around of .code and .status isn't ideal
            err.status = 404;
            err.code = 'not_found';
          } else {
            runtime.log.audit(
              {
                event: 'flow.update',
                error: err.code || 'unexpected_error',
                message: err.toString()
              },
              opts.req
            );
            err.status = 400;
          }
          throw err;
        });
    });
  },
  /**
   * Deletes a flow
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {Object} opts.id - the id of the flow to delete
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise} - resolves if successful
   * @memberof @node-red/runtime_flows
   */
  async deleteFlow(opts) {
    return mutex.runExclusive(function () {
      const id = opts.id;
      return runtime.flows
        .removeFlow(id, opts.user)
        .then(function () {
          runtime.log.audit({ event: 'flow.remove', id }, opts.req);
          return;
        })
        .catch(function (err) {
          if (err.code === 404) {
            runtime.log.audit({ event: 'flow.remove', id, error: 'not_found' }, opts.req);
            // TODO: this swap around of .code and .status isn't ideal
            err.status = 404;
            err.code = 'not_found';
          } else {
            runtime.log.audit(
              {
                event: 'flow.remove',
                id,
                error: err.code || 'unexpected_error',
                message: err.toString()
              },
              opts.req
            );
            err.status = 400;
          }
          throw err;
        });
    });
  },

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
  getNodeCredentials(opts) {
    runtime.log.audit({ event: 'credentials.get', type: opts.type, id: opts.id }, opts.req);
    const credentials = runtime.nodes.getCredentials(opts.id);
    if (!credentials) {
      return {};
    }
    const sendCredentials = {};
    let cred;
    if (/^subflow(:|$)/.test(opts.type) || opts.type === 'tab' || opts.type === 'group') {
      for (cred in credentials) {
        if (credentials.hasOwnProperty(cred)) {
          sendCredentials['has_' + cred] = credentials[cred] !== null && credentials[cred] !== '';
        }
      }
    } else {
      const definition = runtime.nodes.getCredentialDefinition(opts.type) || {};
      for (cred in definition) {
        if (definition.hasOwnProperty(cred)) {
          if (definition[cred].type === 'password') {
            const key = 'has_' + cred;
            sendCredentials[key] = credentials[cred] !== null && credentials[cred] !== '';
            continue;
          }
          sendCredentials[cred] = credentials[cred] || '';
        }
      }
    }
    return sendCredentials;
  },
  /**
   * Gets running state of runtime flows
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {Object} opts.req - the request to log (optional)
   * @return {{state:string, started:boolean}} - the current run state of the flows
   * @memberof @node-red/runtime_flows
   */
  getState(opts) {
    runtime.log.audit({ event: 'flows.getState' }, opts.req);
    const result = {
      state: runtime.flows.state()
    };
    return result;
  },
  /**
   * Sets running state of runtime flows
   * @param {Object} opts
   * @param {Object} opts.req - the request to log (optional)
   * @param {User} opts.user - the user calling the api
   * @param {string} opts.state - the requested state. Valid values are "start" and "stop".
   * @return {Promise<Flow>} - the active flow configuration
   * @memberof @node-red/runtime_flows
   */
  async setState(opts) {
    opts = opts || {};
    const makeError = (error, errcode, statusCode) => {
      const message = typeof error === 'object' ? error.message : error;
      const err = typeof error === 'object' ? error : new Error(message || 'Unexpected Error');
      err.status = err.status || statusCode || 400;
      err.code = err.code || errcode || 'unexpected_error';
      runtime.log.audit(
        {
          event: 'flows.setState',
          state: opts.state || '',
          error: errcode || 'unexpected_error',
          message: err.code
        },
        opts.req
      );
      return err;
    };

    const getState = () => {
      return {
        state: runtime.flows.state()
      };
    };

    if (!runtime.settings.runtimeState || runtime.settings.runtimeState.enabled !== true) {
      throw makeError('Method Not Allowed', 'not_allowed', 405);
    }
    switch (opts.state) {
      case 'start':
        try {
          try {
            runtime.settings.set('runtimeFlowState', opts.state);
          } catch {
            //
          }
          if (runtime.settings.safeMode) {
            delete runtime.settings.safeMode;
          }
          await runtime.flows.startFlows('full');
          return getState();
        } catch (err) {
          throw makeError(err, err.code, 500);
        }
      case 'stop':
        try {
          try {
            runtime.settings.set('runtimeFlowState', opts.state);
          } catch {
            //
          }
          await runtime.flows.stopFlows('full');
          return getState();
        } catch (err) {
          throw makeError(err, err.code, 500);
        }
      default:
        throw makeError(`Cannot change flows runtime state to '${opts.state}'}`, 'invalid_run_state', 400);
    }
  }
};

export default api;
