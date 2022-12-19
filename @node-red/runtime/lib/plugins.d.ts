import { plugins } from '@node-red/registry';
declare const _default: {
    init(): void;
    registerPlugin: typeof plugins.registerPlugin;
    getPlugin: typeof plugins.getPlugin;
    getPluginsByType: typeof plugins.getPluginsByType;
    getPluginList: typeof plugins.getPluginList;
    getPluginConfigs: typeof plugins.getPluginConfigs;
    exportPluginSettings: typeof plugins.exportPluginSettings;
};
export default _default;
