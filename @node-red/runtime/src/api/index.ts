/* !
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

import comms from './comms.js';
import flows from './flows.js';
import library from './library.js';
import nodes from './nodes.js';
import settings from './settings.js';
import projects from './projects.js';
import context from './context.js';
import plugins from './plugins.js';
import diagnostics from './diagnostics.js';

let runtime;

const api = {
  init(_runtime) {
    runtime = _runtime;
    api.comms.init(runtime);
    api.flows.init(runtime);
    api.nodes.init(runtime);
    api.settings.init(runtime);
    api.library.init(runtime);
    api.projects.init(runtime);
    api.context.init(runtime);
    api.plugins.init(runtime);
    api.diagnostics.init(runtime);
  },

  comms,
  flows,
  library,
  nodes,
  settings,
  projects,
  context,
  plugins,
  diagnostics,

  isStarted() {
    return runtime.isStarted();
  },

  version() {
    return runtime.version();
  }
};

export default api;
