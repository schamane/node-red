/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-useless-escape */
/* eslint-disable eqeqeq */
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
 * @ignore
 **/

/**
 * @mixin @node-red/util_util
 */

import clonedeep from 'lodash.clonedeep';
import jsonata from 'jsonata';
import moment from 'moment-timezone';
import safeJSONStringify from 'json-stringify-safe';
import util from 'node:util';
import Error from './error.js';

const {
  prototype: { hasOwnProperty }
} = Object;

/**
 * Safely returns the object construtor name.
 * @return {String} the name of the object constructor if it exists, empty string otherwise.
 */
function constructorName(obj) {
  // Note: This function could be replaced by optional chaining in Node.js 14+:
  // obj?.constructor?.name
  return obj && obj.constructor ? obj.constructor.name : '';
}

/**
 * Generates a psuedo-unique-random id.
 * @return {String} a random-ish id
 * @memberof @node-red/util_util
 */
export function generateId() {
  const bytes = [];
  for (let i = 0; i < 8; i++) {
    bytes.push(
      Math.round(0xff * Math.random())
        .toString(16)
        .padStart(2, '0')
    );
  }
  return bytes.join('');
}

/**
 * Converts the provided argument to a String, using type-dependent
 * methods.
 *
 * @param  {any}    o - the property to convert to a String
 * @return {String} the stringified version
 * @memberof @node-red/util_util
 */
export function ensureString(o) {
  if (Buffer.isBuffer(o)) {
    return o.toString();
  } else if (typeof o === 'object') {
    return JSON.stringify(o);
  } else if (typeof o === 'string') {
    return o;
  }
  return '' + o;
}

/**
 * Converts the provided argument to a Buffer, using type-dependent
 * methods.
 *
 * @param  {any}    o - the property to convert to a Buffer
 * @return {String} the Buffer version
 * @memberof @node-red/util_util
 */
export function ensureBuffer(o) {
  if (Buffer.isBuffer(o)) {
    return o;
  } else if (typeof o === 'object') {
    o = JSON.stringify(o);
  } else if (typeof o !== 'string') {
    o = '' + o;
  }
  return Buffer.from(o);
}

/**
 * Safely clones a message object. This handles msg.req/msg.res objects that must
 * not be cloned.
 *
 * @param  {any}    msg - the message object to clone
 * @return {Object} the cloned message
 * @memberof @node-red/util_util
 */
export function cloneMessage(msg) {
  if (typeof msg !== 'undefined' && msg !== null) {
    // Temporary fix for #97
    // TODO: remove this http-node-specific fix somehow
    const req = msg.req;
    const res = msg.res;
    delete msg.req;
    delete msg.res;
    const m = clonedeep(msg);
    if (req) {
      m.req = req;
      msg.req = req;
    }
    if (res) {
      m.res = res;
      msg.res = res;
    }
    return m;
  }
  return msg;
}

/**
 * Compares two objects, handling various JavaScript types.
 *
 * @param  {any}    obj1
 * @param  {any}    obj2
 * @return {boolean} whether the two objects are the same
 * @memberof @node-red/util_util
 */
export function compareObjects(obj1, obj2) {
  let i;
  if (obj1 === obj2) {
    return true;
  }
  if (obj1 === null || obj2 === null) {
    return false;
  }

  const isArray1 = Array.isArray(obj1);
  const isArray2 = Array.isArray(obj2);
  if (isArray1 !== isArray2) {
    return false;
  }
  if (isArray1 && isArray2) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    for (i = 0; i < obj1.length; i++) {
      if (!compareObjects(obj1[i], obj2[i])) {
        return false;
      }
    }
    return true;
  }
  const isBuffer1 = Buffer.isBuffer(obj1);
  const isBuffer2 = Buffer.isBuffer(obj2);
  if (isBuffer1 !== isBuffer2) {
    return false;
  }
  if (isBuffer1 && isBuffer2) {
    if (obj1.equals) {
      // For node 0.12+ - use the native equals
      return obj1.equals(obj2);
    }
    if (obj1.length !== obj2.length) {
      return false;
    }
    for (i = 0; i < obj1.length; i++) {
      if (obj1.readUInt8(i) !== obj2.readUInt8(i)) {
        return false;
      }
    }
    return true;
  }

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const k in obj1) {
    /* istanbul ignore else */
    if (hasOwnProperty.call(obj1, k)) {
      if (!compareObjects(obj1[k], obj2[k])) {
        return false;
      }
    }
  }
  return true;
}

