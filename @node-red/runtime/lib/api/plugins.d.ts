/**
 * @mixin @node-red/runtime_plugins
 */
declare const api: {
    init(_runtime: any): void;
    /**
     * Gets a plugin definition from the registry
     * @param {Object} opts
     * @param {String} opts.id - the id of the plugin to get
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<PluginDefinition>} - the plugin definition
     * @memberof @node-red/runtime_plugins
     */
    getPlugin(opts: any): any;
    /**
     * Gets all plugin definitions of a given type
     * @param {Object} opts
     * @param {String} opts.type - the type of the plugins to get
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Array>} - the plugin definitions
     * @memberof @node-red/runtime_plugins
     */
    getPluginsByType(opts: any): any;
    /**
     * Gets the editor content for an individual plugin
     * @param {String} opts.lang - the locale language to return
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<NodeInfo>} - the node information
     * @memberof @node-red/runtime_plugins
     */
    getPluginList(opts: any): any;
    /**
     * Gets the editor content for all registered plugins
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {User} opts.user - the user calling the api
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<NodeInfo>} - the node information
     * @memberof @node-red/runtime_plugins
     */
    getPluginConfigs(opts: any): any;
    /**
     * Gets all registered module message catalogs
     * @param {Object} opts
     * @param {User} opts.user - the user calling the api
     * @param {User} opts.lang - the i18n language to return. If not set, uses runtime default (en-US)
     * @param {Object} opts.req - the request to log (optional)
     * @return {Promise<Object>} - the message catalogs
     * @memberof @node-red/runtime_plugins
     */
    getPluginCatalogs(opts: any): Promise<unknown>;
};
export default api;
