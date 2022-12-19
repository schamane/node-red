/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable consistent-this */
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
 * Local file-system based context storage
 *
 * Configuration options:
 * {
 *    base: "context",         // the base directory to use
 *                             // default: "context"
 *    dir: "/path/to/storage", // the directory to create the base directory in
 *                             // default: settings.userDir
 *    cache: true,             // whether to cache contents in memory
 *                             // default: true
 *    flushInterval: 30        // if cache is enabled, the minimum interval
 *                             // between writes to storage, in seconds. This
 *                                can be used to reduce wear on underlying storage.
 *                                default: 30 seconds
 *  }
 *
 *
 *  $HOME/.node-red/contexts
 *  ├── global
 *  │     └── global_context.json
 *  ├── <id of Flow 1>
 *  │     ├── flow_context.json
 *  │     ├── <id of Node a>.json
 *  │     └── <id of Node b>.json
 *  └── <id of Flow 2>
 *         ├── flow_context.json
 *         ├── <id of Node x>.json
 *         └── <id of Node y>.json
 */

import fs from 'fs-extra';
import path from 'node:path';
import { log, util } from '@node-red/util';
import safeJSONStringify from 'json-stringify-safe';
import MemoryStore from './memory.js';

function getStoragePath(storageBaseDir, scope) {
  if (scope.indexOf(':') === -1) {
    if (scope === 'global') {
      return path.join(storageBaseDir, 'global', scope);
    } // scope:flow
    return path.join(storageBaseDir, scope, 'flow');
  } // scope:local
  const ids = scope.split(':');
  return path.join(storageBaseDir, ids[1], ids[0]);
}

function getBasePath(config) {
  const base = config.base || 'context';
  let storageBaseDir;
  if (!config.dir) {
    if (config.settings && config.settings.userDir) {
      storageBaseDir = path.join(config.settings.userDir, base);
    } else {
      try {
        fs.statSync(path.join(process.env.NODE_RED_HOME, '.config.json'));
        storageBaseDir = path.join(process.env.NODE_RED_HOME, base);
      } catch (err) {
        try {
          // Consider compatibility for older versions
          if (process.env.HOMEPATH) {
            fs.statSync(path.join(process.env.HOMEPATH, '.node-red', '.config.json'));
            storageBaseDir = path.join(process.env.HOMEPATH, '.node-red', base);
          }
        } catch {
          //
        }
        if (!storageBaseDir) {
          storageBaseDir = path.join(
            process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || process.env.NODE_RED_HOME,
            '.node-red',
            base
          );
        }
      }
    }
  } else {
    storageBaseDir = path.join(config.dir, base);
  }
  return storageBaseDir;
}

function loadFile(storagePath) {
  return fs.pathExists(storagePath).then(function (exists) {
    if (exists === true) {
      return fs.readFile(storagePath, 'utf8');
    }
    return Promise.resolve(undefined);
  });
}

function listFiles(storagePath) {
  const promises = [];
  return fs
    .readdir(storagePath)
    .then(function (files) {
      files.forEach(function (file) {
        if (!/^\./.test(file)) {
          const fullPath = path.join(storagePath, file);
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            promises.push(
              fs.readdir(fullPath).then(function (subdirFiles) {
                const result = [];
                subdirFiles.forEach((subfile) => {
                  if (/\.json$/.test(subfile)) {
                    result.push(path.join(file, subfile));
                  }
                });
                return result;
              })
            );
          }
        }
      });
      return Promise.all(promises);
    })
    .then((dirs) => dirs.reduce((acc, val) => acc.concat(val), []));
}

function stringify(value) {
  let hasCircular;
  const result = safeJSONStringify(value, null, 4, function (k, v) {
    hasCircular = true;
  });
  return { json: result, circular: hasCircular };
}

async function writeFileAtomic(storagePath, content) {
  // To protect against file corruption, write to a tmp file first and then
  // rename to the destination file
  const finalFile = storagePath + '.json';
  const tmpFile = finalFile + '.' + Date.now() + '.tmp';
  await fs.outputFile(tmpFile, content, 'utf8');
  return fs.rename(tmpFile, finalFile);
}

