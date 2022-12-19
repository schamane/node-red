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
declare function getLibraryEntry(type: any, path: any): any;
declare const _default: {
    init(_settings: any): Promise<void>;
    getLibraryEntry: typeof getLibraryEntry;
    saveLibraryEntry(type: any, path: any, meta: any, body: any): Promise<void>;
};
export default _default;
