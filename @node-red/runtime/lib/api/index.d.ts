/// <reference types="node" />
declare const api: {
    init(_runtime: any): void;
    comms: {
        init(_runtime: any): void;
        addConnection(opts: any): void;
        removeConnection(opts: any): void;
        subscribe(opts: any): void;
        unsubscribe(opts: any): Promise<void>;
    };
    flows: {
        init(_runtime: any): void;
        getFlows(opts: any): any;
        setFlows(opts: any): Promise<any>;
        addFlow(opts: any): Promise<any>;
        getFlow(opts: any): any;
        updateFlow(opts: any): Promise<any>;
        deleteFlow(opts: any): Promise<any>;
        getNodeCredentials(opts: any): {};
        getState(opts: any): {
            state: any;
        };
        setState(opts: any): Promise<{
            state: any;
        }>;
    };
    library: {
        init(_runtime: any): void;
        getEntry(opts: any): any;
        saveEntry(opts: any): any;
    };
    nodes: {
        init(_runtime: any): void;
        getNodeInfo(opts: any): any;
        getNodeList(opts: any): any;
        getNodeConfig(opts: any): any;
        getNodeConfigs(opts: any): any;
        getModuleInfo(opts: any): any;
        addModule(opts: any): any;
        removeModule(opts: any): any;
        setModuleState(opts: any): Promise<any>;
        setNodeSetState(opts: any): any;
        getModuleCatalogs(opts: any): Promise<unknown>;
        getModuleCatalog(opts: any): Promise<unknown>;
        getIconList(opts: any): any;
        getIcon(opts: any): Promise<Buffer>;
        getModuleResource(opts: any): Promise<any>;
    };
    settings: {
        init(_runtime: any): void;
        getRuntimeSettings(opts: any): any;
        getUserSettings(opts: any): any;
        updateUserSettings(opts: any): any;
        getUserKeys(opts: any): any;
        getUserKey(opts: any): any;
        generateUserKey(opts: any): any;
        removeUserKey(opts: any): any;
    };
    projects: {
        init(_runtime: any): void;
        available(opts: any): boolean;
        listProjects(opts: any): any;
        createProject(opts: any): any;
        initialiseProject(opts: any): any;
        getActiveProject(opts: any): any;
        setActiveProject(opts: any): any;
        getProject(opts: any): any;
        updateProject(opts: any): any;
        deleteProject(opts: any): any;
        getStatus(opts: any): any;
        getBranches(opts: any): any;
        getBranchStatus(opts: any): any;
        setBranch(opts: any): any;
        deleteBranch(opts: any): any;
        commit(opts: any): any;
        getCommit(opts: any): any;
        getCommits(opts: any): any;
        abortMerge(opts: any): any;
        resolveMerge(opts: any): any;
        getFiles(opts: any): any;
        getFile(opts: any): any;
        stageFile(opts: any): any;
        unstageFile(opts: any): any;
        revertFile(opts: any): any;
        getFileDiff(opts: any): any;
        getRemotes(opts: any): any;
        addRemote(opts: any): any;
        removeRemote(opts: any): any;
        updateRemote(opts: any): any;
        pull(opts: any): any;
        push(opts: any): any;
    };
    context: {
        init(_runtime: any): void;
        getValue(opts: any): Promise<unknown>;
        delete(opts: any): Promise<unknown>;
    };
    plugins: {
        init(_runtime: any): void;
        getPlugin(opts: any): any;
        getPluginsByType(opts: any): any;
        getPluginList(opts: any): any;
        getPluginConfigs(opts: any): any;
        getPluginCatalogs(opts: any): Promise<unknown>;
    };
    diagnostics: {
        init(_runtime: any): void;
        get(opts: any): Promise<unknown>;
    };
    isStarted(): any;
    version(): any;
};
export default api;
