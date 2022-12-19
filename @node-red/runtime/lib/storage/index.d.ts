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
declare const storageModuleInterface: {
    projects: any;
    sshkeys: any;
    init(_runtime: any): Promise<any>;
    getFlows(): any;
    saveFlows(config: any, user: any): any;
    saveCredentials(credentials: any): any;
    getSettings(): any;
    saveSettings(settings: any): Promise<any>;
    getSessions(): any;
    saveSessions(sessions: any): any;
    getLibraryEntry(type: any, path: any): any;
    saveLibraryEntry(type: any, path: any, meta: any, body: any): any;
    getAllFlows(): any;
    getFlow(fn: any): any;
    saveFlow(fn: any, data: any): any;
};
export default storageModuleInterface;
