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
declare function init(_settings: any, _runtime: any): Promise<void>;
declare function listProjects(): Promise<any[]>;
declare function getProject(user: any, name: any): Promise<any>;
declare function deleteProject(user: any, name: any): Promise<any>;
declare function getFiles(user: any, project: any): any;
declare function stageFile(user: any, project: any, file: any): any;
declare function unstageFile(user: any, project: any, file: any): any;
declare function commit(user: any, project: any, options: any): any;
declare function getFileDiff(user: any, project: any, file: any, type: any): any;
declare function getCommits(user: any, project: any, options: any): any;
declare function getCommit(user: any, project: any, sha: any): any;
declare function getFile(user: any, project: any, filePath: any, sha: any): any;
declare function revertFile(user: any, project: any, filePath: any): any;
declare function push(user: any, project: any, remoteBranchName: any, setRemote: any): any;
declare function pull(user: any, project: any, remoteBranchName: any, setRemote: any, allowUnrelatedHistories: any): any;
declare function getStatus(user: any, project: any, includeRemote: any): any;
declare function resolveMerge(user: any, project: any, file: any, resolution: any): any;
declare function abortMerge(user: any, project: any): any;
declare function getBranches(user: any, project: any, isRemote: any): any;
declare function deleteBranch(user: any, project: any, branch: any, isRemote: any, force: any): any;
declare function setBranch(user: any, project: any, branchName: any, isCreate: any): any;
declare function getBranchStatus(user: any, project: any, branchName: any): any;
declare function getRemotes(user: any, project: any): any;
declare function addRemote(user: any, project: any, options: any): any;
declare function removeRemote(user: any, project: any, remote: any): any;
declare function updateRemote(user: any, project: any, remote: any, body: any): any;
declare function getActiveProject(user: any): any;
declare function createProject(user: any, metadata: any): Promise<any>;
declare function setActiveProject(user: any, projectName: any, clearContext?: any): Promise<any>;
declare function initialiseProject(user: any, project: any, data: any): any;
declare function updateProject(user: any, project: any, data: any): any;
declare function getFlows(): any;
declare function saveFlows(flows: any, user: any): any;
declare function getCredentials(): Promise<unknown>;
declare function saveCredentials(credentials: any): any;
declare function getFlowFilename(): string;
declare function getCredentialsFilename(): string;
declare const _default: {
    init: typeof init;
    listProjects: typeof listProjects;
    getActiveProject: typeof getActiveProject;
    setActiveProject: typeof setActiveProject;
    getProject: typeof getProject;
    deleteProject: typeof deleteProject;
    createProject: typeof createProject;
    initialiseProject: typeof initialiseProject;
    updateProject: typeof updateProject;
    getFiles: typeof getFiles;
    getFile: typeof getFile;
    revertFile: typeof revertFile;
    stageFile: typeof stageFile;
    unstageFile: typeof unstageFile;
    commit: typeof commit;
    getFileDiff: typeof getFileDiff;
    getCommits: typeof getCommits;
    getCommit: typeof getCommit;
    push: typeof push;
    pull: typeof pull;
    getStatus: typeof getStatus;
    resolveMerge: typeof resolveMerge;
    abortMerge: typeof abortMerge;
    getBranches: typeof getBranches;
    deleteBranch: typeof deleteBranch;
    setBranch: typeof setBranch;
    getBranchStatus: typeof getBranchStatus;
    getRemotes: typeof getRemotes;
    addRemote: typeof addRemote;
    removeRemote: typeof removeRemote;
    updateRemote: typeof updateRemote;
    getFlowFilename: typeof getFlowFilename;
    flowFileExists(): boolean;
    getCredentialsFilename: typeof getCredentialsFilename;
    getGlobalGitUser(): boolean;
    getFlows: typeof getFlows;
    saveFlows: typeof saveFlows;
    getCredentials: typeof getCredentials;
    saveCredentials: typeof saveCredentials;
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
export default _default;
