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
export declare const persistentSettings: {
    init(settings: any): void;
    load(_storage: any): any;
    get(prop: any): any;
    set(prop: any, value: any): any;
    delete(prop: any): any;
    available(): boolean;
    reset(): void;
    registerNodeSettings(type: any, opts: any): void;
    exportNodeSettings(safeSettings: any): any;
    enableNodeSettings(types: any): void;
    disableNodeSettings(types: any): void;
    getUserSettings(username: any): any;
    setUserSettings(username: any, settings: any): any;
    runtimeMetricInterval: any;
    version: any;
    UNSUPPORTED_VERSION: any;
    externalModules: any;
    settingsFile: any;
    httpRoot: any;
    readOnly: any;
    httpStatic: any;
    autoInstallModulesRetry: any;
};
