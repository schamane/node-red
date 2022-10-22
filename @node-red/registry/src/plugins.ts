/* eslint-disable no-prototype-builtins */
import { getModuleFromSetId, getNodeFromSetId, getModule, getModuleList, filterNodeInfo } from './registry';
import { events } from '@node-red/util';
import clone from 'clone';

let pluginConfigCache = {};
let pluginToId = {};
let plugins = {};
let pluginsByType = {};
let pluginSettings = {};
let settings;

export function init(_settings) {
  settings = _settings;
  plugins = {};
  pluginConfigCache = {};
  pluginToId = {};
  pluginsByType = {};
  pluginSettings = {};
}

export function registerPlugin(nodeSetId, id, definition) {
  const moduleId = getModuleFromSetId(nodeSetId);
  const pluginId = getNodeFromSetId(nodeSetId);

  definition.id = id;
  definition.module = moduleId;
  pluginToId[id] = nodeSetId;
  plugins[id] = definition;
  const module = getModule(moduleId);

  definition.path = module.path;

  module.plugins[pluginId].plugins.push(definition);
  if (definition.type) {
    pluginsByType[definition.type] = pluginsByType[definition.type] || [];
    pluginsByType[definition.type].push(definition);
  }
  if (definition.settings) {
    pluginSettings[id] = definition.settings;
  }

  if (definition.onadd && typeof definition.onadd === 'function') {
    definition.onadd();
  }
  events.emit('registry:plugin-added', id);
}

export function getPlugin(id) {
  return plugins[id];
}

export function getPluginsByType(type) {
  return pluginsByType[type] || [];
}

export function getPluginConfigs(lang) {
  if (!pluginConfigCache[lang]) {
    let result = '';
    const moduleConfigs = getModuleList();
    for (const module in moduleConfigs) {
      /* istanbul ignore else */
      if (moduleConfigs.hasOwnProperty(module)) {
        const modulePlugins = moduleConfigs[module].plugins;
        for (const plugin in modulePlugins) {
          if (plugins.hasOwnProperty(plugin)) {
            const config = plugins[plugin];
            if (config.enabled && !config.err && config.config) {
              result += '\n<!-- --- [red-plugin:' + config.id + '] --- -->\n';
              result += config.config;
            }
          }
        }
      }
    }
    pluginConfigCache[lang] = result;
  }
  return pluginConfigCache[lang];
}
export function getPluginList() {
  const list = [];
  const moduleConfigs = getModuleList();
  for (const module in moduleConfigs) {
    /* istanbul ignore else */
    if (moduleConfigs.hasOwnProperty(module)) {
      const modulePlugins = moduleConfigs[module].plugins;
      for (const plugin in modulePlugins) {
        /* istanbul ignore else */
        if (plugins.hasOwnProperty(plugin)) {
          const pluginInfo = filterNodeInfo(plugins[plugin]);
          pluginInfo.version = moduleConfigs[module].version;
          // if (moduleConfigs[module].pending_version) {
          //     nodeInfo.pending_version = moduleConfigs[module].pending_version;
          // }
          list.push(pluginInfo);
        }
      }
    }
  }
  return list;
}

export function exportPluginSettings(safeSettings) {
  for (const id in pluginSettings) {
    if (pluginSettings.hasOwnProperty(id)) {
      if (settings.hasOwnProperty(id) && !safeSettings.hasOwnProperty(id)) {
        const pluginTypeSettings = pluginSettings[id];
        let exportedSet = {};
        let defaultExportable = false;
        if (pluginTypeSettings['*'] && pluginTypeSettings['*'].hasOwnProperty('exportable')) {
          defaultExportable = pluginTypeSettings['*'].exportable;
        }
        if (defaultExportable) {
          exportedSet = clone(settings[id]);
        }
        for (const property in pluginTypeSettings) {
          if (pluginTypeSettings.hasOwnProperty(property)) {
            const setting = pluginTypeSettings[property];
            if (defaultExportable) {
              if (setting.exportable === false) {
                delete exportedSet[property];
              } else if (!exportedSet.hasOwnProperty(property) && setting.hasOwnProperty('value')) {
                exportedSet[property] = setting.value;
              }
            } else if (setting.exportable) {
              if (settings[id].hasOwnProperty(property)) {
                exportedSet[property] = settings[id][property];
              } else if (setting.hasOwnProperty('value')) {
                exportedSet[property] = setting.value;
              }
            }
          }
        }
        if (Object.keys(exportedSet).length > 0) {
          safeSettings[id] = exportedSet;
        }
      }
    }
  }

  return safeSettings;
}
