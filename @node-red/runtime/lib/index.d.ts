/// <reference types="node" />
/// <reference types="node" />
import plugins from '@node-red/registry';
import { log, i18n, exec, util, hooks } from '@node-red/util';
/**
 * Initialise the runtime module.
 * @param {Object} settings - the runtime settings object
 * @param {HTTPServer} server - the http server instance for the server to use
 * @param {AdminAPI} adminApi - an instance of @node-red/editor-api. <B>TODO</B>: This needs to be
 *                              better abstracted.
 * @memberof @node-red/runtime
 */
declare function init(userSettings: any, httpServer: any, _adminApi?: any): void;
declare function getVersion(): Promise<any>;
/**
 * Start the runtime.
 * @return {Promise} - resolves when the runtime is started. This does not mean the
 *   flows will be running as they are started asynchronously.
 * @memberof @node-red/runtime
 */
declare function start(): any;
/**
 * Stops the runtime.
 *
 * Once called, Node-RED should not be restarted until the Node.JS process is
 * restarted.
 *
 * @return {Promise} - resolves when the runtime is stopped.
 * @memberof @node-red/runtime
 */
declare function stop(): Promise<any[]>;
/**
 * This module provides the core runtime component of Node-RED.
 * It does *not* include the Node-RED editor. All interaction with
 * this module is done using the api provided.
 *
 * @namespace @node-red/runtime
 */
