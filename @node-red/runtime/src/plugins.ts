import { plugins } from '@node-red/registry';

export default {
  init() {
    //
  },
  registerPlugin: plugins.registerPlugin,
  getPlugin: plugins.getPlugin,
  getPluginsByType: plugins.getPluginsByType,
  getPluginList: plugins.getPluginList,
  getPluginConfigs: plugins.getPluginConfigs,
  exportPluginSettings: plugins.exportPluginSettings
};
