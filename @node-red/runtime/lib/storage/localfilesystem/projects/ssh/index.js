"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const node_path_1 = __importDefault(require("node:path"));
const keygen_js_1 = __importDefault(require("./keygen.js"));
const util_1 = require("@node-red/util");
const node_util_1 = require("node:util");
let settings;
let sshkeyDir;
let userSSHKeyDir;
function init(_settings) {
    settings = _settings;
    sshkeyDir = node_path_1.default.resolve(node_path_1.default.join(settings.userDir, 'projects', '.sshkeys'));
    userSSHKeyDir = node_path_1.default.join(process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH, '.ssh');
    // console.log('sshkeys.init()');
    return fs_extra_1.default.ensureDir(sshkeyDir);
}
function listSSHKeys(username) {
    return listSSHKeysInDir(sshkeyDir, username + '_').then(function (customKeys) {
        return listSSHKeysInDir(userSSHKeyDir).then(function (existingKeys) {
            existingKeys.forEach(function (k) {
                k.system = true;
                customKeys.push(k);
            });
            return customKeys;
        });
    });
}
function listSSHKeysInDir(dir, startStr) {
    startStr = startStr || '';
    return fs_extra_1.default
        .readdir(dir)
        .then(function (fns) {
        const ret = fns
            .sort()
            .filter(function (fn) {
            const fullPath = node_path_1.default.join(dir, fn);
            if (fn.length > 2 || fn[0] !== '.') {
                const stats = fs_extra_1.default.lstatSync(fullPath);
                if (stats.isFile()) {
                    return fn.startsWith(startStr);
                }
            }
            return false;
        })
            .map(function (filename) {
            return filename.substr(startStr.length);
        })
            .reduce(function (prev, current) {
            const parsePath = node_path_1.default.parse(current);
            if (parsePath) {
                if (parsePath.ext !== '.pub') {
                    // Private Keys
                    prev.keyFiles.push(parsePath.base);
                }
                else if (parsePath.ext === '.pub' &&
                    prev.keyFiles.some(function (elem) {
                        return elem === parsePath.name;
                    })) {
                    prev.privateKeyFiles.push(parsePath.name);
                }
            }
            return prev;
        }, { keyFiles: [], privateKeyFiles: [] });
        return ret.privateKeyFiles.map(function (filename) {
            return {
                name: filename
            };
        });
    })
        .then(function (result) {
        return result;
    })
        .catch(function () {
        return [];
    });
}
function getSSHKey(username, name) {
    return checkSSHKeyFileAndGetPublicKeyFileName(username, name)
        .then(function (publicSSHKeyPath) {
        return fs_extra_1.default.readFile(publicSSHKeyPath, 'utf-8');
    })
        .catch(function () {
        const privateKeyPath = node_path_1.default.join(userSSHKeyDir, name);
        const publicKeyPath = privateKeyPath + '.pub';
        return checkFilePairExist(privateKeyPath, publicKeyPath)
            .then(function () {
            return fs_extra_1.default.readFile(publicKeyPath, 'utf-8');
        })
            .catch(function () {
            return null;
        });
    });
}
function generateSSHKey(username, options) {
    options = options || {};
    const name = options.name || '';
    if (!/^[a-zA-Z0-9\-_]+$/.test(options.name)) {
        const err = new Error('Invalid SSH Key name');
        err.code = 'invalid_key_name';
        return Promise.reject(err);
    }
    return checkExistSSHKeyFiles(username, name).then(function (result) {
        if (result) {
            const e = new Error('SSH Key name exists');
            e.code = 'key_exists';
            throw e;
        }
        else {
            const comment = options.comment || '';
            const password = options.password || '';
            const size = options.size || 2048;
            const sshKeyFileBasename = username + '_' + name;
            const privateKeyFilePath = node_path_1.default.normalize(node_path_1.default.join(sshkeyDir, sshKeyFileBasename));
            return generateSSHKeyPair(name, privateKeyFilePath, comment, password, size);
        }
    });
}
function deleteSSHKey(username, name) {
    return checkSSHKeyFileAndGetPublicKeyFileName(username, name).then(function () {
        return deleteSSHKeyFiles(username, name);
    });
}
function checkExistSSHKeyFiles(username, name) {
    const sshKeyFileBasename = username + '_' + name;
    const privateKeyFilePath = node_path_1.default.join(sshkeyDir, sshKeyFileBasename);
    const publicKeyFilePath = node_path_1.default.join(sshkeyDir, sshKeyFileBasename + '.pub');
    return checkFilePairExist(privateKeyFilePath, publicKeyFilePath)
        .then(function () {
        return true;
    })
        .catch(function () {
        return false;
    });
}
function checkSSHKeyFileAndGetPublicKeyFileName(username, name) {
    const sshKeyFileBasename = username + '_' + name;
    const privateKeyFilePath = node_path_1.default.join(sshkeyDir, sshKeyFileBasename);
    const publicKeyFilePath = node_path_1.default.join(sshkeyDir, sshKeyFileBasename + '.pub');
    return checkFilePairExist(privateKeyFilePath, publicKeyFilePath).then(function () {
        return publicKeyFilePath;
    });
}
function checkFilePairExist(privateKeyFilePath, publicKeyFilePath) {
    return Promise.all([
        fs_extra_1.default.access(privateKeyFilePath, (fs_extra_1.default.constants || fs_extra_1.default).R_OK),
        fs_extra_1.default.access(publicKeyFilePath, (fs_extra_1.default.constants || fs_extra_1.default).R_OK)
    ]);
}
function deleteSSHKeyFiles(username, name) {
    const sshKeyFileBasename = username + '_' + name;
    const privateKeyFilePath = node_path_1.default.join(sshkeyDir, sshKeyFileBasename);
    const publicKeyFilePath = node_path_1.default.join(sshkeyDir, sshKeyFileBasename + '.pub');
    return Promise.all([fs_extra_1.default.remove(privateKeyFilePath), fs_extra_1.default.remove(publicKeyFilePath)]);
}
function generateSSHKeyPair(name, privateKeyPath, comment, password, size) {
    util_1.log.trace('ssh-keygen[' + [name, privateKeyPath, comment, size, 'hasPassword?' + !!password].join(',') + ']');
    return keygen_js_1.default
        .generateKey({ location: privateKeyPath, comment, password, size })
        .then(function (stdout) {
        return name;
    })
        .catch(function (err) {
        util_1.log.log(`[SSHKey generation] error: ${(0, node_util_1.inspect)(err)}`);
        throw err;
    });
}
function getPrivateKeyPath(username, name) {
    const sshKeyFileBasename = username + '_' + name;
    let privateKeyFilePath = node_path_1.default.normalize(node_path_1.default.join(sshkeyDir, sshKeyFileBasename));
    try {
        fs_extra_1.default.accessSync(privateKeyFilePath, (fs_extra_1.default.constants || fs_extra_1.default).R_OK);
    }
    catch (err) {
        privateKeyFilePath = node_path_1.default.join(userSSHKeyDir, name);
        try {
            fs_extra_1.default.accessSync(privateKeyFilePath, (fs_extra_1.default.constants || fs_extra_1.default).R_OK);
        }
        catch (err2) {
            return null;
        }
    }
    if (node_path_1.default.sep === '\\') {
        privateKeyFilePath = privateKeyFilePath.replace(/\\/g, '\\\\');
    }
    return privateKeyFilePath;
}
exports.default = {
    init,
    listSSHKeys,
    getSSHKey,
    getPrivateKeyPath,
    generateSSHKey,
    deleteSSHKey
};
//# sourceMappingURL=index.js.map