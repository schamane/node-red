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
 * The Node object is the heart of a Node-RED flow. It is the object that all
 * nodes extend.
 *
 * The Node object itself inherits from EventEmitter, although it provides
 * custom implementations of some of the EE functions in order to handle
 * `input` and `close` events properly.
 */
declare function Node(n: any): void;
declare namespace Node {
    var _flow: any;
    var _alias: any;
    var id: any;
    var type: any;
    var z: any;
}
export default Node;
