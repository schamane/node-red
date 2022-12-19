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

import net from 'node:net';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

function getListenPath() {
  const seed = crypto.randomBytes(8).toString('hex');
  const fn = 'node-red-git-askpass-' + seed + '-sock';
  let listenPath;
  if (process.platform === 'win32') {
    listenPath = '\\\\.\\pipe\\' + fn;
  } else {
    listenPath = path.join(process.env.XDG_RUNTIME_DIR || os.tmpdir(), fn);
  }
  // console.log(listenPath);
  return listenPath;
}
const ResponseServer = function (auth) {
  return new Promise(function (resolve, reject) {
    const server = net.createServer(function (connection) {
      connection.setEncoding('utf8');
      let parts = [];
      connection.on('data', function (data: string) {
        const m = data.indexOf('\n');
        if (m !== -1) {
          parts.push(data.substring(0, m));
          data = data.substring(m);
          const line = parts.join('');
          // console.log("LINE:",line);
          parts = [];
          if (line === 'Username') {
            connection.end(auth.username);
          } else if (line === 'Password') {
            connection.end(auth.password);
            server.close();
          }
        }
        if (data.length > 0) {
          parts.push(data);
        }
      });
    });

    const listenPath = getListenPath();

    server.listen(listenPath, function () {
      resolve({
        path: listenPath,
        close() {
          server.close();
        }
      });
    });
    server.on('close', function () {
      // console.log("Closing response server");
      fs.removeSync(listenPath);
    });
    server.on('error', function (err) {
      console.log('ResponseServer unexpectedError:', err.toString());
      server.close();
      reject(err);
    });
  });
};

const ResponseSSHServer = function (auth) {
  return new Promise(function (resolve, reject) {
    const server = net.createServer(function (connection) {
      connection.setEncoding('utf8');
      let parts = [];
      connection.on('data', function (data: string) {
        const m = data.indexOf('\n');
        if (m !== -1) {
          parts.push(data.substring(0, m));
          data = data.substring(m);
          const line = parts.join('');
          parts = [];
          if (line === 'The') {
            // TODO: document these exchanges!
            connection.end('yes');
            // server.close();
          } else if (line === 'Enter') {
            connection.end(auth.passphrase);
            // server.close();
          }
        }
        if (data.length > 0) {
          parts.push(data);
        }
      });
    });

    const listenPath = getListenPath();

    server.listen(listenPath, function () {
      resolve({
        path: listenPath,
        close() {
          server.close();
        }
      });
    });
    server.on('close', function () {
      // console.log("Closing response server");
      fs.removeSync(listenPath);
    });
    server.on('error', function (err) {
      console.log('ResponseServer unexpectedError:', err.toString());
      server.close();
      reject(err);
    });
  });
};

export { ResponseServer, ResponseSSHServer };
