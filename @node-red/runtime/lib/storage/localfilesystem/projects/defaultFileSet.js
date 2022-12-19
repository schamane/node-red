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
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("@node-red/util");
exports.default = {
    'package.json'(project) {
        const thisPackage = {
            name: project.name,
            description: project.summary || util_1.i18n._('storage.localfilesystem.projects.summary'),
            version: '0.0.1',
            dependencies: {},
            'node-red': {
                settings: {}
            }
        };
        if (project.files) {
            if (project.files.flow) {
                thisPackage['node-red'].settings.flowFile = project.files.flow;
                thisPackage['node-red'].settings.credentialsFile = project.files.credentials;
            }
        }
        return JSON.stringify(thisPackage, undefined, 4);
    },
    'README.md'(project) {
        let content = project.name + '\n' + '='.repeat(project.name.length) + '\n\n';
        if (project.summary) {
            content += project.summary + '\n\n';
        }
        content += util_1.i18n._('storage.localfilesystem.projects.readme');
        return content;
    },
    '.gitignore'() {
        return '*.backup';
    }
};
//# sourceMappingURL=defaultFileSet.js.map