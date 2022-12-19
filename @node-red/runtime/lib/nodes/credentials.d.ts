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
     * Sets the credentials from storage.
     */
    load(credentials: any): Promise<void>;
    /**
     * Adds a set of credentials for the given node id.
     * @param id the node id for the credentials
     * @param creds an object of credential key/value pairs
     * @return a promise for backwards compatibility TODO: can this be removed?
     */
    add(id: any, creds: any): void;
    /**
     * Gets the credentials for the given node id.
     * @param id the node id for the credentials
     * @return the credentials
     */
    get(id: any): any;
    /**
     * Deletes the credentials for the given node id.
     * @param id the node id for the credentials
     * @return a promise for the saving of credentials to storage
     */
    delete(id: any): void;
    clear(): void;
    /**
     * Deletes any credentials for nodes that no longer exist
     * @param config a flow config
     * @return a promise for the saving of credentials to storage
     */
    clean(config: any): void;
    /**
     * Registers a node credential definition.
     * @param type the node type
     * @param definition the credential definition
     */
    register(type: any, definition: any): void;
    /**
     * Extracts and stores any credential updates in the provided node.
     * The provided node may have a .credentials property that contains
     * new credentials for the node.
     * This function loops through the credentials in the definition for
     * the node-type and applies any of the updates provided in the node.
     *
     * This function does not save the credentials to disk as it is expected
     * to be called multiple times when a new flow is deployed.
     *
     * @param node the node to extract credentials from
     */
    extract(node: any): void;
    /**
     * Gets the credential definition for the given node type
     * @param type the node type
     * @return the credential definition
     */
    getDefinition(type: any): any;
    dirty(): boolean;
    setKey(key: any): void;
    getKeyType(): any;
    export(): any;
};
export default api;
