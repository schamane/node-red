/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-use-before-define */
/* !
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

/**
 * Logging utilities
 * @mixin @node-red/util_log
 */

import { EventEmitter } from 'node:events';
import { t } from 'i18next';
import { inspect } from 'node:util';

let logHandlers = [];

let verbose;

let metricsEnabled = false;

export enum SEVERITY {
  OFF = 1,
  FATAL = 10,
  ERROR = 20,
  WARN = 30,
  INFO = 40,
  DEBUG = 50,
  TRACE = 60,
  AUDIT = 98,
  METRIC = 99
}

class LogHandler extends EventEmitter {
  public logLevel;
  public metricsOn: boolean;
  public auditOn: boolean;
  public handler;

  constructor(settings?) {
    super();
    this.logLevel = settings ? SEVERITY[settings.level] || SEVERITY.INFO : SEVERITY.INFO;
    this.metricsOn = settings ? settings.metrics || false : false;
    this.auditOn = settings ? settings.audit || false : false;

    metricsEnabled = metricsEnabled || this.metricsOn;

    // eslint-disable-next-line no-use-before-define
    this.handler = settings && settings.handler ? settings.handler(settings) : consoleLogger;
    this.on('log', function (msg) {
      // eslint-disable-next-line no-invalid-this
      if (this.shouldReportMessage(msg.level)) {
        // eslint-disable-next-line no-invalid-this
        this.handler(msg);
      }
    });
  }
  // util.inherits(LogHandler, events.EventEmitter);
  public shouldReportMessage(msglevel) {
    return (msglevel === SEVERITY.METRIC && this.metricsOn) || (msglevel === SEVERITY.AUDIT && this.auditOn) || msglevel <= this.logLevel;
  }
}

const consoleLogger = function (msg) {
  if (msg.level === SEVERITY.METRIC || msg.level === SEVERITY.AUDIT) {
    console.log('[' + SEVERITY[msg.level] + '] ' + JSON.stringify(msg));
  } else if (verbose && msg.msg && msg.msg.stack) {
    console.log('[' + SEVERITY[msg.level] + '] ' + (msg.type ? '[' + msg.type + ':' + (msg.name || msg.id) + '] ' : '') + msg.msg.stack);
  } else {
    let message = msg.msg;
    try {
      if (typeof message === 'object' && message !== null && message.toString() === '[object Object]' && message.message) {
        message = message.message;
      }
    } catch (e) {
      message = 'Exception trying to log: ' + inspect(message);
    }

    console.log('[' + SEVERITY[msg.level] + '] ' + (msg.type ? '[' + msg.type + ':' + (msg.name || msg.id) + '] ' : '') + message);
  }
};

export const FATAL = SEVERITY.FATAL;
export const ERROR = SEVERITY.ERROR;
export const WARN = SEVERITY.WARN;
export const INFO = SEVERITY.INFO;
export const DEBUG = SEVERITY.DEBUG;
export const TRACE = SEVERITY.TRACE;
export const AUDIT = SEVERITY.AUDIT;
export const METRIC = SEVERITY.METRIC;

export function init(settings) {
  metricsEnabled = false;
  logHandlers = [];
  verbose = settings.verbose;
  if (settings.logging) {
    const keys = Object.keys(settings.logging);
    if (keys.length === 0) {
      addHandler(new LogHandler());
    } else {
      for (let i = 0, l = keys.length; i < l; i++) {
        const config = settings.logging[keys[i]] || {};
        if (keys[i] === 'console' || config.handler) {
          addHandler(new LogHandler(config));
        }
      }
    }
  } else {
    addHandler(new LogHandler());
  }
}

/**
 * Add a log handler function
 * @memberof @node-red/util_log
 */
export function addHandler(func) {
  logHandlers.push(func);
}

/**
 * Remove a log handler function
 * @memberof @node-red/util_log
 */
export function removeHandler(func) {
  const index = logHandlers.indexOf(func);
  if (index > -1) {
    logHandlers.splice(index, 1);
  }
}

/**
 * Log a message object
 * @memberof @node-red/util_log
 */
export function log(msg) {
  msg.timestamp = Date.now();
  logHandlers.forEach(function (handler) {
    handler.emit('log', msg);
  });
}

/**
 * Log a message at INFO level
 * @memberof @node-red/util_log
 */
export function info(msg) {
  log({ level: SEVERITY.INFO, msg });
}

/**
 * Log a message at WARN level
 * @memberof @node-red/util_log
 */
export function warn(msg) {
  log({ level: SEVERITY.WARN, msg });
}

/**
 * Log a message at ERROR level
 * @memberof @node-red/util_log
 */
export function error(msg) {
  log({ level: SEVERITY.ERROR, msg });
}

/**
 * Log a message at TRACE level
 * @memberof @node-red/util_log
 */
export function trace(msg) {
  log({ level: SEVERITY.TRACE, msg });
}

/**
 * Log a message at DEBUG level
 * @memberof @node-red/util_log
 */
export function debug(msg) {
  log({ level: SEVERITY.DEBUG, msg });
}

/**
 * Check if metrics are enabled
 * @memberof @node-red/util_log
 */
export function metric() {
  return metricsEnabled;
}

/**
 * Log an audit event.
 * @memberof @node-red/util_log
 */
export function audit(msg, req) {
  msg.level = SEVERITY.AUDIT;
  if (req) {
    msg.user = req.user;
    msg.path = req.path;
    msg.ip = req.ip || (req.headers && req.headers['x-forwarded-for']) || (req.connection && req.connection.remoteAddress) || undefined;
  }
  log(msg);
}

/**
 * Perform a message catalog lookup.
 * @name _
 * @function
 * @memberof @node-red/util_log
 */

export const _ = t;
