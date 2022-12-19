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
const util_1 = require("@node-red/util");
function parseJSON(data) {
    if (data.charCodeAt(0) === 0xfeff) {
        data = data.slice(1);
    }
    return JSON.parse(data);
}
function readFile(path, backupPath, emptyResponse, type) {
    return new Promise(function (resolve) {
        fs_extra_1.default.readFile(path, 'utf8', function (err, data) {
            if (!err) {
                if (data.length === 0) {
                    util_1.log.warn(util_1.log._('storage.localfilesystem.empty', { type }));
                    try {
                        const backupStat = fs_extra_1.default.statSync(backupPath);
                        if (backupStat.size === 0) {
                            // Empty flows, empty backup - return empty flow
                            return resolve(emptyResponse);
                        }
                        // Empty flows, restore backup
                        util_1.log.warn(util_1.log._('storage.localfilesystem.restore', { path: backupPath, type }));
                        fs_extra_1.default.copy(backupPath, path, function (backupCopyErr) {
                            if (backupCopyErr) {
                                // Restore backup failed
                                util_1.log.warn(util_1.log._('storage.localfilesystem.restore-fail', { message: backupCopyErr.toString(), type }));
                                resolve([]);
                            }
                            else {
                                // Loop back in to load the restored backup
                                resolve(readFile(path, backupPath, emptyResponse, type));
                            }
                        });
                        return;
                    }
                    catch (backupStatErr) {
                        // Empty flow file, no back-up file
                        return resolve(emptyResponse);
                    }
                }
                try {
                    return resolve(parseJSON(data));
                }
                catch (parseErr) {
                    util_1.log.warn(util_1.log._('storage.localfilesystem.invalid', { type }));
                    return resolve(emptyResponse);
                }
            }
            else {
                if (type === 'flow') {
                    util_1.log.info(util_1.log._('storage.localfilesystem.create', { type }));
                }
                resolve(emptyResponse);
            }
        });
    });
}
exports.default = {
    /**
     * Write content to a file using UTF8 encoding.
     * This forces a fsync before completing to ensure
     * the write hits disk.
     */
    writeFile(path, content, backupPath) {
        let backupPromise;
        if (backupPath && fs_extra_1.default.existsSync(path)) {
            backupPromise = fs_extra_1.default.copy(path, backupPath);
        }
        else {
            backupPromise = Promise.resolve();
        }
        const dirname = node_path_1.default.dirname(path);
        const tempFile = `${path}.$$$`;
        return backupPromise
            .then(() => {
            if (backupPath) {
                util_1.log.trace(`utils.writeFile - copied ${path} TO ${backupPath}`);
            }
            return fs_extra_1.default.ensureDir(dirname);
        })
            .then(() => {
            return new Promise(function (resolve, reject) {
                const stream = fs_extra_1.default.createWriteStream(tempFile);
                stream.on('open', function (fd) {
                    stream.write(content, 'utf8', function () {
                        fs_extra_1.default.fsync(fd, function (err) {
                            if (err) {
                                util_1.log.warn(util_1.log._('storage.localfilesystem.fsync-fail', { path: tempFile, message: err.toString() }));
                            }
                            stream.end(resolve);
                        });
                    });
                });
                stream.on('error', function (err) {
                    util_1.log.warn(util_1.log._('storage.localfilesystem.fsync-fail', { path: tempFile, message: err.toString() }));
                    reject(err);
                });
            });
        })
            .then(() => {
            util_1.log.trace(`utils.writeFile - written content to ${tempFile}`);
            return new Promise(function (resolve, reject) {
                fs_extra_1.default.rename(tempFile, path, (err) => {
                    if (err) {
                        util_1.log.warn(util_1.log._('storage.localfilesystem.fsync-fail', { path, message: err.toString() }));
                        return reject(err);
                    }
                    util_1.log.trace(`utils.writeFile - renamed ${tempFile} to ${path}`);
                    resolve(undefined);
                });
            });
        });
    },
    readFile,
    parseJSON
};
//# sourceMappingURL=util.js.map