function LocalFileSystem(config) {
  this.config = config;
  this.storageBaseDir = getBasePath(this.config);
  this.writePromise = Promise.resolve();
  if (config.hasOwnProperty('cache') ? config.cache : true) {
    this.cache = MemoryStore();
  }
  this.pendingWrites = {};
  this.knownCircularRefs = {};

  if (config.hasOwnProperty('flushInterval')) {
    this.flushInterval = Math.max(0, config.flushInterval) * 1000;
  } else {
    this.flushInterval = 30000;
  }
}

LocalFileSystem.prototype.open = function () {
  const self = this;
  if (this.cache) {
    const scopes = [];
    const promises = [];
    const contextFiles = [];
    return listFiles(self.storageBaseDir)
      .then(function (files) {
        files.forEach(function (file) {
          const parts = file.split(path.sep);
          if (parts[0] === 'global') {
            scopes.push('global');
          } else if (parts[1] === 'flow.json') {
            scopes.push(parts[0]);
          } else {
            scopes.push(parts[1].substring(0, parts[1].length - 5) + ':' + parts[0]);
          }
          const contextFile = path.join(self.storageBaseDir, file);
          contextFiles.push(contextFile);
          promises.push(loadFile(contextFile));
        });
        return Promise.all(promises);
      })
      .then(function (res) {
        scopes.forEach(function (scope, i) {
          try {
            const data = res[i] ? JSON.parse(res[i]) : {};
            Object.keys(data).forEach(function (key) {
              self.cache.set(scope, key, data[key]);
            });
          } catch (err) {
            const error = new Error(log._('context.localfilesystem.invalid-json', { file: contextFiles[i] }));
            throw error;
          }
        });
      })
      .catch(function (err) {
        if (err.code === 'ENOENT') {
          return fs.ensureDir(self.storageBaseDir);
        }
        throw err;
      })
      .then(function () {
        // eslint-disable-next-line no-underscore-dangle
        self._flushPendingWrites = function () {
          const scopes = Object.keys(self.pendingWrites);
          self.pendingWrites = {};
          const promises = [];
          // eslint-disable-next-line no-underscore-dangle
          const newContext = self.cache._export();
          scopes.forEach(function (scope) {
            const storagePath = getStoragePath(self.storageBaseDir, scope);
            const context = newContext[scope] || {};
            const stringifiedContext = stringify(context);
            if (stringifiedContext.circular && !self.knownCircularRefs[scope]) {
              log.warn(log._('context.localfilesystem.error-circular', { scope }));
              self.knownCircularRefs[scope] = true;
            } else {
              delete self.knownCircularRefs[scope];
            }
            log.debug('Flushing localfilesystem context scope ' + scope);
            promises.push(writeFileAtomic(storagePath, stringifiedContext.json));
          });
          // eslint-disable-next-line no-underscore-dangle
          delete self._pendingWriteTimeout;
          return Promise.all(promises);
        };
      });
  }
  // eslint-disable-next-line no-underscore-dangle
  self._flushPendingWrites = function () {
    //
  };
  return fs.ensureDir(self.storageBaseDir);
};

LocalFileSystem.prototype.close = function () {
  const self = this;
  if (this.cache && this._pendingWriteTimeout) {
    clearTimeout(this._pendingWriteTimeout);
    delete this._pendingWriteTimeout;
    this.flushInterval = 0;
    self.writePromise = self.writePromise.then(function () {
      return self._flushPendingWrites().catch(function (err) {
        log.error(log._('context.localfilesystem.error-write', { message: err.toString() }));
      });
    });
  }
  return this.writePromise;
};

LocalFileSystem.prototype.get = function (scope, key, callback) {
  if (this.cache) {
    return this.cache.get(scope, key, callback);
  }
  if (typeof callback !== 'function') {
    throw new Error('File Store cache disabled - only asynchronous access supported');
  }
  const storagePath = getStoragePath(this.storageBaseDir, scope);
  loadFile(storagePath + '.json')
    .then(function (data) {
      let value;
      if (data) {
        data = JSON.parse(data);
        if (!Array.isArray(key)) {
          try {
            value = util.getObjectProperty(data, key);
          } catch (err) {
            if (err.code === 'INVALID_EXPR') {
              throw err;
            }
            value = undefined;
          }
          callback(null, value);
        } else {
          const results = [undefined];
          for (let i = 0; i < key.length; i++) {
            try {
              value = util.getObjectProperty(data, key[i]);
            } catch (err) {
              if (err.code === 'INVALID_EXPR') {
                throw err;
              }
              value = undefined;
            }
            results.push(value);
          }
          callback(...results);
        }
      } else {
        callback(null, undefined);
      }
    })
    .catch(function (err) {
      callback(err);
    });
};

