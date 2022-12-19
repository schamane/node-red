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
declare function parseJSON(data: any): any;
declare function readFile(path: any, backupPath: any, emptyResponse: any, type?: any): Promise<unknown>;
declare const _default: {
    /**
     * Write content to a file using UTF8 encoding.
     * This forces a fsync before completing to ensure
     * the write hits disk.
     */
    writeFile(path: any, content: any, backupPath?: any): any;
    readFile: typeof readFile;
    parseJSON: typeof parseJSON;
};
export default _default;
