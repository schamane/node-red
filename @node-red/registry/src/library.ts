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

import fs from 'node:fs';
import fspath from 'node:path';

let exampleRoots = {};
let exampleFlows = null;

async function getFlowsFromPath(path) {
  const result: { f: any[]; d: Record<string, unknown> } = { f: [], d: {} };
  const validFiles = [];
  return fs.promises
    .readdir(path)
    .then((files) => {
      const promises = [];
      if (files) {
        files.forEach(function (file) {
          const fullPath = fspath.join(path, file);
          const stats = fs.lstatSync(fullPath);
          if (stats.isDirectory()) {
            validFiles.push(file);
            promises.push(getFlowsFromPath(fullPath));
          } else if (/\.json$/.test(file)) {
            validFiles.push(file);
            promises.push(Promise.resolve(file.split('.')[0]));
          }
        });
      }
      return Promise.all(promises);
    })
    .then((results) => {
      results.forEach(function (r, i) {
        if (typeof r === 'string') {
          result.f.push(r);
        } else {
          result.d[validFiles[i]] = r;
        }
      });
      return result;
    });
}

function addNodeExamplesDir(module, path) {
  exampleRoots[module] = path;
  return getFlowsFromPath(path).then(function (result) {
    if (JSON.stringify(result).indexOf('{"f":') === -1) {
      return;
    }
    exampleFlows = exampleFlows || {};
    exampleFlows[module] = result;
  });
}
function removeNodeExamplesDir(module) {
  delete exampleRoots[module];
  if (exampleFlows) {
    delete exampleFlows[module];
  }
  if (exampleFlows && Object.keys(exampleFlows).length === 0) {
    exampleFlows = null;
  }
}

export function init() {
  exampleRoots = {};
  exampleFlows = null;
}

export function getExampleFlows() {
  return exampleFlows;
}

export function getExampleFlowPath(module, path) {
  if (exampleRoots[module]) {
    return fspath.join(exampleRoots[module], path) + '.json';
  }
  return null;
}
export const addExamplesDir = addNodeExamplesDir;
export const removeExamplesDir = removeNodeExamplesDir;
