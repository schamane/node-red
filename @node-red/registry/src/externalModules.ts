/* eslint-disable no-prototype-builtins */
/* eslint-disable no-loop-func */
// This module handles the management of modules required by the runtime and flows.
// Essentially this means keeping track of what extra modules a flow requires,
// ensuring those modules are installed and providing a standard way for nodes
// to require those modules safely.

import fs from 'fs-extra';
import { parseModuleList, checkModuleAllowed } from './util';
import path from 'node:path';
import clone from 'clone';
import { exec, log, hooks, CustomErrorWithCode } from '@node-red/util';
import url from 'node:url';
import { createRequire, builtinModules as BUILTIN_MODULES } from 'module';

// TODO: outsource running npm to a plugin
const NPM_COMMAND = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const registeredTypes = {};
const subflowTypes = {};
let settings;

let knownExternalModules = {};

let installEnabled = true;
let installAllowList = ['*'];
let installDenyList = [];

let IMPORT_SUPPORTED = true;
const nodeVersionParts = process.versions.node.split('.').map((v) => parseInt(v));
if (nodeVersionParts[0] < 12 || (nodeVersionParts[0] === 12 && nodeVersionParts[1] < 17)) {
  IMPORT_SUPPORTED = false;
}

function getInstallDir() {
  return path.resolve(settings.userDir || process.env.NODE_RED_HOME || '.');
}

let loggedLegacyWarning = false;
async function refreshExternalModules() {
  if (!loggedLegacyWarning) {
    loggedLegacyWarning = true;
    const oldExternalModulesDir = path.join(path.resolve(settings.userDir || process.env.NODE_RED_HOME || '.'), 'externalModules');
    if (fs.existsSync(oldExternalModulesDir)) {
      try {
        log.warn(log._('server.install.old-ext-mod-dir-warning', { oldDir: oldExternalModulesDir, newDir: getInstallDir() }));
      } catch (err) {
        console.error(err);
      }
    }
  }
  const externalModuleDir = getInstallDir();
  try {
    const pkgFile = JSON.parse(await fs.readFile(path.join(externalModuleDir, 'package.json'), 'utf-8'));
    knownExternalModules = pkgFile.dependencies || {};
  } catch (err) {
    knownExternalModules = {};
  }
}

export function init(_settings) {
  settings = _settings;
  knownExternalModules = {};
  installEnabled = true;

  if (settings.externalModules && settings.externalModules.modules) {
    if (settings.externalModules.modules.allowList || settings.externalModules.modules.denyList) {
      installAllowList = settings.externalModules.modules.allowList;
      installDenyList = settings.externalModules.modules.denyList;
    }
    if (settings.externalModules.modules.hasOwnProperty('allowInstall')) {
      installEnabled = settings.externalModules.modules.allowInstall;
    }
  }
  installAllowList = parseModuleList(installAllowList);
  installDenyList = parseModuleList(installDenyList);
}

export function register(type, dynamicModuleListProperty) {
  registeredTypes[type] = dynamicModuleListProperty;
}

export function registerSubflow(type, subflowConfig) {
  subflowTypes[type] = subflowConfig;
}

function requireModule(module) {
  if (!checkModuleAllowed(module, null, installAllowList, installDenyList)) {
    const e = new CustomErrorWithCode('Module not allowed');
    e.code = 'module_not_allowed';
    throw e;
  }

  const parsedModule = parseModuleName(module);

  if (BUILTIN_MODULES.indexOf(parsedModule.module) !== -1) {
    return require(parsedModule.module);
  }
  if (!knownExternalModules[parsedModule.module]) {
    const e = new CustomErrorWithCode('Module not allowed');
    e.code = 'module_not_allowed';
    throw e;
  }
  const externalModuleDir = getInstallDir();
  const moduleDir = path.join(externalModuleDir, 'node_modules', module);
  return require(moduleDir);
}

export function importModule(module) {
  if (!IMPORT_SUPPORTED) {
    // On Node < 12.17 - fall back to try a require
    return new Promise((resolve, reject) => {
      try {
        const mod = requireModule(module);
        resolve(mod);
      } catch (err) {
        reject(err);
      }
    });
  }

  if (!checkModuleAllowed(module, null, installAllowList, installDenyList)) {
    const e = new CustomErrorWithCode('Module not allowed');
    e.code = 'module_not_allowed';
    throw e;
  }

  const parsedModule = parseModuleName(module);

  if (BUILTIN_MODULES.indexOf(parsedModule.module) !== -1) {
    return import(parsedModule.module);
  }
  if (!knownExternalModules[parsedModule.module]) {
    const e = new CustomErrorWithCode('Module not allowed');
    e.code = 'module_not_allowed';
    throw e;
  }
  const externalModuleDir = getInstallDir();
  const moduleDir = path.join(externalModuleDir, 'node_modules', module);
  // To handle both CJS and ESM we need to resolve the module to the
  // specific file that is loaded when the module is required/imported
  // As this won't be on the natural module search path, we use createRequire
  // to access the module
  const modulePath = createRequire(moduleDir).resolve(module);
  // Import needs the full path to the module's main .js file
  // It also needs to be a file:// url for Windows
  const moduleUrl = url.pathToFileURL(modulePath);
  return importModule(moduleUrl);
}

