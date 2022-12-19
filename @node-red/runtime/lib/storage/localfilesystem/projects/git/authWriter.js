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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_net_1 = __importDefault(require("node:net"));
const socket = node_net_1.default.connect(process.argv[2], function () {
    socket.on('data', function (data) {
        console.log(data);
    });
    socket.on('end', function () {
        //
    });
    socket.write((process.argv[3] || '') + '\n', 'utf8');
});
socket.setEncoding('utf8');
//# sourceMappingURL=authWriter.js.map