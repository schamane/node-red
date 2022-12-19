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
declare function diffNodes(oldNode: any, newNode: any): boolean;
declare function mapEnvVarProperties(obj: any, prop: any, flow: any, config: any): void;
declare function createNode(flow: any, config: any): any;
declare function parseConfig(config: any): any;
declare const _default: {
    init(runtime: any): void;
    getEnvVar(k: any): string;
    diffNodes: typeof diffNodes;
    mapEnvVarProperties: typeof mapEnvVarProperties;
    parseConfig: typeof parseConfig;
    diffConfigs(oldConfig: any, newConfig: any): {
        added: string[];
        changed: string[];
        removed: string[];
        rewired: string[];
        linked: any[];
    };
    /**
     * Create a new instance of a node
     * @param  {Flow} flow     The containing flow
     * @param  {object} config The node configuration object
     * @return {Node}          The instance of the node
     */
    createNode: typeof createNode;
};
export default _default;
