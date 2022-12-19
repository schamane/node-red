/// <reference types="node" />
/// <reference types="node" />
import { log, util } from '@node-red/util';
/**
 * This module provides the full Node-RED application, with both the runtime
 * and editor components built in.
 *
 * The API this module exposes allows it to be embedded within another Node.js
 * application.
 *
 * @namespace node-red
 */
declare const _default: {
    /**
     * Initialise the Node-RED application.
     * @param {server} httpServer - the HTTP server object to use
     * @param {Object} userSettings - an object containing the runtime settings
     * @memberof node-red
     */
    init(httpServer: any, userSettings: any): void;
    /**
     * Start the Node-RED application.
     * @return {Promise} - resolves when complete
     * @memberof node-red
     */
    start(): any;
    /**
     * Stop the Node-RED application.
     *
     * Once called, Node-RED should not be restarted until the Node.JS process is
     * restarted.
     *
     * @return {Promise} - resolves when complete
     * @memberof node-red
     */
    stop(): Promise<any>;
    /**
     * Logging utilities
     * @see @node-red/util_log
     * @memberof node-red
     */
    log: typeof log;
    /**
     * General utilities
     * @see @node-red/util_util
     * @memberof node-red
     */
    util: typeof util;
    /**
     * This provides access to the internal nodes module of the
     * runtime. The details of this API remain undocumented as they should not
     * be used directly.
     *
     * Most administrative actions should be performed use the runtime api
     * under [node-red.runtime]{@link node-red.runtime}.
     *
     * @memberof node-red
     */
    readonly nodes: {
        init: (runtime: any) => void;
        load: typeof import("@node-red/registry").load;
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
        getType: typeof import("@node-red/registry").get;
        getNodeInfo: typeof import("@node-red/registry").getNodeInfo;
        getNodeList: typeof import("@node-red/registry").getNodeList;
        getModuleInfo: typeof import("@node-red/registry").getModuleInfo;
        getNodeConfigs: typeof import("@node-red/registry").getNodeConfigs;
        getNodeConfig: typeof import("@node-red/registry").getNodeConfig;
        getNodeIconPath: typeof import("@node-red/registry").getNodeIconPath;
        getNodeIcons: typeof import("@node-red/registry").getNodeIcons;
        getNodeExampleFlows: typeof import("@node-red/registry").getNodeExampleFlows;
        getNodeExampleFlowPath: typeof import("@node-red/registry").getNodeExampleFlowPath;
        getModuleResource: typeof import("@node-red/registry").getModuleResource;
        clearRegistry: typeof import("@node-red/registry").clear;
        cleanModuleList: typeof import("@node-red/registry").cleanModuleList;
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
    /**
     * Runtime events emitter
     * @see @node-red/util_events
     * @memberof node-red
     */
    events: import("events");
    /**
     * Runtime hooks engine
     * @see @node-red/runtime_hooks
     * @memberof node-red
     */
    hooks: typeof import("@node-red/util/lib/hooks");
    /**
     * This provides access to the internal settings module of the
     * runtime.
     *
     * @memberof node-red
     */
    readonly settings: {
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
    /**
     * Get the version of the runtime
     * @return {String} - the runtime version
     * @function
     * @memberof node-red
     */
    readonly version: () => Promise<any>;
    /**
     * The express application for the Editor Admin API
     * @type ExpressApplication
     * @memberof node-red
     */
    readonly httpAdmin: any;
    /**
     * The express application for HTTP Nodes
     * @type ExpressApplication
     * @memberof node-red
     */
    readonly httpNode: any;
    /**
     * The HTTP Server used by the runtime
     * @type HTTPServer
     * @memberof node-red
     */
    readonly server: any;
    /**
     * The runtime api
     * @see @node-red/runtime
     * @memberof node-red
     */
    runtime: {
        init: (userSettings: any, httpServer: any, _adminApi?: any) => void;
        start: () => any;
        stop: () => Promise<any[]>;
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
            initialiseProject(opts: any): any; /**
             * Stop the Node-RED application.
             *
             * Once called, Node-RED should not be restarted until the Node.JS process is
             * restarted.
             *
             * @return {Promise} - resolves when complete
             * @memberof node-red
             */
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
            getCommit(opts: any): any; /**
             * General utilities
             * @see @node-red/util_util
             * @memberof node-red
             */
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
        isStarted: () => any;
        version: () => any;
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
        hooks: typeof import("@node-red/util/lib/hooks");
        util: typeof util;
        readonly httpNode: any;
        readonly httpAdmin: any;
        readonly server: any;
        _: {
            version: () => Promise<any>;
            log: typeof log;
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
            hooks: typeof import("@node-red/util/lib/hooks");
            nodes: {
                init: (runtime: any) => void;
                load: typeof import("@node-red/registry").load;
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
                getType: typeof import("@node-red/registry").get;
                getNodeInfo: typeof import("@node-red/registry").getNodeInfo;
                getNodeList: typeof import("@node-red/registry").getNodeList;
                getModuleInfo: typeof import("@node-red/registry").getModuleInfo;
                getNodeConfigs: typeof import("@node-red/registry").getNodeConfigs;
                getNodeConfig: typeof import("@node-red/registry").getNodeConfig;
                getNodeIconPath: typeof import("@node-red/registry").getNodeIconPath;
                getNodeIcons: typeof import("@node-red/registry").getNodeIcons;
                getNodeExampleFlows: typeof import("@node-red/registry").getNodeExampleFlows;
                getNodeExampleFlowPath: typeof import("@node-red/registry").getNodeExampleFlowPath;
                getModuleResource: typeof import("@node-red/registry").getModuleResource;
                clearRegistry: typeof import("@node-red/registry").clear;
                cleanModuleList: typeof import("@node-red/registry").cleanModuleList;
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
            plugins: typeof import("@node-red/registry");
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
            exec: typeof import("@node-red/util/lib/exec");
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
    /**
     * The editor authentication api.
     * @see @node-red/editor-api_auth
     * @memberof node-red
     */
    auth: any;
    /**
     * The editor authentication api.
     * @see @node-red/editor-api_auth
     * @memberof node-red
     */
    readonly diagnostics: any;
};
export default _default;