declare const _default: {
    init: typeof init;
    start: typeof start;
    stop: typeof stop;
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_comms
     */
    comms: {
        init(_runtime: any): void;
        addConnection(opts: any): void;
        removeConnection(opts: any): void;
        subscribe(opts: any): void;
        unsubscribe(opts: any): Promise<void>;
    };
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_flows
     */
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
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_library
     */
    library: {
        init(_runtime: any): void;
        getEntry(opts: any): any;
        saveEntry(opts: any): any;
    };
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_nodes
     */
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
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_settings
     */
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
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_projects
     */
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
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_context
     */
    context: {
        init(_runtime: any): void;
        getValue(opts: any): Promise<unknown>;
        delete(opts: any): Promise<unknown>;
    };
    /**
     * @memberof @node-red/runtime
     * @mixes @node-red/runtime_plugins
     */
    plugins: {
        init(_runtime: any): void;
        getPlugin(opts: any): any;
        getPluginsByType(opts: any): any;
        getPluginList(opts: any): any;
        getPluginConfigs(opts: any): any;
        getPluginCatalogs(opts: any): Promise<unknown>;
    };
    /**
     * Returns whether the runtime is started
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @return {Promise<Boolean>} - whether the runtime is started
     * @function
     * @memberof @node-red/runtime
     */
    isStarted: () => any;
    /**
     * Returns version number of the runtime
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @return {Promise<String>} - the runtime version number
     * @function
     * @memberof @node-red/runtime
     */
    version: () => any;
    /**
     * @memberof @node-red/diagnostics
     */
    diagnostics: {
        init(_runtime: any): void;
        get(opts: any): Promise<unknown>;
    };
    storage: {
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
    events: import("events");
    hooks: typeof hooks;
    util: typeof util;
    readonly httpNode: any;
    readonly httpAdmin: any;
    readonly server: any;
    _: {
        version: typeof getVersion;
        log: typeof log;
        i18n: typeof i18n;
        events: import("events");
        settings: {
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
        storage: {
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
        hooks: typeof hooks;
        nodes: {
            init: (runtime: any) => void;
            load: typeof plugins.load;
            createNode: (node: any, def: any) => void;
            getNode: (id: any) => any;
            eachNode: (cb: any) => void;
            getContext: (nodeId: any, flowId: any) => any;
            clearContext: () => Promise<any>;
            installerEnabled: () => boolean;
            installModule: (module: any, version: any, url?: any) => any;
            uninstallModule: (module: any) => Promise<unknown>;
            enableNode: (id: any) => any;
            disableNode: (id: any) => any;
            registerType: (nodeSet: any, type: any, constructor: any, opts: any) => void;
            registerSubflow: (nodeSet: any, subflow: any) => void;
            getType: typeof plugins.get;
            getNodeInfo: typeof plugins.getNodeInfo;
            getNodeList: typeof plugins.getNodeList;
            getModuleInfo: typeof plugins.getModuleInfo;
            getNodeConfigs: typeof plugins.getNodeConfigs;
            getNodeConfig: typeof plugins.getNodeConfig;
            getNodeIconPath: typeof plugins.getNodeIconPath;
            getNodeIcons: typeof plugins.getNodeIcons;
            getNodeExampleFlows: typeof plugins.getNodeExampleFlows;
            getNodeExampleFlowPath: typeof plugins.getNodeExampleFlowPath;
            getModuleResource: typeof plugins.getModuleResource;
            clearRegistry: typeof plugins.clear;
            cleanModuleList: typeof plugins.cleanModuleList;
            loadFlows: (forceStart?: boolean) => any;
            startFlows: (type?: any, diff?: any, muteLog?: any, isDeploy?: any) => Promise<void>;
            stopFlows: (type?: any, diff?: any, muteLog?: any, isDeploy?: any) => Promise<void>;
            setFlows: (_config: any, _credentials: any, type: any, muteLog: any, forceStart: any, user?: any) => any;
            getFlows: () => any;
            addFlow: (flow: any, user: any) => any;
            getFlow: (id: any) => any;
            updateFlow: (id: any, newFlow: any, user: any) => any;
            removeFlow: (id: any, user: any) => any;
            addCredentials: (id: any, creds: any) => void;
            getCredentials: (id: any) => any;
            deleteCredentials: (id: any) => void;
            getCredentialDefinition: (type: any) => any;
            setCredentialSecret: (key: any) => void;
            clearCredentials: () => void;
            exportCredentials: () => any;
            getCredentialKeyType: () => any;
            loadContextsPlugin: () => Promise<unknown>;
            closeContextsPlugin: () => Promise<any[]>;
            listContextStores: () => {
                default: any;
                stores: any[];
            };
        };
        plugins: typeof plugins;
        flows: {
            init: (runtime: any) => void;
            load: (forceStart?: boolean) => any;
            loadFlows: (forceStart?: boolean) => any;
            get: (id: any) => any;
            eachNode: (cb: any) => void;
            getFlows: () => any;
            setFlows: (_config: any, _credentials: any, type: any, muteLog: any, forceStart: any, user?: any) => any;
            startFlows: (type?: any, diff?: any, muteLog?: any, isDeploy?: any) => Promise<void>;
            stopFlows: (type?: any, diff?: any, muteLog?: any, isDeploy?: any) => Promise<void>;
            readonly started: boolean;
            state: () => string;
            checkTypeInUse: (id: any) => void;
            addFlow: (flow: any, user: any) => any;
            getFlow: (id: any) => any;
            updateFlow: (id: any, newFlow: any, user: any) => any;
            removeFlow: (id: any, user: any) => any;
            disableFlow: any;
            enableFlow: any;
            isDeliveryModeAsync(): boolean;
        };
        library: {
            init: (_runtime: any) => void;
            getLibraries: () => any[];
            register: (id: any, type: any) => void;
            getEntry: (library: any, type: any, path: any) => any;
            saveEntry: (library: any, type: any, path: any, meta: any, body: any) => any;
        };
        exec: typeof exec;
        util: typeof util;
        readonly adminApi: {
            auth: {
                needsPermission(): (req: any, res: any, next: any) => void;
            };
            adminApp: {
                get(): void;
                post(): void;
                put(): void;
                delete(): void;
            };
            server: {};
        };
        readonly adminApp: any;
        readonly nodeApp: any;
        readonly server: any;
        isStarted(): boolean;
    };
};
export default _default;
/**
 * A user accessing the API
 * @typedef User
 * @type {object}
 */