const createError = (code, message) => new Error(message, code);

/**
 * Parses a property expression, such as `msg.foo.bar[3]` to validate it
 * and convert it to a canonical version expressed as an Array of property
 * names.
 *
 * For example, `a["b"].c` returns `['a','b','c']`
 *
 * If `msg` is provided, any internal cross-references will be evaluated against that
 * object. Otherwise, it will return a nested set of properties
 *
 * For example, without msg set, 'a[msg.foo]' returns `['a', [ 'msg', 'foo'] ]`
 * But if msg is set to '{"foo": "bar"}', 'a[msg.foo]' returns `['a', 'bar' ]`
 *
 * @param  {String} str - the property expression
 * @return {Array} the normalised expression
 * @memberof @node-red/util_util
 */
export function normalisePropertyExpression(str, msg, toString?) {
  // This must be kept in sync with validatePropertyExpression
  // in editor/js/ui/utils.js

  const length = str.length;
  if (length === 0) {
    throw createError('INVALID_EXPR', 'Invalid property expression: zero-length');
  }
  const parts = [];
  let start = 0;
  let inString = false;
  let inBox = false;
  let quoteChar;
  let v;
  for (let i = 0; i < length; i++) {
    const c = str[i];
    if (!inString) {
      if (c === "'" || c === '"') {
        if (i !== start) {
          throw createError('INVALID_EXPR', 'Invalid property expression: unexpected ' + c + ' at position ' + i);
        }
        inString = true;
        quoteChar = c;
        start = i + 1;
      } else if (c === '.') {
        if (i === 0) {
          throw createError('INVALID_EXPR', 'Invalid property expression: unexpected . at position 0');
        }
        if (start !== i) {
          v = str.substring(start, i);
          if (/^\d+$/.test(v)) {
            parts.push(parseInt(v));
          } else {
            parts.push(v);
          }
        }
        if (i === length - 1) {
          throw createError('INVALID_EXPR', 'Invalid property expression: unterminated expression');
        }
        // Next char is first char of an identifier: a-z 0-9 $ _
        if (!/[a-z0-9$_]/i.test(str[i + 1])) {
          throw createError('INVALID_EXPR', 'Invalid property expression: unexpected ' + str[i + 1] + ' at position ' + (i + 1));
        }
        start = i + 1;
      } else if (c === '[') {
        if (i === 0) {
          throw createError('INVALID_EXPR', 'Invalid property expression: unexpected ' + c + ' at position ' + i);
        }
        if (start !== i) {
          parts.push(str.substring(start, i));
        }
        if (i === length - 1) {
          throw createError('INVALID_EXPR', 'Invalid property expression: unterminated expression');
        }
        // Start of a new expression. If it starts with msg it is a nested expression
        // Need to scan ahead to find the closing bracket
        if (/^msg[.[]/.test(str.substring(i + 1))) {
          let depth = 1;
          let inLocalString = false;
          let localStringQuote;
          for (let j = i + 1; j < length; j++) {
            if (/["']/.test(str[j])) {
              if (inLocalString) {
                if (str[j] === localStringQuote) {
                  inLocalString = false;
                }
              } else {
                inLocalString = true;
                localStringQuote = str[j];
              }
            }
            if (str[j] === '[') {
              depth++;
            } else if (str[j] === ']') {
              depth--;
            }
            if (depth === 0) {
              try {
                if (msg) {
                  const crossRefProp = getMessageProperty(msg, str.substring(i + 1, j));
                  if (crossRefProp === undefined) {
                    throw createError(
                      'INVALID_EXPR',
                      'Invalid expression: undefined reference at position ' + (i + 1) + ' : ' + str.substring(i + 1, j)
                    );
                  }
                  parts.push(crossRefProp);
                } else {
                  parts.push(normalisePropertyExpression(str.substring(i + 1, j), msg));
                }
                inBox = false;
                i = j;
                start = j + 1;
                break;
              } catch (err) {
                throw createError('INVALID_EXPR', 'Invalid expression started at position ' + (i + 1));
              }
            }
          }
          if (depth > 0) {
            throw createError('INVALID_EXPR', "Invalid property expression: unmatched '[' at position " + i);
          }
          continue;
        } else if (!/["'\d]/.test(str[i + 1])) {
          // Next char is either a quote or a number
          throw createError('INVALID_EXPR', 'Invalid property expression: unexpected ' + str[i + 1] + ' at position ' + (i + 1));
        }
        start = i + 1;
        inBox = true;
      } else if (c === ']') {
        if (!inBox) {
          throw createError('INVALID_EXPR', 'Invalid property expression: unexpected ' + c + ' at position ' + i);
        }
        if (start != i) {
          v = str.substring(start, i);
          if (/^\d+$/.test(v)) {
            parts.push(parseInt(v));
          } else {
            throw createError('INVALID_EXPR', 'Invalid property expression: unexpected array expression at position ' + start);
          }
        }
        start = i + 1;
        inBox = false;
      } else if (c === ' ') {
        throw createError('INVALID_EXPR', "Invalid property expression: unexpected ' ' at position " + i);
      }
    } else if (c === quoteChar) {
      if (i - start === 0) {
        throw createError('INVALID_EXPR', 'Invalid property expression: zero-length string at position ' + start);
      }
      parts.push(str.substring(start, i));
      // If inBox, next char must be a ]. Otherwise it may be [ or .
      if (inBox && !/\]/.test(str[i + 1])) {
        throw createError('INVALID_EXPR', 'Invalid property expression: unexpected array expression at position ' + start);
      } else if (!inBox && i + 1 !== length && !/[\[\.]/.test(str[i + 1])) {
        throw createError('INVALID_EXPR', 'Invalid property expression: unexpected ' + str[i + 1] + ' expression at position ' + (i + 1));
      }
      start = i + 1;
      inString = false;
    }
  }
  if (inBox || inString) {
    throw createError('INVALID_EXPR', 'Invalid property expression: unterminated expression');
  }
  if (start < length) {
    parts.push(str.substring(start));
  }

  if (toString) {
    let result = parts.shift();
    while (parts.length > 0) {
      let p = parts.shift();
      if (typeof p === 'string') {
        if (/"/.test(p)) {
          p = "'" + p + "'";
        } else {
          p = '"' + p + '"';
        }
      }
      result = result + '[' + p + ']';
    }
    return result;
  }

  return parts;
}

/**
 * Gets a property of a message object.
 *
 * Unlike {@link @node-red/util-util.getObjectProperty}, this function will strip `msg.` from the
 * front of the property expression if present.
 *
 * @param  {Object} msg - the message object
 * @param  {String} expr - the property expression
 * @return {any} the message property, or undefined if it does not exist
 * @throws Will throw an error if the *parent* of the property does not exist
 * @memberof @node-red/util_util
 */
export function getMessageProperty(msg, expr) {
  if (expr.indexOf('msg.') === 0) {
    expr = expr.substring(4);
  }
  return getObjectProperty(msg, expr);
}

/**
 * Gets a property of an object.
 *
 * Given the object:
 *
 *     {
 *       "pet": {
 *           "type": "cat"
 *       }
 *     }
 *
 * - `pet.type` will return `"cat"`.
 * - `pet.name` will return `undefined`
 * - `car` will return `undefined`
 * - `car.type` will throw an Error (as `car` does not exist)
 *
 * @param  {Object} msg - the object
 * @param  {String} expr - the property expression
 * @return {any} the object property, or undefined if it does not exist
 * @throws Will throw an error if the *parent* of the property does not exist
 * @memberof @node-red/util_util
 */
export function getObjectProperty(msg, expr) {
  let result = null;
  const msgPropParts = normalisePropertyExpression(expr, msg);
  msgPropParts.reduce(function (obj, key) {
    result = typeof obj[key] !== 'undefined' ? obj[key] : undefined;
    return result;
  }, msg);
  return result;
}

/**
 * Sets a property of a message object.
 *
 * Unlike {@link @node-red/util-util.setObjectProperty}, this function will strip `msg.` from the
 * front of the property expression if present.
 *
 * @param  {Object}  msg           - the message object
 * @param  {String}  prop          - the property expression
 * @param  {any}     value         - the value to set
 * @param  {boolean} createMissing - whether to create missing parent properties
 * @memberof @node-red/util_util
 */
export function setMessageProperty(msg, prop, value, createMissing) {
  if (prop.indexOf('msg.') === 0) {
    prop = prop.substring(4);
  }
  return setObjectProperty(msg, prop, value, createMissing);
}

/**
 * Sets a property of an object.
 *
 * @param  {Object}  msg           - the object
 * @param  {String}  prop          - the property expression
 * @param  {any}     value         - the value to set
 * @param  {boolean} createMissing - whether to create missing parent properties
 * @memberof @node-red/util_util
 */
export function setObjectProperty(msg, prop, value, createMissing) {
  if (typeof createMissing === 'undefined') {
    createMissing = typeof value !== 'undefined';
  }
  const msgPropParts = normalisePropertyExpression(prop, msg);
  const length = msgPropParts.length;
  let obj = msg;
  let key;
  for (let i = 0; i < length - 1; i++) {
    key = msgPropParts[i];
    if (typeof key === 'string' || (typeof key === 'number' && !Array.isArray(obj))) {
      if (hasOwnProperty.call(obj, key)) {
        if (length > 1 && ((typeof obj[key] !== 'object' && typeof obj[key] !== 'function') || obj[key] === null)) {
          // Break out early as we cannot create a property beneath
          // this type of value
          return false;
        }
        obj = obj[key];
      } else if (createMissing) {
        if (typeof msgPropParts[i + 1] === 'string') {
          obj[key] = {};
        } else {
          obj[key] = [];
        }
        obj = obj[key];
      } else {
        return false;
      }
    } else if (typeof key === 'number') {
      // obj is an array
      if (obj[key] === undefined) {
        if (createMissing) {
          if (typeof msgPropParts[i + 1] === 'string') {
            obj[key] = {};
          } else {
            obj[key] = [];
          }
          obj = obj[key];
        } else {
          return false;
        }
      } else {
        obj = obj[key];
      }
    }
  }
  key = msgPropParts[length - 1];
  if (typeof value === 'undefined') {
    if (typeof key === 'number' && Array.isArray(obj)) {
      obj.splice(key, 1);
    } else {
      delete obj[key];
    }
  } else if (typeof obj === 'object' && obj !== null) {
    obj[key] = value;
  } else {
    // Cannot set a property of a non-object/array
    return false;
  }
  return true;
}

/* !
 * Get value of environment variable.
 * @param {Node} node - accessing node
 * @param {String} name - name of variable
 * @return {String} value of env var
 */
export function getSetting(node, name, flow_) {
  if (node) {
    if (name === 'NR_NODE_NAME') {
      return node.name;
    }
    if (name === 'NR_NODE_ID') {
      return node.id;
    }
    if (name === 'NR_NODE_PATH') {
      return node._path;
    }
  }
  const flow = flow_ || (node ? node._flow : null);
  if (flow) {
    if (node && node.g) {
      const group = flow.getGroupNode(node.g);
      const [result, newName] = flow.getGroupEnvSetting(node, group, name);
      if (result) {
        return result.val;
      }
      name = newName;
    }
    return flow.getSetting(name);
  }
  return process.env[name];
}

/**
 * Checks if a String contains any Environment Variable specifiers and returns
 * it with their values substituted in place.
 *
 * For example, if the env var `WHO` is set to `Joe`, the string `Hello ${WHO}!`
 * will return `Hello Joe!`.
 * @param  {String} value - the string to parse
 * @param  {Node} node - the node evaluating the property
 * @return {String} The parsed string
 * @memberof @node-red/util_util
 */
function evaluateEnvProperty(value, node) {
  const flow = node && hasOwnProperty.call(node, '_flow') ? node._flow : null;
  let result;
  if (/^\${[^}]+}$/.test(value)) {
    // ${ENV_VAR}
    const name = value.substring(2, value.length - 1);
    result = getSetting(node, name, flow);
  } else if (!/\${\S+}/.test(value)) {
    // ENV_VAR
    result = getSetting(node, value, flow);
  } else {
    // FOO${ENV_VAR}BAR
    return value.replace(/\${([^}]+)}/g, function (match, name) {
      const val = getSetting(node, name, flow);
      return val === undefined ? '' : val;
    });
  }
  return result === undefined ? '' : result;
}

/**
 * Parses a context property string, as generated by the TypedInput, to extract
 * the store name if present.
 *
 * For example, `#:(file)::foo` results in ` { store: "file", key: "foo" }`.
 *
 * @param  {String} key - the context property string to parse
 * @return {Object} The parsed property
 * @memberof @node-red/util_util
 */
export function parseContextStore(key) {
  const parts: Record<string, any> = {};
  const m = /^#:\((\S+?)\)::(.*)$/.exec(key);
  if (m) {
    parts.store = m[1];
    parts.key = m[2];
  } else {
    parts.key = key;
  }
  return parts;
}

/**
 * Evaluates a property value according to its type.
 *
 * @param  {String}   value    - the raw value
 * @param  {String}   type     - the type of the value
 * @param  {Node}     node     - the node evaluating the property
 * @param  {Object}   msg      - the message object to evaluate against
 * @param  {Function} callback - (optional) called when the property is evaluated
 * @return {any} The evaluted property, if no `callback` is provided
 * @memberof @node-red/util_util
 */
export function evaluateNodeProperty(value, type, node, msg, callback) {
  let result = value;
  if (type === 'str') {
    result = '' + value;
  } else if (type === 'num') {
    result = Number(value);
  } else if (type === 'json') {
    result = JSON.parse(value);
  } else if (type === 're') {
    result = new RegExp(value);
  } else if (type === 'date') {
    result = Date.now();
  } else if (type === 'bin') {
    const data = JSON.parse(value);
    if (Array.isArray(data) || typeof data === 'string') {
      result = Buffer.from(data);
    } else {
      throw createError('INVALID_BUFFER_DATA', 'Not string or array');
    }
  } else if (type === 'msg' && msg) {
    try {
      result = getMessageProperty(msg, value);
    } catch (err) {
      if (callback) {
        callback(err);
      } else {
        throw err;
      }
      return;
    }
  } else if ((type === 'flow' || type === 'global') && node) {
    const contextKey = parseContextStore(value);
    if (/\[msg/.test(contextKey.key)) {
      // The key has a nest msg. reference to evaluate first
      contextKey.key = normalisePropertyExpression(contextKey.key, msg, true);
    }
    result = node.context()[type].get(contextKey.key, contextKey.store, callback);
    if (callback) {
      return;
    }
  } else if (type === 'bool') {
    result = /^true$/i.test(value);
  } else if (type === 'jsonata') {
    const expr = prepareJSONataExpression(value, node);
    result = evaluateJSONataExpression(expr, msg);
  } else if (type === 'env') {
    result = evaluateEnvProperty(value, node);
  }
  if (callback) {
    callback(null, result);
  } else {
    return result;
  }
}

/**
 * Prepares a JSONata expression for evaluation.
 * This attaches Node-RED specific functions to the expression.
 *
 * @param  {String} value - the JSONata expression
 * @param  {Node}   node  - the node evaluating the property
 * @return {Object} The JSONata expression that can be evaluated
 * @memberof @node-red/util_util
 */
export function prepareJSONataExpression(value, node) {
  const expr = jsonata(value);
  expr.assign('flowContext', function (val, store) {
    return node.context().flow.get(val, store);
  });
  expr.assign('globalContext', function (val, store) {
    return node.context().global.get(val, store);
  });
  expr.assign('env', function (name) {
    const val = getSetting(node, name, node._flow);
    if (typeof val !== 'undefined') {
      return val;
    }
    return '';
  });
  expr.assign('moment', function (arg1, arg2, arg3, arg4) {
    return moment(arg1, arg2, arg3, arg4);
  });
  expr.registerFunction('clone', cloneMessage, '<(oa)-:o>');
  // @ts-ignore
  expr._legacyMode = /(^|[^a-zA-Z0-9_'".])msg([^a-zA-Z0-9_'"]|$)/.test(value);
  // @ts-ignore
  expr._node = node;
  return expr;
}

/**
 * Evaluates a JSONata expression.
 * The expression must have been prepared with {@link @node-red/util-util.prepareJSONataExpression}
 * before passing to this function.
 *
 * @param  {Object}   expr     - the prepared JSONata expression
 * @param  {Object}   msg      - the message object to evaluate against
 * @param  {Function} callback - (optional) called when the expression is evaluated
 * @return {any} If no callback was provided, the result of the expression
 * @memberof @node-red/util_util
 */
export function evaluateJSONataExpression(expr, msg, callback?) {
  let context = msg;
  if (expr._legacyMode) {
    context = { msg };
  }
  const bindings: Record<string, any> = {};

  if (callback) {
    // If callback provided, need to override the pre-assigned sync
    // context functions to be their async variants
    bindings.flowContext = function (val, store) {
      return new Promise((resolve, reject) => {
        expr._node.context().flow.get(val, store, function (err, value) {
          if (err) {
            reject(err);
          } else {
            resolve(value);
          }
        });
      });
    };
    bindings.globalContext = function (val, store) {
      return new Promise((resolve, reject) => {
        expr._node.context().global.get(val, store, function (err, value) {
          if (err) {
            reject(err);
          } else {
            resolve(value);
          }
        });
      });
    };
  }
  return expr.evaluate(context, bindings, callback);
}

/**
 * Normalise a node type name to camel case.
 *
 * For example: `a-random node type` will normalise to `aRandomNodeType`
 *
 * @param  {String} name - the node type
 * @return {String} The normalised name
 * @memberof @node-red/util_util
 */
export function normaliseNodeTypeName(name) {
  let result = name.replace(/[^a-zA-Z0-9]/g, ' ');
  result = result.trim();
  result = result.replace(/ +/g, ' ');
  result = result.replace(/ ./g, function (s) {
    return s.charAt(1).toUpperCase();
  });
  result = result.charAt(0).toLowerCase() + result.slice(1);
  return result;
}

/**
 * Encode an object to JSON without losing information about non-JSON types
 * such as Buffer and Function.
 *
 * *This function is closely tied to its reverse within the editor*
 *
 * @param  {Object} msg
 * @param {Object} opts
 * @return {Object} the encoded object
 * @memberof @node-red/util_util
 */
export function encodeObject(msg, opts) {
  let debuglength = 1000;
  try {
    if (opts && hasOwnProperty.call(opts, 'maxLength')) {
      debuglength = opts.maxLength;
    }
    const msgType = typeof msg.msg;
    if (msg.msg instanceof Error) {
      msg.format = 'error';
      const errorMsg: Record<string, any> = {};
      if (msg.msg.name) {
        errorMsg.name = msg.msg.name;
      }
      if (hasOwnProperty.call(msg.msg, 'message')) {
        errorMsg.message = msg.msg.message;
      } else {
        errorMsg.message = msg.msg.toString();
      }
      msg.msg = JSON.stringify(errorMsg);
    } else if (msg.msg instanceof Buffer) {
      msg.format = 'buffer[' + msg.msg.length + ']';
      msg.msg = msg.msg.toString('hex');
      if (msg.msg.length > debuglength) {
        msg.msg = msg.msg.substring(0, debuglength);
      }
    } else if (msg.msg && msgType === 'object') {
      try {
        msg.format = constructorName(msg.msg) || 'Object';
        // Handle special case of msg.req/res objects from HTTP In node
        if (msg.format === 'IncomingMessage' || msg.format === 'ServerResponse') {
          msg.format = 'Object';
        }
      } catch (err) {
        msg.format = 'Object';
      }
      if (/error/i.test(msg.format)) {
        msg.msg = JSON.stringify({
          name: msg.msg.name,
          message: msg.msg.message
        });
      } else {
        const isArray = util.isArray(msg.msg);
        let needsStringify = isArray;
        if (isArray) {
          msg.format = 'array[' + msg.msg.length + ']';
          if (msg.msg.length > debuglength) {
            // msg.msg = msg.msg.slice(0,debuglength);
            msg.msg = {
              __enc__: true,
              type: 'array',
              data: msg.msg.slice(0, debuglength),
              length: msg.msg.length
            };
          }
        } else if (constructorName(msg.msg) === 'Set') {
          msg.format = 'set[' + msg.msg.size + ']';
          msg.msg = {
            __enc__: true,
            type: 'set',
            data: Array.from(msg.msg).slice(0, debuglength),
            length: msg.msg.size
          };
          needsStringify = true;
        } else if (constructorName(msg.msg) === 'Map') {
          msg.format = 'map';
          msg.msg = {
            __enc__: true,
            type: 'map',
            // @ts-ignore
            data: Object.fromEntries(Array.from(msg.msg.entries()).slice(0, debuglength)),
            length: msg.msg.size
          };
          needsStringify = true;
        } else if (constructorName(msg.msg) === 'RegExp') {
          msg.format = 'regexp';
          msg.msg = msg.msg.toString();
        }
        if (needsStringify || msg.format === 'Object') {
          msg.msg = safeJSONStringify(msg.msg, function (key, value) {
            if (key === '_req' || key === '_res') {
              value = {
                __enc__: true,
                type: 'internal'
              };
            } else if (value instanceof Error) {
              value = value.toString();
            } else if (util.isArray(value) && value.length > debuglength) {
              value = {
                __enc__: true,
                type: 'array',
                data: value.slice(0, debuglength),
                length: value.length
              };
            } else if (typeof value === 'string') {
              if (value.length > debuglength) {
                value = value.substring(0, debuglength) + '...';
              }
            } else if (typeof value === 'function') {
              value = {
                __enc__: true,
                type: 'function'
              };
            } else if (typeof value === 'number') {
              if (isNaN(value) || value === Infinity || value === -Infinity) {
                value = {
                  __enc__: true,
                  type: 'number',
                  data: value.toString()
                };
              }
            } else if (typeof value === 'bigint') {
              value = {
                __enc__: true,
                type: 'bigint',
                data: value.toString()
              };
            } else if (value && value.constructor) {
              if (value.type === 'Buffer') {
                value.__enc__ = true;
                value.length = value.data.length;
                if (value.length > debuglength) {
                  value.data = value.data.slice(0, debuglength);
                }
              } else if (constructorName(value) === 'ServerResponse') {
                value = '[internal]';
              } else if (constructorName(value) === 'Socket') {
                value = '[internal]';
              } else if (constructorName(value) === 'Set') {
                value = {
                  __enc__: true,
                  type: 'set',
                  data: Array.from(value).slice(0, debuglength),
                  length: value.size
                };
              } else if (constructorName(value) === 'Map') {
                value = {
                  __enc__: true,
                  type: 'map',
                  // @ts-ignore
                  data: Object.fromEntries(Array.from(value.entries()).slice(0, debuglength)),
                  length: value.size
                };
              } else if (constructorName(value) === 'RegExp') {
                value = {
                  __enc__: true,
                  type: 'regexp',
                  data: value.toString()
                };
              }
            } else if (value === undefined) {
              value = {
                __enc__: true,
                type: 'undefined'
              };
            }
            return value;
          });
        } else {
          try {
            msg.msg = msg.msg.toString();
          } catch (e) {
            msg.msg = '[Type not printable]' + util.inspect(msg.msg);
          }
        }
      }
    } else if (msgType === 'function') {
      msg.format = 'function';
      msg.msg = '[function]';
    } else if (msgType === 'boolean') {
      msg.format = 'boolean';
      msg.msg = msg.msg.toString();
    } else if (msgType === 'number') {
      msg.format = 'number';
      msg.msg = msg.msg.toString();
    } else if (msgType === 'bigint') {
      msg.format = 'bigint';
      msg.msg = {
        __enc__: true,
        type: 'bigint',
        data: msg.msg.toString()
      };
    } else if (msg.msg === null || msgType === 'undefined') {
      msg.format = msg.msg === null ? 'null' : 'undefined';
      msg.msg = '(undefined)';
    } else {
      msg.format = 'string[' + msg.msg.length + ']';
      if (msg.msg.length > debuglength) {
        msg.msg = msg.msg.substring(0, debuglength) + '...';
      }
    }
    return msg;
  } catch (e) {
    msg.format = 'error';
    const errorMsg: Record<string, any> = {};
    if (e.name) {
      errorMsg.name = e.name;
    }
    if (hasOwnProperty.call(e, 'message')) {
      errorMsg.message = 'encodeObject Error: [' + e.message + '] Value: ' + util.inspect(msg.msg);
    } else {
      errorMsg.message = 'encodeObject Error: [' + e.toString() + '] Value: ' + util.inspect(msg.msg);
    }
    if (errorMsg.message.length > debuglength) {
      errorMsg.message = errorMsg.message.substring(0, debuglength);
    }
    msg.msg = JSON.stringify(errorMsg);
    return msg;
  }
}
