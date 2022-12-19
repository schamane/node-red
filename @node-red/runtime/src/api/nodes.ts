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
 * @mixin @node-red/runtime_nodes
 */

import fs from 'fs-extra';

let runtime;

function putNode(node, enabled) {
  let info;
  let promise;
  if (!node.err && node.enabled === enabled) {
    promise = Promise.resolve(node);
  } else if (enabled) {
    promise = runtime.nodes.enableNode(node.id);
  } else {
    promise = runtime.nodes.disableNode(node.id);
  }
  return promise;
}

const api = {
  init(_runtime) {
    runtime = _runtime;
  },
  /**
   * Gets the info of an individual node set
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {String} opts.id - the id of the node set to return
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<NodeInfo>} - the node information
   * @memberof @node-red/runtime_nodes
   */
  getNodeInfo(opts) {
    const id = opts.id;
    const result = runtime.nodes.getNodeInfo(id);
    if (result) {
      runtime.log.audit({ event: 'nodes.info.get', id }, opts.req);
      delete result.loaded;
      return result;
    }
    runtime.log.audit({ event: 'nodes.info.get', id, error: 'not_found' }, opts.req);
    const err = new Error('Node not found') as any;
    err.code = 'not_found';
    err.status = 404;
    throw err;
  },

  /**
   * Gets the list of node modules installed in the runtime
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<NodeList>} - the list of node modules
   * @memberof @node-red/runtime_nodes
   */
  getNodeList(opts) {
    runtime.log.audit({ event: 'nodes.list.get' }, opts.req);
    return runtime.nodes.getNodeList();
  },

  /**
   * Gets an individual node's html content
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {String} opts.id - the id of the node set to return
   * @param {String} opts.lang - the locale language to return
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<String>} - the node html content
   * @memberof @node-red/runtime_nodes
   */
  getNodeConfig(opts) {
    const id = opts.id;
    const lang = opts.lang;
    if (/[^0-9a-z=\-*]/i.test(opts.lang)) {
      // reject(new Error('Invalid language: ' + opts.lang));
      // return;
      throw new Error('Invalid language: ' + opts.lang);
    }
    const result = runtime.nodes.getNodeConfig(id, lang);
    if (result) {
      runtime.log.audit({ event: 'nodes.config.get', id }, opts.req);
      return result;
    }
    runtime.log.audit({ event: 'nodes.config.get', id, error: 'not_found' }, opts.req);
    const err = new Error('Node not found') as any;
    err.code = 'not_found';
    err.status = 404;
    throw err;
  },
  /**
   * Gets all node html content
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {String} opts.lang - the locale language to return
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<String>} - the node html content
   * @memberof @node-red/runtime_nodes
   */
  getNodeConfigs(opts) {
    runtime.log.audit({ event: 'nodes.configs.get' }, opts.req);
    if (/[^0-9a-z=\-*]/i.test(opts.lang)) {
      // reject(new Error('Invalid language: ' + opts.lang));
      // return;
      throw new Error('Invalid language: ' + opts.lang);
    }
    return runtime.nodes.getNodeConfigs(opts.lang);
  },

  /**
   * Gets the info of a node module
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {String} opts.module - the id of the module to return
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<ModuleInfo>} - the node module info
   * @memberof @node-red/runtime_nodes
   */
  getModuleInfo(opts) {
    const result = runtime.nodes.getModuleInfo(opts.module);
    if (result) {
      runtime.log.audit({ event: 'nodes.module.get', id: opts.module }, opts.req);
      return result;
    }
    runtime.log.audit({ event: 'nodes.module.get', id: opts.module, error: 'not_found' }, opts.req);
    const err = new Error('Module not found') as any;
    err.code = 'not_found';
    err.status = 404;
    throw err;
  },

  /**
   * Install a new module into the runtime
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {String} opts.module - the id of the module to install
   * @param {String} opts.version - (optional) the version of the module to install
   * @param {Object} opts.tarball - (optional) a tarball file to install. Object has properties `name`, `size` and `buffer`.
   * @param {String} opts.url - (optional) url to install
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<ModuleInfo>} - the node module info
   * @memberof @node-red/runtime_nodes
   */
  addModule(opts) {
    if (!runtime.settings.available()) {
      runtime.log.audit({ event: 'nodes.install', error: 'settings_unavailable' }, opts.req);
      const err = new Error('Settings unavailable') as any;
      err.code = 'settings_unavailable';
      err.status = 400;
      throw err;
    }
    if (opts.tarball) {
      if (
        runtime.settings.externalModules &&
        runtime.settings.externalModules.palette &&
        runtime.settings.externalModules.palette.upload === false
      ) {
        runtime.log.audit({ event: 'nodes.install', tarball: opts.tarball.file, error: 'invalid_request' }, opts.req);
        const err = new Error('Invalid request') as any;
        err.code = 'invalid_request';
        err.status = 400;
        throw err;
      }
      if (opts.module || opts.version || opts.url) {
        runtime.log.audit({ event: 'nodes.install', tarball: opts.tarball.file, module: opts.module, error: 'invalid_request' }, opts.req);
        const err = new Error('Invalid request') as any;
        err.code = 'invalid_request';
        err.status = 400;
        throw err;
      }
      return runtime.nodes
        .installModule(opts.tarball.buffer)
        .then(function (info) {
          runtime.log.audit({ event: 'nodes.install', tarball: opts.tarball.file, module: info.id }, opts.req);
          return info;
        })
        .catch(function (err) {
          if (err.code) {
            err.status = 400;
            runtime.log.audit(
              { event: 'nodes.install', module: opts.module, version: opts.version, url: opts.url, error: err.code },
              opts.req
            );
          } else {
            err.status = 400;
            runtime.log.audit(
              {
                event: 'nodes.install',
                module: opts.module,
                version: opts.version,
                url: opts.url,
                error: err.code || 'unexpected_error',
                message: err.toString()
              },
              opts.req
            );
          }
          throw err;
        });
    }
    if (opts.module) {
      const existingModule = runtime.nodes.getModuleInfo(opts.module);
      if (existingModule && existingModule.user) {
        if (!opts.version || existingModule.version === opts.version) {
          runtime.log.audit(
            { event: 'nodes.install', module: opts.module, version: opts.version, error: 'module_already_loaded' },
            opts.req
          );
          const err = new Error('Module already loaded') as any;
          err.code = 'module_already_loaded';
          err.status = 400;
          throw err;
        }
      }
      return runtime.nodes
        .installModule(opts.module, opts.version, opts.url)
        .then(function (info) {
          runtime.log.audit({ event: 'nodes.install', module: opts.module, version: opts.version, url: opts.url }, opts.req);
          return info;
        })
        .catch(function (err) {
          if (err.code === 404) {
            runtime.log.audit(
              { event: 'nodes.install', module: opts.module, version: opts.version, url: opts.url, error: 'not_found' },
              opts.req
            );
            // TODO: code/status
            err.status = 404;
          } else if (err.code) {
            err.status = 400;
            runtime.log.audit(
              { event: 'nodes.install', module: opts.module, version: opts.version, url: opts.url, error: err.code },
              opts.req
            );
          } else {
            err.status = 400;
            runtime.log.audit(
              {
                event: 'nodes.install',
                module: opts.module,
                version: opts.version,
                url: opts.url,
                error: err.code || 'unexpected_error',
                message: err.toString()
              },
              opts.req
            );
          }
          throw err;
        });
    }
    runtime.log.audit({ event: 'nodes.install', module: opts.module, error: 'invalid_request' }, opts.req);
    const err = new Error('Invalid request') as any;
    err.code = 'invalid_request';
    err.status = 400;
    throw err;
  },
  /**
   * Removes a module from the runtime
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {String} opts.module - the id of the module to remove
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise} - resolves when complete
   * @memberof @node-red/runtime_nodes
   */
  removeModule(opts) {
    if (!runtime.settings.available()) {
      runtime.log.audit({ event: 'nodes.install', error: 'settings_unavailable' }, opts.req);
      const err = new Error('Settings unavailable') as any;
      err.code = 'settings_unavailable';
      err.status = 400;
      throw err;
    }
    const module = runtime.nodes.getModuleInfo(opts.module);
    if (!module) {
      runtime.log.audit({ event: 'nodes.remove', module: opts.module, error: 'not_found' }, opts.req);
      const err = new Error('Module not found') as any;
      err.code = 'not_found';
      err.status = 404;
      throw err;
    }
    try {
      return runtime.nodes
        .uninstallModule(opts.module)
        .then(function () {
          runtime.log.audit({ event: 'nodes.remove', module: opts.module }, opts.req);
        })
        .catch(function (err) {
          err.status = 400;
          runtime.log.audit(
            { event: 'nodes.remove', module: opts.module, error: err.code || 'unexpected_error', message: err.toString() },
            opts.req
          );
          throw err;
        });
    } catch (error) {
      runtime.log.audit(
        { event: 'nodes.remove', module: opts.module, error: error.code || 'unexpected_error', message: error.toString() },
        opts.req
      );
      error.status = 400;
      throw error;
    }
  },

  /**
   * Enables or disables a module in the runtime
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {String} opts.module - the id of the module to enable or disable
   * @param {String} opts.enabled - whether the module should be enabled or disabled
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<ModuleInfo>} - the module info object
   * @memberof @node-red/runtime_nodes
   */
  async setModuleState(opts) {
    const mod = opts.module;
    if (!runtime.settings.available()) {
      runtime.log.audit({ event: 'nodes.module.set', error: 'settings_unavailable' }, opts.req);
      const err = new Error('Settings unavailable') as any;
      err.code = 'settings_unavailable';
      err.status = 400;
      throw err;
    }
    try {
      const module = runtime.nodes.getModuleInfo(mod);
      if (!module) {
        runtime.log.audit({ event: 'nodes.module.set', module: mod, error: 'not_found' }, opts.req);
        const err = new Error('Module not found') as any;
        err.code = 'not_found';
        err.status = 404;
        throw err;
      }

      const nodes = module.nodes;
      const promises = [];
      for (let i = 0; i < nodes.length; ++i) {
        promises.push(putNode(nodes[i], opts.enabled));
      }
      return Promise.all(promises)
        .then(function () {
          return runtime.nodes.getModuleInfo(mod);
        })
        .catch(function (err) {
          err.status = 400;
          throw err;
        });
    } catch (error) {
      runtime.log.audit(
        {
          event: 'nodes.module.set',
          module: mod,
          enabled: opts.enabled,
          error: error.code || 'unexpected_error',
          message: error.toString()
        },
        opts.req
      );
      error.status = 400;
      throw error;
    }
  },

  /**
   * Enables or disables a n individual node-set in the runtime
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {String} opts.id - the id of the node-set to enable or disable
   * @param {String} opts.enabled - whether the module should be enabled or disabled
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<ModuleInfo>} - the module info object
   * @memberof @node-red/runtime_nodes
   */
  setNodeSetState(opts) {
    if (!runtime.settings.available()) {
      runtime.log.audit({ event: 'nodes.info.set', error: 'settings_unavailable' }, opts.req);
      const err = new Error('Settings unavailable') as any;
      err.code = 'settings_unavailable';
      err.status = 400;
      throw err;
    }

    const id = opts.id;
    const enabled = opts.enabled;
    try {
      const node = runtime.nodes.getNodeInfo(id);
      if (!node) {
        runtime.log.audit({ event: 'nodes.info.set', id, error: 'not_found' }, opts.req);
        const err = new Error('Node not found') as any;
        err.code = 'not_found';
        err.status = 404;
        throw err;
      } else {
        delete node.loaded;
        return putNode(node, enabled)
          .then(function (result) {
            runtime.log.audit({ event: 'nodes.info.set', id, enabled }, opts.req);
            return result;
          })
          .catch(function (err) {
            runtime.log.audit(
              { event: 'nodes.info.set', id, enabled, error: err.code || 'unexpected_error', message: err.toString() },
              opts.req
            );
            err.status = 400;
            throw err;
          });
      }
    } catch (error) {
      runtime.log.audit(
        { event: 'nodes.info.set', id, enabled, error: error.code || 'unexpected_error', message: error.toString() },
        opts.req
      );
      error.status = 400;
      throw error;
    }
  },

  /**
   * Gets all registered module message catalogs
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {User} opts.lang - the i18n language to return. If not set, uses runtime default (en-US)
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<Object>} - the message catalogs
   * @memberof @node-red/runtime_nodes
   */
  async getModuleCatalogs(opts) {
    const namespace = opts.module;
    const lang = opts.lang;
    if (/[^0-9a-z=\-*]/i.test(lang)) {
      // reject(new Error('Invalid language: ' + lang));
      // return;
      throw new Error('Invalid language: ' + lang);
    }
    const prevLang = runtime.i18n.i.language;
    // Trigger a load from disk of the language if it is not the default
    return new Promise((resolve, reject) => {
      runtime.i18n.i.changeLanguage(lang, function () {
        const nodeList = runtime.nodes.getNodeList();
        const result = {};
        nodeList.forEach(function (n) {
          if (n.module !== 'node-red') {
            result[n.id] = runtime.i18n.i.getResourceBundle(lang, n.id) || {};
          }
        });
        runtime.i18n.i.changeLanguage(prevLang);
        resolve(result);
      });
    });
  },

  /**
   * Gets a modules message catalog
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {User} opts.module - the module
   * @param {User} opts.lang - the i18n language to return. If not set, uses runtime default (en-US)
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<Object>} - the message catalog
   * @memberof @node-red/runtime_nodes
   */
  async getModuleCatalog(opts) {
    const namespace = opts.module;
    const lang = opts.lang;
    if (/[^0-9a-z=\-*]/i.test(lang)) {
      // reject(new Error('Invalid language: ' + lang));
      //  return;
      throw new Error('Invalid language: ' + lang);
    }
    const prevLang = runtime.i18n.i.language;
    // Trigger a load from disk of the language if it is not the default
    return new Promise((resolve) => {
      runtime.i18n.i.changeLanguage(lang, function () {
        const catalog = runtime.i18n.i.getResourceBundle(lang, namespace);
        runtime.i18n.i.changeLanguage(prevLang);
        resolve(catalog || {});
      });
    });
  },

  /**
   * Gets the list of all icons available in the modules installed within the runtime
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<IconList>} - the list of all icons
   * @memberof @node-red/runtime_nodes
   */
  getIconList(opts) {
    runtime.log.audit({ event: 'nodes.icons.get' }, opts.req);
    return runtime.nodes.getNodeIcons();
  },
  /**
   * Gets a node icon
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {String} opts.module - the id of the module requesting the icon
   * @param {String} opts.icon - the name of the icon
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<Buffer>} - the icon file as a Buffer or null if no icon available
   * @memberof @node-red/runtime_nodes
   */
  async getIcon(opts) {
    const iconPath = runtime.nodes.getNodeIconPath(opts.module, opts.icon);
    if (iconPath) {
      return fs.readFile(iconPath).catch((err) => {
        err.status = 400;
        throw err;
      });
    }
    return null;
  },

  /**
   * Gets a resource from a module
   * @param {Object} opts
   * @param {User} opts.user - the user calling the api
   * @param {String} opts.module - the id of the module requesting the resource
   * @param {String} opts.path - the path of the resource
   * @param {Object} opts.req - the request to log (optional)
   * @return {Promise<Buffer>} - the resource file as a Buffer or null if not found
   * @memberof @node-red/runtime_nodes
   */
  async getModuleResource(opts) {
    const resourcePath = runtime.nodes.getModuleResource(opts.module, opts.path);
    if (resourcePath) {
      return fs.readFile(resourcePath).catch((err) => {
        if (err.code === 'EISDIR') {
          return null;
        }
        err.status = 400;
        throw err;
      });
    }
    return null;
  }
};

export default api;
