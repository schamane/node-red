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

import fs from 'fs-extra';
import fspath from 'node:path';
import util from './util.js';

let settings;
let libDir;
let libFlowsDir;

function toSingleLine(text) {
  const result = text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
  return result;
}

function fromSingleLine(text) {
  const result = text.replace(/\\[\\n]/g, function (s) {
    return s === '\\\\' ? '\\' : '\n';
  });
  return result;
}

function getFileMeta(root, path) {
  const fn = fspath.join(root, path);
  const fd = fs.openSync(fn, 'r');
  const size = fs.fstatSync(fd).size;
  const meta = {};
  let read = 0;
  const length = 10;
  let remaining = Buffer.alloc(0);
  const buffer = Buffer.alloc(length);
  while (read < size) {
    read += fs.readSync(fd, buffer, 0, length, 0);
    const data = Buffer.concat([remaining, buffer]);
    const index = data.lastIndexOf(0x0a);
    if (index !== -1) {
      const parts = data.slice(0, index).toString().split('\n');
      for (let i = 0; i < parts.length; i++) {
        const match = /^\/\/ (\w+): (.*)/.exec(parts[i]);
        if (match) {
          meta[match[1]] = fromSingleLine(match[2]);
        } else {
          read = size;
          break;
        }
      }
      remaining = data.slice(index + 1);
    } else {
      remaining = data;
    }
  }
  fs.closeSync(fd);
  return meta;
}

function getFileBody(root, path) {
  let body = '';
  const fn = fspath.join(root, path);
  const data = fs.readFileSync(fn, 'utf8');
  const parts = data.split('\n');
  let scanning = true;
  for (let i = 0; i < parts.length; i++) {
    if (!/^\/\/ \w+: /.test(parts[i]) || !scanning) {
      body += (body.length > 0 ? '\n' : '') + parts[i];
      scanning = false;
    }
  }
  return body;
}

function getLibraryEntry(type, path) {
  const root = fspath.join(libDir, type);
  const rootPath = fspath.join(libDir, type, path);

  // don't create the folder if it does not exist - we are only reading....
  return fs
    .lstat(rootPath)
    .then(function (stats) {
      if (stats.isFile()) {
        return getFileBody(root, path);
      }
      if (path.substr(-1) === '/') {
        path = path.substr(0, path.length - 1);
      }
      return fs.readdir(rootPath).then(function (fns) {
        const dirs = [];
        const files = [];
        fns.sort().filter(function (fn) {
          const fullPath = fspath.join(path, fn);
          // we use fs.realpathSync to also resolve Symbolic Link
          const absoluteFullPath = fs.realpathSync(fspath.join(root, fullPath));
          if (fn[0] !== '.') {
            const currentStats = fs.lstatSync(absoluteFullPath);
            if (currentStats.isDirectory()) {
              dirs.push(fn);
            } else {
              const meta: any = getFileMeta(root, fullPath);
              meta.fn = fn;
              files.push(meta);
            }
          }
          // why sort.filter?
          return false;
        });
        return dirs.concat(files);
      });
    } as any)
    .catch(function (err) {
      // if path is empty, then assume it was a folder, return empty
      if (path === '') {
        return [];
      }

      // if path ends with slash, it was a folder
      // so return empty
      if (path.substr(-1) === '/') {
        return [];
      }

      // else path was specified, but did not exist,
      // check for path.json as an alternative if flows
      if (type === 'flows' && !/\.json$/.test(path)) {
        return getLibraryEntry(type, path + '.json').catch(function (e) {
          throw err;
        });
      }
      throw err;
    });
}

export default {
  init(_settings) {
    settings = _settings;
    libDir = fspath.join(settings.userDir, 'lib');
    libFlowsDir = fspath.join(libDir, 'flows');
    if (!settings.readOnly) {
      return fs.ensureDir(libFlowsDir);
    }
  },
  getLibraryEntry,

  saveLibraryEntry(type, path, meta, body) {
    if (settings.readOnly) {
      return;
    }
    if (type === 'flows' && !path.endsWith('.json')) {
      path += '.json';
    }
    const fn = fspath.join(libDir, type, path);
    let headers = '';
    for (const i in meta) {
      if (meta.hasOwnProperty(i)) {
        headers += '// ' + i + ': ' + toSingleLine(meta[i]) + '\n';
      }
    }
    if (type === 'flows' && settings.flowFilePretty) {
      body = JSON.stringify(JSON.parse(body), null, 4);
    }
    return fs.ensureDir(fspath.dirname(fn)).then(function () {
      util.writeFile(fn, headers + body);
    });
  }
};