LocalFileSystem.prototype.set = function (scope, key, value, callback) {
  const self = this;
  const storagePath = getStoragePath(this.storageBaseDir, scope);
  if (this.cache) {
    this.cache.set(scope, key, value, callback);
    this.pendingWrites[scope] = true;
    if (this._pendingWriteTimeout) {
      // there's a pending write which will handle this
      return;
    }
    this._pendingWriteTimeout = setTimeout(function () {
      self.writePromise = self.writePromise.then(function () {
        return self._flushPendingWrites.catch(function (err) {
          log.error(log._('context.localfilesystem.error-write', { message: err.toString() }));
        });
      });
    }, this.flushInterval);
  } else if (callback && typeof callback !== 'function') {
    throw new Error('File Store cache disabled - only asynchronous access supported');
  } else {
    self.writePromise = self.writePromise
      .then(function () {
        return loadFile(storagePath + '.json');
      })
      .then(function (data) {
        const obj = data ? JSON.parse(data) : {};
        if (!Array.isArray(key)) {
          key = [key];
          value = [value];
        } else if (!Array.isArray(value)) {
          // key is an array, but value is not - wrap it as an array
          value = [value];
        }
        for (let i = 0; i < key.length; i++) {
          let v = null;
          if (i < value.length) {
            v = value[i];
          }
          util.setObjectProperty(obj, key[i], v);
        }
        const stringifiedContext = stringify(obj);
        if (stringifiedContext.circular && !self.knownCircularRefs[scope]) {
          log.warn(log._('context.localfilesystem.error-circular', { scope }));
          self.knownCircularRefs[scope] = true;
        } else {
          delete self.knownCircularRefs[scope];
        }
        return writeFileAtomic(storagePath, stringifiedContext.json);
      })
      .then(function () {
        if (typeof callback === 'function') {
          callback(null);
        }
      })
      .catch(function (err) {
        if (typeof callback === 'function') {
          callback(err);
        }
      });
  }
};

LocalFileSystem.prototype.keys = function (scope, callback) {
  if (this.cache) {
    return this.cache.keys(scope, callback);
  }
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }
  const storagePath = getStoragePath(this.storageBaseDir, scope);
  loadFile(storagePath + '.json')
    .then(function (data) {
      if (data) {
        callback(null, Object.keys(JSON.parse(data)));
      } else {
        callback(null, []);
      }
    })
    .catch(function (err) {
      callback(err);
    });
};

LocalFileSystem.prototype.delete = function (scope) {
  let cachePromise;
  if (this.cache) {
    cachePromise = this.cache.delete(scope);
  } else {
    cachePromise = Promise.resolve();
  }
  const that = this;
  delete this.pendingWrites[scope];
  return cachePromise.then(function () {
    const storagePath = getStoragePath(that.storageBaseDir, scope);
    return fs.remove(storagePath + '.json');
  });
};

LocalFileSystem.prototype.clean = function (_activeNodes) {
  const activeNodes = {};
  _activeNodes.forEach(function (node) {
    activeNodes[node] = true;
  });
  const self = this;
  let cachePromise;
  if (this.cache) {
    cachePromise = this.cache.clean(_activeNodes);
  } else {
    cachePromise = Promise.resolve();
  }
  this.knownCircularRefs = {};
  return cachePromise
    .then(() => listFiles(self.storageBaseDir))
    .then(function (files) {
      const promises = [];
      files.forEach(function (file) {
        const parts = file.split(path.sep);
        let removePromise;
        if (parts[0] === 'global') {
          // never clean global
          return;
        } else if (!activeNodes[parts[0]]) {
          // Flow removed - remove the whole dir
          removePromise = fs.remove(path.join(self.storageBaseDir, parts[0]));
        } else if (parts[1] !== 'flow.json' && !activeNodes[parts[1].substring(0, parts[1].length - 5)]) {
          // Node removed - remove the context file
          removePromise = fs.remove(path.join(self.storageBaseDir, file));
        }
        if (removePromise) {
          promises.push(removePromise);
        }
      });
      return Promise.all(promises);
    });
};

export default function (config) {
  return new LocalFileSystem(config);
}