function parseModuleName(module) {
  const match = /((?:@[^/]+\/)?[^/@]+)(?:@([\s\S]+))?/.exec(module);
  if (match) {
    return {
      spec: module,
      module: match[1],
      version: match[2],
      builtin: BUILTIN_MODULES.indexOf(match[1]) !== -1,
      known: !!knownExternalModules[match[1]]
    };
  }
  return null;
}

function isInstalled(moduleDetails) {
  return moduleDetails.builtin || moduleDetails.known;
}
export async function checkFlowDependencies(flowConfig) {
  let nodes = clone(flowConfig);
  await refreshExternalModules();

  const checkedModules = {};
  const promises = [];
  const errors = [];
  const checkedSubflows = {};
  while (nodes.length > 0) {
    const n = nodes.shift();
    if (subflowTypes[n.type] && !checkedSubflows[n.type]) {
      checkedSubflows[n.type] = true;
      nodes = nodes.concat(subflowTypes[n.type].flow);
    } else if (registeredTypes[n.type]) {
      let nodeModules = n[registeredTypes[n.type]] || [];
      if (!Array.isArray(nodeModules)) {
        nodeModules = [nodeModules];
      }
      nodeModules.forEach((module) => {
        if (typeof module !== 'string') {
          module = module.module || '';
        }
        if (module) {
          const moduleDetails = parseModuleName(module);
          if (moduleDetails && checkedModules[moduleDetails.module] === undefined) {
            checkedModules[moduleDetails.module] = isInstalled(moduleDetails);
            if (!checkedModules[moduleDetails.module]) {
              if (installEnabled) {
                promises.push(
                  installModule(moduleDetails).catch((err) => {
                    errors.push({ module: moduleDetails, error: err });
                  })
                );
              } else if (!installEnabled) {
                const e = new CustomErrorWithCode('Module install disabled - externalModules.modules.allowInstall=false');
                e.code = 'install_not_allowed';
                errors.push({ module: moduleDetails, error: e });
              }
            } else if (!checkModuleAllowed(moduleDetails.module, moduleDetails.version, installAllowList, installDenyList)) {
              const e = new CustomErrorWithCode('Module not allowed');
              e.code = 'module_not_allowed';
              errors.push({ module: moduleDetails, error: e });
            }
          }
        }
      });
    }
  }
  return Promise.all(promises)
    .then(refreshExternalModules)
    .then(() => {
      if (errors.length > 0) {
        throw errors;
      }
    });
}
async function ensureModuleDir() {
  const installDir = getInstallDir();

  if (!fs.existsSync(installDir)) {
    await fs.ensureDir(installDir);
  }
  const pkgFile = path.join(installDir, 'package.json');
  if (!fs.existsSync(pkgFile)) {
    await fs.writeFile(
      path.join(installDir, 'package.json'),
      `{
    "name": "Node-RED-External-Modules",
    "description": "These modules are automatically installed by Node-RED to use in Function nodes.",
    "version": "1.0.0",
    "private": true,
    "dependencies": {}
}`
    );
  }
}

async function installModule(moduleDetails) {
  let installSpec = moduleDetails.module;
  if (!checkModuleAllowed(moduleDetails.module, moduleDetails.version, installAllowList, installDenyList)) {
    const e = new CustomErrorWithCode('Install not allowed');
    e.code = 'install_not_allowed';
    throw e;
  }
  if (moduleDetails.version) {
    installSpec = installSpec + '@' + moduleDetails.version;
  }
  log.info(log._('server.install.installing', { name: moduleDetails.module, version: moduleDetails.version || 'latest' }));
  const installDir = getInstallDir();

  await ensureModuleDir();

  const triggerPayload = {
    module: moduleDetails.module,
    version: moduleDetails.version,
    dir: installDir,
    args: ['--production', '--engine-strict']
  };
  return hooks
    .trigger('preInstall', triggerPayload)
    .then((result) => {
      // preInstall passed
      // - run install
      if (result !== false) {
        const extraArgs = triggerPayload.args || [];
        const args = ['install', ...extraArgs, installSpec];
        log.trace(NPM_COMMAND + JSON.stringify(args));
        return exec.run(NPM_COMMAND, args, { cwd: installDir }, true);
      }
      log.trace('skipping npm install');
    })
    .then(() => {
      return hooks.trigger('postInstall', triggerPayload);
    })
    .then(() => {
      log.info(log._('server.install.installed', { name: installSpec }));
      const runtimeInstalledModules = settings.get('modules') || {};
      runtimeInstalledModules[moduleDetails.module] = moduleDetails;
      settings.set('modules', runtimeInstalledModules);
    })
    .catch((result) => {
      const output = result.stderr || result.toString();
      let e;
      if (/E404/.test(output) || /ETARGET/.test(output)) {
        log.error(log._('server.install.install-failed-not-found', { name: installSpec }));
        e = new Error('Module not found');
        e.code = 404;
        throw e;
      } else {
        log.error(log._('server.install.install-failed-long', { name: installSpec }));
        log.error('------------------------------------------');
        log.error(output);
        log.error('------------------------------------------');
        e = new CustomErrorWithCode(log._('server.install.install-failed'));
        e.code = 'unexpected_error';
        throw e;
      }
    });
}
