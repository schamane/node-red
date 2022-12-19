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
declare const api: {
    init(_runtime: any): void;
    /**
     * Gets the runtime settings object
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - the runtime settings
     * @memberof @node-red/runtime_settings
     */
    getRuntimeSettings(opts: any): any;
    /**
     * Gets an individual user's settings object
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - the user settings
     * @memberof @node-red/runtime_settings
     */
    getUserSettings(opts: any): any;
    /**
     * Updates an individual user's settings object.
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.settings - the updates to the user settings
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - the user settings
     * @memberof @node-red/runtime_settings
     */
    updateUserSettings(opts: any): any;
    /**
     * Gets a list of a user's ssh keys
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - the user's ssh keys
     * @memberof @node-red/runtime_settings
     */
    getUserKeys(opts: any): any;
    /**
     * Gets a user's ssh public key
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {User} opts.id - the id of the key to return
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<String>} - the user's ssh public key
     * @memberof @node-red/runtime_settings
     */
    getUserKey(opts: any): any;
    /**
     * Generates a new ssh key pair
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {User} opts.name - the id of the key to return
     * @param {User} opts.password - (optional) the password for the key pair
     * @param {User} opts.comment - (option) a comment to associate with the key pair
     * @param {User} opts.size - (optional) the size of the key. Default: 2048
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<String>} - the id of the generated key
     * @memberof @node-red/runtime_settings
     */
    generateUserKey(opts: any): any;
    /**
     * Deletes a user's ssh key pair
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {User} opts.id - the id of the key to delete
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise} - resolves when deleted
     * @memberof @node-red/runtime_settings
     */
    removeUserKey(opts: any): any;
};
export default api;
