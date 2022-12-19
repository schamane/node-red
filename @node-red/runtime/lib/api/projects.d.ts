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
    available(opts: any): boolean;
    /**
     * List projects known to the runtime
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.req - the request to log (optional)
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    listProjects(opts: any): any;
    /**
     * Create a new project
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.project - the project information
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    createProject(opts: any): any;
    /**
     * Initialises an empty project
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project to initialise
     * @param {Object} opts.project - the project information
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    initialiseProject(opts: any): any;
    /**
     * Gets the active project
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - the active project
     * @memberof @node-red/runtime_projects
     */
    getActiveProject(opts: any): any;
    /**
     *
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project to activate
     * @param {boolean} opts.clearContext - whether to clear context
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    setActiveProject(opts: any): any;
    /**
     * Gets a projects metadata
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project to get
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - the project metadata
     * @memberof @node-red/runtime_projects
     */
    getProject(opts: any): any;
    /**
     * Updates the metadata of an existing project
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project to update
     * @param {Object} opts.project - the project information
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    updateProject(opts: any): any;
    /**
     * Deletes a project
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project to update
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    deleteProject(opts: any): any;
    /**
     * Gets current git status of a project
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {Boolean} opts.remote - whether to include status of remote repos
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - the project status
     * @memberof @node-red/runtime_projects
     */
    getStatus(opts: any): any;
    /**
     * Get a list of local branches
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {Boolean} opts.remote - whether to return remote branches (true) or local (false)
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - a list of the local branches
     * @memberof @node-red/runtime_projects
     */
    getBranches(opts: any): any;
    /**
     * Gets the status of a branch
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String} opts.branch - the name of the branch
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - the status of the branch
     * @memberof @node-red/runtime_projects
     */
    getBranchStatus(opts: any): any;
    /**
     * Sets the current local branch
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String} opts.branch - the name of the branch
     * @param {Boolean} opts.create - whether to create the branch if it doesn't exist
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    setBranch(opts: any): any;
    /**
     * Deletes a branch
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String} opts.branch - the name of the branch
     * @param {Boolean} opts.force - whether to force delete
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    deleteBranch(opts: any): any;
    /**
     * Commits the current staged files
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String} opts.message - the message to associate with the commit
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    commit(opts: any): any;
    /**
     * Gets the details of a single commit
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String} opts.sha - the sha of the commit to return
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - the commit details
     * @memberof @node-red/runtime_projects
     */
    getCommit(opts: any): any;
    /**
     * Gets the commit history of the project
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String} opts.limit - limit how many to return
     * @param {String} opts.before - id of the commit to work back from
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Array>} - an array of commits
     * @memberof @node-red/runtime_projects
     */
    getCommits(opts: any): any;
    /**
     * Abort an in-progress merge
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    abortMerge(opts: any): any;
    /**
     * Resolves a merge conflict
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String} opts.path - the path of the file being merged
     * @param {String} opts.resolutions - how to resolve the merge conflict
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    resolveMerge(opts: any): any;
    /**
     * Gets a listing of the files in the project
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - the file listing
     * @memberof @node-red/runtime_projects
     */
    getFiles(opts: any): any;
    /**
     * Gets the contents of a file
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String} opts.path - the path of the file
     * @param {String} opts.tree - the version control tree to use
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<String>} - the content of the file
     * @memberof @node-red/runtime_projects
     */
    getFile(opts: any): any;
    /**
     *
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String|Array} opts.path - the path of the file, or an array of paths
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    stageFile(opts: any): any;
    /**
     *
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String} opts.path - the path of the file. If not set, all staged files are unstaged
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    unstageFile(opts: any): any;
    /**
     * Reverts changes to a file back to its commited version
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String} opts.path - the path of the file
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    revertFile(opts: any): any;
    /**
     * Get the diff of a file
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String} opts.path - the path of the file
     * @param {String} opts.type - the type of diff
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - the requested diff
     * @memberof @node-red/runtime_projects
     */
    getFileDiff(opts: any): any;
    /**
     * Gets a list of the project remotes
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - a list of project remotes
     * @memberof @node-red/runtime_projects
     */
    getRemotes(opts: any): any;
    /**
     *
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {Object} opts.remote - the remote metadata
     * @param {String} opts.remote.name - the name of the remote
     * @param {String} opts.remote.url - the url of the remote
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    addRemote(opts: any): any;
    /**
     * Remove a project remote
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String} opts.remote - the name of the remote
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    removeRemote(opts: any): any;
    /**
     *
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {Object} opts.remote - the remote metadata
     * @param {String} opts.remote.name - the name of the remote
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    updateRemote(opts: any): any;
    /**
     * Pull changes from the remote
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.remote - the remote to pull
     * @param {Boolean} opts.track - whether to track this remote
     * @param {Boolean} opts.allowUnrelatedHistories -
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    pull(opts: any): any;
    /**
     * Push changes to a remote
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {String} opts.id - the id of the project
     * @param {String} opts.remote - the name of the remote
     * @param {String} opts.track - whether to set the remote as the upstream
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - resolves when complete
     * @memberof @node-red/runtime_projects
     */
    push(opts: any): any;
};
export default api;
