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
declare function getStatus(localRepo: any): Promise<{
    files: any;
    commits: any;
    branches: any;
    merging: any;
}>;
declare function getRemotes(cwd: any): Promise<any>;
declare function getBranches(cwd: any, remote: any): Promise<{
    branches: any[];
}>;
declare function getBranchStatus(cwd: any, remoteBranch: any): Promise<{
    commits: {
        ahead: number;
        behind: number;
    };
}>;
declare function addRemote(cwd: any, name: any, options: any): Promise<any>;
declare function removeRemote(cwd: any, name: any): Promise<any>;
declare const _default: {
    init(_settings: any): Promise<unknown>;
    initRepo(cwd: any): Promise<any>;
    setUpstream(cwd: any, remoteBranch: any): Promise<any>;
    pull(cwd: any, remote: any, branch: any, allowUnrelatedHistories: any, auth: any, gitUser: any): any;
    push(cwd: any, remote: any, branch: any, setUpstream: any, auth: any): any;
    clone(remote: any, auth: any, cwd: any): Promise<any>;
    getStatus: typeof getStatus;
    getFile(cwd: any, filePath: any, treeish: any): Promise<any>;
    getFiles(cwd: any): Promise<any>;
    revertFile(cwd: any, filePath: any): Promise<any>;
    stageFile(cwd: any, file: any): Promise<any>;
    unstageFile(cwd: any, file: any): Promise<any>;
    commit(cwd: any, message: any, gitUser: any): Promise<any>;
    getFileDiff(cwd: any, file: any, type: any): Promise<any>;
    fetch(cwd: any, remote: any, auth: any): Promise<any>;
    getCommits(cwd: any, options: any): Promise<{
        count: any;
        commits: any;
        before: any;
        total: number;
    }>;
    getCommit(cwd: any, sha: any): Promise<any>;
    abortMerge(cwd: any): Promise<any>;
    getRemotes: typeof getRemotes;
    getRemoteBranch(cwd: any): Promise<any>;
    getBranches: typeof getBranches;
    checkoutBranch(cwd: any, branchName: any, isCreate: any): Promise<any>;
    deleteBranch(cwd: any, branchName: any, isRemote: any, force: any): Promise<any>;
    getBranchStatus: typeof getBranchStatus;
    addRemote: typeof addRemote;
    removeRemote: typeof removeRemote;
};
export default _default;
