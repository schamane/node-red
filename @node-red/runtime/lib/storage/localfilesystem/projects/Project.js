"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable consistent-this */
/* eslint-disable no-prototype-builtins */
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
const fs_extra_1 = __importDefault(require("fs-extra"));
const node_path_1 = __importDefault(require("node:path"));
const index_js_1 = __importDefault(require("./git/index.js"));
const util_js_1 = __importDefault(require("../util.js"));
const defaultFileSet_js_1 = __importDefault(require("./defaultFileSet.js"));
const index_js_2 = __importDefault(require("./ssh/index.js"));
const util_1 = require("@node-red/util");
const authCache_js_1 = __importDefault(require("./git/authCache.js"));
let settings;
let runtime;
let projectsDir;
// TODO: DRY - red/api/editor/sshkeys !
function getSSHKeyUsername(userObj) {
    let username = '__default';
    if (userObj && userObj.username) {
        username = userObj.username;
    }
    return username;
}
function getUserGitSettings(user) {
    let username;
    if (!user) {
        username = '_';
    }
    else {
        username = user.username;
    }
    const userSettings = settings.getUserSettings(username) || {};
    return userSettings.git;
}
function getGitUser(user) {
    const gitSettings = getUserGitSettings(user);
    if (gitSettings) {
        return gitSettings.user;
    }
    return null;
}
function Project(path) {
    this.path = path;
    this.name = node_path_1.default.basename(path);
    this.paths = {};
    this.files = {};
    this.auth = { origin: {} };
    this.missingFiles = [];
    this.credentialSecret = null;
}
Project.prototype.load = function () {
    const project = this;
    const globalProjectSettings = settings.get('projects');
    // console.log(globalProjectSettings)
    let projectSettings = {};
    if (globalProjectSettings) {
        if (globalProjectSettings.projects.hasOwnProperty(this.name)) {
            projectSettings = globalProjectSettings.projects[this.name] || {};
        }
    }
    this.paths.root = projectSettings.rootPath || '';
    this.credentialSecret = projectSettings.credentialSecret;
    this.git = projectSettings.git || { user: {} };
    // this.paths.flowFile = fspath.join(this.path,"flow.json");
    // this.paths.credentialsFile = fspath.join(this.path,"flow_cred.json");
    const promises = [];
    return checkProjectFiles(project).then(function (missingFiles) {
        project.missingFiles = missingFiles;
        if (missingFiles.indexOf('package.json') === -1) {
            // We have a package.json in project.path+project.paths.root+"package.json"
            project.paths['package.json'] = node_path_1.default.join(project.paths.root, 'package.json');
            promises.push(fs_extra_1.default
                .readFile(node_path_1.default.join(project.path, project.paths['package.json']), 'utf8')
                .then(function (content) {
                try {
                    project.package = util_js_1.default.parseJSON(content);
                    if (project.package.hasOwnProperty('node-red')) {
                        if (project.package['node-red'].hasOwnProperty('settings')) {
                            project.paths.flowFile = node_path_1.default.join(project.paths.root, project.package['node-red'].settings.flowFile);
                            project.paths.credentialsFile = node_path_1.default.join(project.paths.root, project.package['node-red'].settings.credentialsFile);
                        }
                    }
                    else {
                        // TODO: package.json doesn't have a node-red section
                        //       is that a bad thing?
                    }
                }
                catch (err) {
                    // package.json isn't valid JSON... is a merge underway?
                    project.package = {};
                }
            })
                .catch((err) => {
                //
            })); //
            if (missingFiles.indexOf('README.md') === -1) {
                project.paths['README.md'] = node_path_1.default.join(project.paths.root, 'README.md');
                promises.push(fs_extra_1.default
                    .readFile(node_path_1.default.join(project.path, project.paths['README.md']), 'utf8')
                    .then(function (content) {
                    project.description = content;
                })
                    .catch((err) => {
                    //
                }));
            }
            else {
                project.description = '';
            }
        }
        else {
            project.package = {};
            project.description = '';
        }
        promises.push(project.loadRemotes().catch((err) => {
            //
        }));
        return Promise.all(promises).then(function () {
            return project;
        });
    });
};
Project.prototype.initialise = function (user, data) {
    const project = this;
    const files = Object.keys(defaultFileSet_js_1.default);
    const promises = [];
    if (data.hasOwnProperty('credentialSecret')) {
        const projects = settings.get('projects');
        projects.projects[project.name] = projects.projects[project.name] || {};
        projects.projects[project.name].credentialSecret = data.credentialSecret;
        promises.push(settings.set('projects', projects));
    }
    if (data.hasOwnProperty('files')) {
        if (data.files.hasOwnProperty('flow') && data.files.hasOwnProperty('credentials')) {
            project.files.flow = data.files.flow;
            project.files.credentials = data.files.credentials;
            const flowFilePath = node_path_1.default.join(project.path, project.files.flow);
            const credsFilePath = getCredentialsFilename(flowFilePath);
            promises.push(util_js_1.default.writeFile(flowFilePath, '[]'));
            promises.push(util_js_1.default.writeFile(credsFilePath, '{}'));
            files.push(project.files.flow);
            files.push(project.files.credentials);
        }
    }
    for (const file in defaultFileSet_js_1.default) {
        if (defaultFileSet_js_1.default.hasOwnProperty(file)) {
            const path = node_path_1.default.join(project.path, file);
            if (!fs_extra_1.default.existsSync(path)) {
                promises.push(util_js_1.default.writeFile(path, defaultFileSet_js_1.default[file](project)));
            }
        }
    }
    return Promise.all(promises)
        .then(function () {
        return index_js_1.default.stageFile(project.path, files);
    })
        .then(function () {
        return index_js_1.default.commit(project.path, 'Create project files', getGitUser(user));
    })
        .then(function () {
        return project.load();
    });
};
Project.prototype.loadRemotes = function () {
    const project = this;
    return index_js_1.default
        .getRemotes(project.path)
        .then(function (remotes) {
        project.remotes = remotes;
    })
        .then(function () {
        project.branches = {};
        return project.status();
    })
        .then(function () {
        if (project.remotes) {
            const allRemotes = Object.keys(project.remotes);
            let match = '';
            if (project.branches.remote) {
                allRemotes.forEach(function (remote) {
                    if (project.branches.remote.indexOf(remote) === 0 && match.length < remote.length) {
                        match = remote;
                    }
                });
                project.currentRemote = project.parseRemoteBranch(project.branches.remote).remote;
            }
        }
        else {
            delete project.currentRemote;
        }
    });
};
Project.prototype.parseRemoteBranch = function (remoteBranch) {
    if (!remoteBranch) {
        return {};
    }
    const project = this;
    const allRemotes = Object.keys(project.remotes);
    let match = '';
    allRemotes.forEach(function (remote) {
        if (remoteBranch.indexOf(remote) === 0 && match.length < remote.length) {
            match = remote;
        }
    });
    return {
        remote: match,
        branch: remoteBranch.substring(match.length + 1)
    };
};
Project.prototype.isEmpty = function () {
    return this.empty;
};
Project.prototype.isMerging = function () {
    return this.merging;
};
Project.prototype.update = async function (user, data) {
    let username;
    if (!user) {
        username = '_';
    }
    else {
        username = user.username;
    }
    const promises = [];
    const project = this;
    let saveSettings = false;
    let saveREADME = false;
    let savePackage = false;
    let flowFilesChanged = false;
    let credentialSecretChanged = false;
    let reloadProject = false;
    const globalProjectSettings = settings.get('projects');
    if (!globalProjectSettings.projects.hasOwnProperty(this.name)) {
        globalProjectSettings.projects[this.name] = {};
        saveSettings = true;
    }
    if (data.credentialSecret && data.credentialSecret !== this.credentialSecret) {
        const existingSecret = data.currentCredentialSecret;
        const isReset = data.resetCredentialSecret;
        const secret = data.credentialSecret;
        // console.log("updating credentialSecret");
        // console.log("request:");
        // console.log(JSON.stringify(data,"",4));
        // console.log(" this.credentialSecret",this.credentialSecret);
        // console.log(" this.info", this.info);
        if (!isReset && // not a reset
            this.credentialSecret && // key already set
            !this.credentialSecretInvalid && // key not invalid
            this.credentialSecret !== existingSecret) {
            // key doesn't match provided existing key
            const e = new Error('Cannot change credentialSecret without current key');
            e.code = 'missing_current_credential_key';
            throw e;
        }
        this.credentialSecret = secret;
        globalProjectSettings.projects[this.name].credentialSecret = project.credentialSecret;
        delete this.credentialSecretInvalid;
        saveSettings = true;
        credentialSecretChanged = true;
    }
    if (this.missingFiles.indexOf('package.json') !== -1) {
        if (!data.files || !data.files.package) {
            // Cannot update a project that doesn't have a known package.json
            throw new Error('Cannot update project with missing package.json');
        }
    }
    if (data.hasOwnProperty('files')) {
        this.package['node-red'] = this.package['node-red'] || { settings: {} };
        if (data.files.hasOwnProperty('package') &&
            (data.files.package !== node_path_1.default.join(this.paths.root, 'package.json') || !this.paths['package.json'])) {
            // We have a package file. It could be one that doesn't exist yet,
            // or it does exist and we need to load it.
            if (!/package\.json$/.test(data.files.package)) {
                return new Error('Invalid package file: ' + data.files.package);
            }
            const root = data.files.package.substring(0, data.files.package.length - 12);
            if (/^\.\./.test(node_path_1.default.relative(this.path, node_path_1.default.join(this.path, data.files.package)))) {
                return Promise.reject('Invalid package file: ' + data.files.package);
            }
            this.paths.root = root;
            this.paths['package.json'] = data.files.package;
            globalProjectSettings.projects[this.name].rootPath = root;
            saveSettings = true;
            // 1. check if it exists
            if (fs_extra_1.default.existsSync(node_path_1.default.join(this.path, this.paths['package.json']))) {
                // Load the existing one....
            }
            else {
                const newPackage = defaultFileSet_js_1.default['package.json'](this);
                fs_extra_1.default.writeFileSync(node_path_1.default.join(this.path, this.paths['package.json']), newPackage);
                this.package = JSON.parse(newPackage);
            }
            reloadProject = true;
            flowFilesChanged = true;
        }
        if (data.files.hasOwnProperty('flow') &&
            this.package['node-red'].settings.flowFile !== data.files.flow.substring(this.paths.root.length)) {
            if (/^\.\./.test(node_path_1.default.relative(this.path, node_path_1.default.join(this.path, data.files.flow)))) {
                return Promise.reject('Invalid flow file: ' + data.files.flow);
            }
            this.paths.flowFile = data.files.flow;
            this.package['node-red'].settings.flowFile = data.files.flow.substring(this.paths.root.length);
            savePackage = true;
            flowFilesChanged = true;
        }
        if (data.files.hasOwnProperty('credentials') &&
            this.package['node-red'].settings.credentialsFile !== data.files.credentials.substring(this.paths.root.length)) {
            if (/^\.\./.test(node_path_1.default.relative(this.path, node_path_1.default.join(this.path, data.files.credentials)))) {
                return Promise.reject('Invalid credentials file: ' + data.files.credentials);
            }
            this.paths.credentialsFile = data.files.credentials;
            this.package['node-red'].settings.credentialsFile = data.files.credentials.substring(this.paths.root.length);
            // Don't know if the credSecret is invalid or not so clear the flag
            delete this.credentialSecretInvalid;
            savePackage = true;
            flowFilesChanged = true;
        }
    }
    if (data.hasOwnProperty('description')) {
        saveREADME = true;
        this.description = data.description;
    }
    if (data.hasOwnProperty('dependencies')) {
        savePackage = true;
        this.package.dependencies = data.dependencies;
    }
    if (data.hasOwnProperty('summary')) {
        savePackage = true;
        this.package.description = data.summary;
    }
    if (data.hasOwnProperty('version')) {
        savePackage = true;
        this.package.version = data.version;
    }
    if (data.hasOwnProperty('git')) {
        if (data.git.hasOwnProperty('user')) {
            globalProjectSettings.projects[this.name].git = globalProjectSettings.projects[this.name].git || {};
            globalProjectSettings.projects[this.name].git.user = globalProjectSettings.projects[this.name].git.user || {};
            globalProjectSettings.projects[this.name].git.user[username] = {
                name: data.git.user.name,
                email: data.git.user.email
            };
            this.git.user[username] = {
                name: data.git.user.name,
                email: data.git.user.email
            };
            saveSettings = true;
        }
        if (data.git.hasOwnProperty('remotes')) {
            const remoteNames = Object.keys(data.git.remotes);
            let remotesChanged = false;
            let modifyRemotesPromise = Promise.resolve();
            remoteNames.forEach(function (name) {
                if (data.git.remotes[name].removed) {
                    remotesChanged = true;
                    modifyRemotesPromise = modifyRemotesPromise.then(function () {
                        index_js_1.default.removeRemote(project.path, name);
                    });
                }
                else {
                    if (data.git.remotes[name].url) {
                        remotesChanged = true;
                        modifyRemotesPromise = modifyRemotesPromise.then(function () {
                            index_js_1.default.addRemote(project.path, name, data.git.remotes[name]);
                        });
                    }
                    if (data.git.remotes[name].username && data.git.remotes[name].password) {
                        const url = data.git.remotes[name].url || project.remotes[name].fetch;
                        authCache_js_1.default.set(project.name, url, username, data.git.remotes[name]);
                    }
                }
            });
            if (remotesChanged) {
                modifyRemotesPromise = modifyRemotesPromise.then(function () {
                    return project.loadRemotes();
                });
                promises.push(modifyRemotesPromise.catch());
            }
        }
    }
    if (saveSettings) {
        promises.push(settings.set('projects', globalProjectSettings).catch());
    }
    const modifiedFiles = [];
    if (saveREADME) {
        promises.push(util_js_1.default.writeFile(node_path_1.default.join(this.path, this.paths['README.md']), this.description).catch());
        modifiedFiles.push('README.md');
    }
    if (savePackage) {
        promises.push(fs_extra_1.default
            .readFile(node_path_1.default.join(this.path, this.paths['package.json']), 'utf8')
            .then((content) => {
            let currentPackage = {};
            try {
                currentPackage = util_js_1.default.parseJSON(content);
            }
            catch (err) {
                //
            }
            this.package = Object.assign(currentPackage, this.package);
            return util_js_1.default.writeFile(node_path_1.default.join(project.path, this.paths['package.json']), JSON.stringify(this.package, undefined, 4));
        })
            .catch((err) => {
            //
        }));
        modifiedFiles.push('package.json');
    }
    return Promise.all(promises)
        .then(function (res) {
        const gitSettings = getUserGitSettings(user) || {};
        const workflowMode = (gitSettings.workflow || {}).mode || settings.editorTheme.projects.workflow.mode;
        if (workflowMode === 'auto') {
            return project.stageFile(modifiedFiles.map((f) => project.paths[f])).then(() => {
                return project.commit(user, { message: 'Update ' + modifiedFiles.join(', ') });
            });
        }
    })
        .then((res) => {
        if (reloadProject) {
            return this.load();
        }
    })
        .then(function () {
        return {
            flowFilesChanged,
            credentialSecretChanged
        };
    });
};
Project.prototype.getFiles = function () {
    return index_js_1.default.getFiles(this.path).catch(function (err) {
        if (/ambiguous argument/.test(err.message)) {
            return {};
        }
        throw err;
    });
};
Project.prototype.stageFile = function (file) {
    return index_js_1.default.stageFile(this.path, file);
};
Project.prototype.unstageFile = function (file) {
    return index_js_1.default.unstageFile(this.path, file);
};
Project.prototype.commit = function (user, options) {
    const self = this;
    return index_js_1.default.commit(this.path, options.message, getGitUser(user)).then(function () {
        if (self.merging) {
            self.merging = false;
            return;
        }
    });
};
Project.prototype.getFileDiff = function (file, type) {
    return index_js_1.default.getFileDiff(this.path, file, type);
};
Project.prototype.getCommits = function (options) {
    return index_js_1.default.getCommits(this.path, options).catch(function (err) {
        if (/bad default revision/i.test(err.message) ||
            /ambiguous argument/i.test(err.message) ||
            /does not have any commits yet/i.test(err.message)) {
            return {
                count: 0,
                commits: [],
                total: 0
            };
        }
        throw err;
    });
};
Project.prototype.getCommit = function (sha) {
    return index_js_1.default.getCommit(this.path, sha);
};
Project.prototype.getFile = function (filePath, treeish) {
    if (treeish !== '_') {
        return index_js_1.default.getFile(this.path, filePath, treeish);
    }
    const fullPath = node_path_1.default.join(this.path, filePath);
    if (/^\.\./.test(node_path_1.default.relative(this.path, fullPath))) {
        throw new Error('Invalid file name');
    }
    return fs_extra_1.default.readFile(node_path_1.default.join(this.path, filePath), 'utf8');
};
Project.prototype.revertFile = function (filePath) {
    const self = this;
    return index_js_1.default.revertFile(this.path, filePath).then(function () {
        return self.load();
    });
};
Project.prototype.status = function (user, includeRemote) {
    const self = this;
    let fetchPromise;
    if (this.remotes && includeRemote) {
        fetchPromise = index_js_1.default.getRemoteBranch(self.path).then(function (remoteBranch) {
            if (remoteBranch) {
                const allRemotes = Object.keys(self.remotes);
                let match = '';
                allRemotes.forEach(function (remote) {
                    if (remoteBranch.indexOf(remote) === 0 && match.length < remote.length) {
                        match = remote;
                    }
                });
                return self.fetch(user, match);
            }
        });
    }
    else {
        fetchPromise = Promise.resolve();
    }
    const completeStatus = function (fetchError) {
        const promises = [index_js_1.default.getStatus(self.path), fs_extra_1.default.exists(node_path_1.default.join(self.path, '.git', 'MERGE_HEAD'), undefined)];
        return Promise.all(promises)
            .then(function (results) {
            const result = results[0];
            if (!result) {
                return result;
            }
            if (results[1]) {
                result.merging = true;
                if (!self.merging) {
                    self.merging = true;
                    util_1.events.emit('runtime-event', {
                        id: 'runtime-state',
                        payload: {
                            type: 'warning',
                            error: 'git_merge_conflict',
                            project: self.name,
                            text: 'notification.warnings.git_merge_conflict'
                        },
                        retain: true
                    });
                }
            }
            else {
                self.merging = false;
            }
            self.branches.local = result.branches.local;
            self.branches.remote = result.branches.remote;
            if (fetchError && !/ambiguous argument/.test(fetchError.message)) {
                result.branches.remoteError = {
                    remote: fetchError.remote,
                    code: fetchError.code
                };
            }
            if (result.commits.total === 0 && Object.keys(result.files).length === 0) {
                if (!self.empty) {
                    util_1.events.emit('runtime-event', {
                        id: 'runtime-state',
                        payload: {
                            type: 'warning',
                            error: 'project_empty',
                            text: 'notification.warnings.project_empty'
                        },
                        retain: true
                    });
                }
                self.empty = true;
            }
            else {
                if (self.empty) {
                    if (self.paths.flowFile) {
                        util_1.events.emit('runtime-event', { id: 'runtime-state', retain: true });
                    }
                    else {
                        util_1.events.emit('runtime-event', {
                            id: 'runtime-state',
                            payload: {
                                type: 'warning',
                                error: 'missing_flow_file',
                                text: 'notification.warnings.missing_flow_file'
                            },
                            retain: true
                        });
                    }
                }
                delete self.empty;
            }
            return result;
        })
            .catch(function (err) {
            if (/ambiguous argument/.test(err.message)) {
                return {
                    files: {},
                    commits: { total: 0 },
                    branches: {}
                };
            }
            throw err;
        });
    };
    return fetchPromise.then(completeStatus).catch(function (e) {
        // if (e.code !== 'git_auth_failed') {
        //     console.log("Fetch failed");
        //     console.log(e);
        // }
        return completeStatus(e);
    });
};
Project.prototype.push = function (user, remoteBranchName, setRemote) {
    let username;
    if (!user) {
        username = '_';
    }
    else {
        username = user.username;
    }
    const remote = this.parseRemoteBranch(remoteBranchName || this.branches.remote);
    return index_js_1.default.push(this.path, remote.remote || this.currentRemote, remote.branch, setRemote, authCache_js_1.default.get(this.name, this.remotes[remote.remote || this.currentRemote].fetch, username));
};
Project.prototype.pull = function (user, remoteBranchName, setRemote, allowUnrelatedHistories) {
    let username;
    if (!user) {
        username = '_';
    }
    else {
        username = user.username;
    }
    const self = this;
    if (setRemote) {
        return index_js_1.default.setUpstream(this.path, remoteBranchName).then(function () {
            self.currentRemote = self.parseRemoteBranch(remoteBranchName).remote;
            return index_js_1.default.pull(self.path, null, null, allowUnrelatedHistories, authCache_js_1.default.get(self.name, self.remotes[self.currentRemote].fetch, username), getGitUser(user));
        });
    }
    const remote = this.parseRemoteBranch(remoteBranchName);
    return index_js_1.default.pull(this.path, remote.remote, remote.branch, allowUnrelatedHistories, authCache_js_1.default.get(this.name, this.remotes[remote.remote || self.currentRemote].fetch, username), getGitUser(user));
};
Project.prototype.resolveMerge = function (file, resolutions) {
    const filePath = node_path_1.default.join(this.path, file);
    if (/^\.\./.test(node_path_1.default.relative(this.path, filePath))) {
        throw new Error('Invalid file name');
    }
    const self = this;
    if (typeof resolutions === 'string') {
        return util_js_1.default.writeFile(filePath, resolutions).then(function () {
            return self.stageFile(file);
        });
    }
    return fs_extra_1.default.readFile(filePath, 'utf8').then(function (content) {
        const lines = content.split('\n');
        const result = [];
        let ignoreBlock = false;
        let currentBlock;
        for (let i = 1; i <= lines.length; i++) {
            if (resolutions.hasOwnProperty(i)) {
                currentBlock = resolutions[i];
                if (currentBlock.selection === 'A') {
                    ignoreBlock = false;
                }
                else {
                    ignoreBlock = true;
                }
                continue;
            }
            if (currentBlock) {
                if (currentBlock.separator === i) {
                    if (currentBlock.selection === 'A') {
                        ignoreBlock = true;
                    }
                    else {
                        ignoreBlock = false;
                    }
                    continue;
                }
                else if (currentBlock.changeEnd === i) {
                    currentBlock = null;
                    continue;
                }
                else if (ignoreBlock) {
                    continue;
                }
            }
            result.push(lines[i - 1]);
        }
        const finalResult = result.join('\n');
        return util_js_1.default.writeFile(filePath, finalResult).then(function () {
            return self.stageFile(file);
        });
    });
};
Project.prototype.abortMerge = function () {
    const self = this;
    return index_js_1.default.abortMerge(this.path).then(function () {
        self.merging = false;
    });
};
Project.prototype.getBranches = function (user, isRemote) {
    const self = this;
    let fetchPromise;
    if (isRemote) {
        fetchPromise = self.fetch(user);
    }
    else {
        fetchPromise = Promise.resolve();
    }
    return fetchPromise.then(function () {
        return index_js_1.default.getBranches(self.path, isRemote);
    });
};
Project.prototype.deleteBranch = function (user, branch, isRemote, force) {
    // TODO: isRemote==true support
    // TODO: make sure we don't try to delete active branch
    return index_js_1.default.deleteBranch(this.path, branch, isRemote, force);
};
Project.prototype.fetch = function (user, remoteName) {
    let username;
    if (!user) {
        username = '_';
    }
    else {
        username = user.username;
    }
    const project = this;
    if (remoteName) {
        return index_js_1.default
            .fetch(project.path, remoteName, authCache_js_1.default.get(project.name, project.remotes[remoteName].fetch, username))
            .catch(function (err) {
            err.remote = remoteName;
            throw err;
        });
    }
    const remotes = Object.keys(this.remotes);
    let promise = Promise.resolve();
    remotes.forEach(function (remote) {
        promise = promise
            .then(function () {
            return index_js_1.default.fetch(project.path, remote, authCache_js_1.default.get(project.name, project.remotes[remote].fetch, username));
        })
            .catch(function (err) {
            if (!err.remote) {
                err.remote = remote;
            }
            throw err;
        });
    });
    return promise;
};
Project.prototype.setBranch = function (branchName, isCreate) {
    const self = this;
    return index_js_1.default.checkoutBranch(this.path, branchName, isCreate).then(function () {
        return self.load();
    });
};
Project.prototype.getBranchStatus = function (branchName) {
    return index_js_1.default.getBranchStatus(this.path, branchName);
};
Project.prototype.getRemotes = function (user) {
    return index_js_1.default.getRemotes(this.path).then(function (remotes) {
        const result = [];
        for (const name in remotes) {
            if (remotes.hasOwnProperty(name)) {
                remotes[name].name = name;
                result.push(remotes[name]);
            }
        }
        return { remotes: result };
    });
};
Project.prototype.addRemote = function (user, remote, options) {
    const project = this;
    return index_js_1.default.addRemote(this.path, remote, options).then(function () {
        return project.loadRemotes();
    });
};
Project.prototype.updateRemote = function (user, remote, options) {
    let username;
    if (!user) {
        username = '_';
    }
    else {
        username = user.username;
    }
    if (options.auth) {
        const url = this.remotes[remote].fetch;
        if (options.auth.keyFile) {
            options.auth.key_path = index_js_2.default.getPrivateKeyPath(getSSHKeyUsername(user), options.auth.keyFile);
        }
        authCache_js_1.default.set(this.name, url, username, options.auth);
    }
    return Promise.resolve();
};
Project.prototype.removeRemote = function (user, remote) {
    // TODO: if this was the last remote using this url, then remove the authCache
    // details.
    const project = this;
    return index_js_1.default.removeRemote(this.path, remote).then(function () {
        return project.loadRemotes();
    });
};
Project.prototype.getFlowFile = function () {
    // console.log("Project.getFlowFile = ",this.paths.flowFile);
    if (this.paths.flowFile) {
        return node_path_1.default.join(this.path, this.paths.flowFile);
    }
    return null;
};
Project.prototype.getFlowFileBackup = function () {
    const flowFile = this.getFlowFile();
    if (flowFile) {
        return getBackupFilename(flowFile);
    }
    return null;
};
Project.prototype.getCredentialsFile = function () {
    // console.log("Project.getCredentialsFile = ",this.paths.credentialsFile);
    if (this.paths.credentialsFile) {
        return node_path_1.default.join(this.path, this.paths.credentialsFile);
    }
    return this.paths.credentialsFile;
};
Project.prototype.getCredentialsFileBackup = function () {
    return getBackupFilename(this.getCredentialsFile());
};
Project.prototype.export = function () {
    return {
        name: this.name,
        summary: this.package.description,
        version: this.package.version,
        description: this.description,
        dependencies: this.package.dependencies || {},
        empty: this.empty,
        settings: {
            credentialsEncrypted: typeof this.credentialSecret === 'string' && this.credentialSecret.length > 0,
            credentialSecretInvalid: this.credentialSecretInvalid
        },
        files: {
            package: this.paths['package.json'],
            flow: this.paths.flowFile,
            credentials: this.paths.credentialsFile
        },
        git: {
            remotes: this.remotes,
            branches: this.branches
        }
    };
};
function getCredentialsFilename(filename) {
    filename = filename || 'undefined';
    // TODO: DRY - ./index.js
    const ffDir = node_path_1.default.dirname(filename);
    const ffExt = node_path_1.default.extname(filename);
    const ffBase = node_path_1.default.basename(filename, ffExt);
    return node_path_1.default.join(ffDir, ffBase + '_cred' + ffExt);
}
function getBackupFilename(filename) {
    // TODO: DRY - ./index.js
    filename = filename || 'undefined';
    const ffName = node_path_1.default.basename(filename);
    const ffDir = node_path_1.default.dirname(filename);
    return node_path_1.default.join(ffDir, '.' + ffName + '.backup');
}
function checkProjectExists(projectPath) {
    return fs_extra_1.default.pathExists(projectPath).then(function (exists) {
        if (!exists) {
            const e = new Error('Project not found');
            e.code = 'project_not_found';
            const name = node_path_1.default.basename(projectPath);
            e.project = name;
            throw e;
        }
    });
}
function createDefaultProject(user, project) {
    const projectPath = node_path_1.default.join(projectsDir, project.name);
    // Create a basic skeleton of a project
    return index_js_1.default.initRepo(projectPath).then(function () {
        const promises = [];
        const files = Object.keys(defaultFileSet_js_1.default);
        if (project.files) {
            if (project.files.flow && !/\.\./.test(project.files.flow)) {
                let flowFilePath;
                let credsFilePath;
                if (project.migrateFiles) {
                    const baseFlowFileName = project.files.flow || node_path_1.default.basename(project.files.oldFlow);
                    const baseCredentialFileName = project.files.credentials || node_path_1.default.basename(project.files.oldCredentials);
                    files.push(baseFlowFileName);
                    files.push(baseCredentialFileName);
                    flowFilePath = node_path_1.default.join(projectPath, baseFlowFileName);
                    credsFilePath = node_path_1.default.join(projectPath, baseCredentialFileName);
                    if (fs_extra_1.default.existsSync(project.files.oldFlow)) {
                        util_1.log.trace('Migrating ' + project.files.oldFlow + ' to ' + flowFilePath);
                        promises.push(fs_extra_1.default.copy(project.files.oldFlow, flowFilePath));
                    }
                    else {
                        util_1.log.trace(project.files.oldFlow + ' does not exist - creating blank file');
                        promises.push(util_js_1.default.writeFile(flowFilePath, '[]'));
                    }
                    util_1.log.trace('Migrating ' + project.files.oldCredentials + ' to ' + credsFilePath);
                    runtime.nodes.setCredentialSecret(project.credentialSecret);
                    promises.push(runtime.nodes.exportCredentials().then(function (creds) {
                        let credentialData;
                        if (settings.flowFilePretty) {
                            credentialData = JSON.stringify(creds, null, 4);
                        }
                        else {
                            credentialData = JSON.stringify(creds);
                        }
                        return util_js_1.default.writeFile(credsFilePath, credentialData);
                    }));
                    delete project.migrateFiles;
                    project.files.flow = baseFlowFileName;
                    project.files.credentials = baseCredentialFileName;
                }
                else {
                    project.files.credentials = project.files.credentials || getCredentialsFilename(project.files.flow);
                    files.push(project.files.flow);
                    files.push(project.files.credentials);
                    flowFilePath = node_path_1.default.join(projectPath, project.files.flow);
                    credsFilePath = getCredentialsFilename(flowFilePath);
                    promises.push(util_js_1.default.writeFile(flowFilePath, '[]'));
                    promises.push(util_js_1.default.writeFile(credsFilePath, '{}'));
                }
            }
        }
        for (const file in defaultFileSet_js_1.default) {
            if (defaultFileSet_js_1.default.hasOwnProperty(file)) {
                promises.push(util_js_1.default.writeFile(node_path_1.default.join(projectPath, file), defaultFileSet_js_1.default[file](project)));
            }
        }
        return Promise.all(promises)
            .then(function () {
            return index_js_1.default.stageFile(projectPath, files);
        })
            .then(function () {
            return index_js_1.default.commit(projectPath, 'Create project', getGitUser(user));
        });
    });
}
function checkProjectFiles(project) {
    const promises = [];
    const missing = [];
    for (const file in defaultFileSet_js_1.default) {
        if (defaultFileSet_js_1.default.hasOwnProperty(file)) {
            (function (f) {
                promises.push(fs_extra_1.default.stat(node_path_1.default.join(project.path, project.paths.root, f)).catch((err) => {
                    missing.push(f);
                }));
            })(file);
        }
    }
    return Promise.all(promises).then(() => missing);
}
function createProject(user, metadata) {
    let username;
    if (!user) {
        username = '_';
    }
    else {
        username = user.username;
    }
    if (!metadata.path) {
        throw new Error('Project missing path property');
    }
    if (!metadata.name) {
        throw new Error('Project missing name property');
    }
    const project = metadata.name;
    const projectPath = metadata.path;
    return new Promise(function (resolve, reject) {
        fs_extra_1.default.stat(projectPath, function (err, stat) {
            if (!err) {
                const e = new Error('NLS: Project already exists');
                e.code = 'project_exists';
                return reject(e);
            }
            fs_extra_1.default.ensureDir(projectPath)
                .then(function () {
                let projects = settings.get('projects');
                if (!projects) {
                    projects = {
                        projects: {}
                    };
                }
                projects.projects[project] = {};
                if (metadata.hasOwnProperty('credentialSecret')) {
                    if (metadata.credentialSecret === '') {
                        metadata.credentialSecret = false;
                    }
                    projects.projects[project].credentialSecret = metadata.credentialSecret;
                }
                return settings.set('projects', projects);
            })
                .then(function () {
                if (metadata.git && metadata.git.remotes && metadata.git.remotes.origin) {
                    const originRemote = metadata.git.remotes.origin;
                    let auth;
                    if (originRemote.hasOwnProperty('username') && originRemote.hasOwnProperty('password')) {
                        authCache_js_1.default.set(project, originRemote.url, username, {
                            // TODO: hardcoded remote name
                            username: originRemote.username,
                            password: originRemote.password
                        });
                        auth = authCache_js_1.default.get(project, originRemote.url, username);
                    }
                    else if (originRemote.hasOwnProperty('keyFile') && originRemote.hasOwnProperty('passphrase')) {
                        authCache_js_1.default.set(project, originRemote.url, username, {
                            // TODO: hardcoded remote name
                            key_path: index_js_2.default.getPrivateKeyPath(getSSHKeyUsername(user), originRemote.keyFile),
                            passphrase: originRemote.passphrase
                        });
                        auth = authCache_js_1.default.get(project, originRemote.url, username);
                    }
                    return index_js_1.default.clone(originRemote, auth, projectPath);
                }
                return createDefaultProject(user, metadata);
            })
                .then(function () {
                resolve(loadProject(projectPath));
            })
                .catch(function (errPath) {
                fs_extra_1.default.remove(projectPath, function () {
                    reject(errPath);
                });
            });
        });
    });
}
function deleteProject(user, projectPath) {
    return checkProjectExists(projectPath).then(function () {
        return fs_extra_1.default.remove(projectPath).then(function () {
            const name = node_path_1.default.basename(projectPath);
            const projects = settings.get('projects');
            delete projects.projects[name];
            return settings.set('projects', projects);
        });
    });
}
function loadProject(projectPath) {
    return checkProjectExists(projectPath).then(function () {
        const project = new Project(projectPath);
        return project.load();
    });
}
function init(_settings, _runtime) {
    settings = _settings;
    runtime = _runtime;
    projectsDir = node_path_1.default.resolve(node_path_1.default.join(settings.userDir, 'projects'));
    if (settings.editorTheme.projects.path) {
        projectsDir = settings.editorTheme.projects.path;
    }
    authCache_js_1.default.init();
}
exports.default = {
    init,
    load: loadProject,
    create: createProject,
    delete: deleteProject
};
//# sourceMappingURL=project.js.map