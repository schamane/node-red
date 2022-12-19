"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const comms_js_1 = __importDefault(require("./comms.js"));
const flows_js_1 = __importDefault(require("./flows.js"));
const library_js_1 = __importDefault(require("./library.js"));
const nodes_js_1 = __importDefault(require("./nodes.js"));
const settings_js_1 = __importDefault(require("./settings.js"));
const projects_js_1 = __importDefault(require("./projects.js"));
const context_js_1 = __importDefault(require("./context.js"));
const plugins_js_1 = __importDefault(require("./plugins.js"));
const diagnostics_js_1 = __importDefault(require("./diagnostics.js"));
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
    comms: comms_js_1.default,
    flows: flows_js_1.default,
    library: library_js_1.default,
    nodes: nodes_js_1.default,
    settings: settings_js_1.default,
    projects: projects_js_1.default,
    context: context_js_1.default,
    plugins: plugins_js_1.default,
    diagnostics: diagnostics_js_1.default,
    isStarted() {
        return runtime.isStarted();
    },
    version() {
        return runtime.version();
    }
};
exports.default = api;
//# sourceMappingURL=index.js.map