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
export declare const localfilesystem: {
    init(_settings: any, runtime: any): Promise<any>;
    getFlows: () => any;
    saveFlows: (flows: any, user: any) => any;
    getCredentials: () => Promise<unknown>;
    saveCredentials: (credentials: any) => any;
    getSettings: () => Promise<unknown>;
    saveSettings: (newSettings: any) => Promise<void> | Promise<any[]>;
    getSessions: () => Promise<unknown>;
    saveSessions: (sessions: any) => any;
    getLibraryEntry: (type: any, path: any) => any;
    saveLibraryEntry: (type: any, path: any, meta: any, body: any) => Promise<void>;
    projects: {
        init: (_settings: any, _runtime: any) => Promise<void>;
        listProjects: () => Promise<any[]>;
        getActiveProject: (user: any) => any;
        setActiveProject: (user: any, projectName: any, clearContext?: any) => Promise<any>;
        getProject: (user: any, name: any) => Promise<any>;
        deleteProject: (user: any, name: any) => Promise<any>;
        createProject: (user: any, metadata: any) => Promise<any>;
        initialiseProject: (user: any, project: any, data: any) => any;
        updateProject: (user: any, project: any, data: any) => any;
        getFiles: (user: any, project: any) => any;
        getFile: (user: any, project: any, filePath: any, sha: any) => any;
        revertFile: (user: any, project: any, filePath: any) => any;
        stageFile: (user: any, project: any, file: any) => any;
        unstageFile: (user: any, project: any, file: any) => any;
        commit: (user: any, project: any, options: any) => any;
        getFileDiff: (user: any, project: any, file: any, type: any) => any;
        getCommits: (user: any, project: any, options: any) => any;
        getCommit: (user: any, project: any, sha: any) => any;
        push: (user: any, project: any, remoteBranchName: any, setRemote: any) => any;
        pull: (user: any, project: any, remoteBranchName: any, setRemote: any, allowUnrelatedHistories: any) => any;
        getStatus: (user: any, project: any, includeRemote: any) => any;
        resolveMerge: (user: any, project: any, file: any, resolution: any) => any;
        abortMerge: (user: any, project: any) => any;
        getBranches: (user: any, project: any, isRemote: any) => any;
        deleteBranch: (user: any, project: any, branch: any, isRemote: any, force: any) => any;
        setBranch: (user: any, project: any, branchName: any, isCreate: any) => any;
        getBranchStatus: (user: any, project: any, branchName: any) => any;
        getRemotes: (user: any, project: any) => any;
        addRemote: (user: any, project: any, options: any) => any;
        removeRemote: (user: any, project: any, remote: any) => any;
        updateRemote: (user: any, project: any, remote: any, body: any) => any;
        getFlowFilename: () => string;
        flowFileExists(): boolean;
        getCredentialsFilename: () => string;
        getGlobalGitUser(): boolean;
        getFlows: () => any;
        saveFlows: (flows: any, user: any) => any;
        getCredentials: () => Promise<unknown>;
        saveCredentials: (credentials: any) => any;
        ssh: {
            init: (_settings: any) => Promise<void>;
            listSSHKeys: (username: any) => Promise<any[] | {
                name: any;
            }[]>;
            getSSHKey: (username: any, name: any) => Promise<any>;
            getPrivateKeyPath: (username: any, name: any) => string;
            generateSSHKey: (username: any, options: any) => Promise<any>;
            deleteSSHKey: (username: any, name: any) => Promise<[void, void]>;
        };
    };
};
