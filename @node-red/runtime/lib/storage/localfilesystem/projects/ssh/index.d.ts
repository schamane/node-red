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
declare function init(_settings: any): Promise<void>;
declare function listSSHKeys(username: any): Promise<any[] | {
    name: any;
}[]>;
declare function getSSHKey(username: any, name: any): Promise<any>;
declare function generateSSHKey(username: any, options: any): Promise<any>;
declare function deleteSSHKey(username: any, name: any): Promise<[void, void]>;
declare function getPrivateKeyPath(username: any, name: any): string;
declare const _default: {
    init: typeof init;
    listSSHKeys: typeof listSSHKeys;
    getSSHKey: typeof getSSHKey;
    getPrivateKeyPath: typeof getPrivateKeyPath;
    generateSSHKey: typeof generateSSHKey;
    deleteSSHKey: typeof deleteSSHKey;
};
export default _default;
