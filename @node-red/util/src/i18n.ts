/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable no-useless-escape */
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
 * Internationalization utilities
 * @mixin @node-red/util_i18n
 */

import i18next from 'i18next';
import path from 'node:path';
import fs from 'node:fs';

export const defaultLang = 'en-US';

const resourceMap = {};
const resourceCache = {};
let initPromise;

/**
 * Register multiple message catalogs with i18n.
 * @memberof @node-red/util_i18n
 */
export function registerMessageCatalogs(catalogs) {
  const promises = catalogs.map(function (catalog) {
    return registerMessageCatalog(catalog.namespace, catalog.dir, catalog.file).catch(() => {
      // do nothing
    });
  });
  return Promise.all(promises);
}

/**
 * Register a message catalog with i18n.
 * @memberof @node-red/util_i18n
 */
export function registerMessageCatalog(namespace, dir, file) {
  return initPromise.then(function () {
    return new Promise((resolve) => {
      resourceMap[namespace] = { basedir: dir, file, lngs: [] };
      fs.readdir(dir, function (err, files) {
        if (err) {
          resolve(undefined);
        } else {
          files.forEach(function (f) {
            if (fs.existsSync(path.join(dir, f, file))) {
              resourceMap[namespace].lngs.push(f);
            }
          });
          i18next.loadNamespaces(namespace, function () {
            resolve(undefined);
          });
        }
      });
    });
  });
}

function mergeCatalog(fallback, catalog) {
  for (const k in fallback) {
    if (Object.prototype.hasOwnProperty.call(fallback, k)) {
      if (!catalog[k]) {
        catalog[k] = fallback[k];
      } else if (typeof fallback[k] === 'object') {
        mergeCatalog(fallback[k], catalog[k]);
      }
    }
  }
}

async function readFile(lng, ns) {
  if (/[^a-z\-]/i.test(lng)) {
    throw new Error('Invalid language: ' + lng);
  }
  if (resourceCache[ns] && resourceCache[ns][lng]) {
    return resourceCache[ns][lng];
  } else if (resourceMap[ns]) {
    const file = path.join(resourceMap[ns].basedir, lng, resourceMap[ns].file);
    const content = await fs.promises.readFile(file, 'utf8');
    resourceCache[ns] = resourceCache[ns] || {};
    resourceCache[ns][lng] = JSON.parse(content.replace(/^\uFEFF/, ''));
    const baseLng = lng.split('-')[0];
    if (baseLng !== lng && resourceCache[ns][baseLng]) {
      mergeCatalog(resourceCache[ns][baseLng], resourceCache[ns][lng]);
    }
    if (lng !== defaultLang) {
      mergeCatalog(resourceCache[ns][defaultLang], resourceCache[ns][lng]);
    }
    return resourceCache[ns][lng];
  }
  throw new Error('Unrecognised namespace');
}

const MessageFileLoader = {
  type: 'backend',
  init(services, backendOptions, i18nextOptions) {
    // do nothing
  },
  read(lng, ns, callback) {
    readFile(lng, ns)
      .then((data) => callback(null, data))
      .catch((err) => {
        if (/-/.test(lng)) {
          // if reading language file fails -> try reading base language (e. g. 'fr' instead of 'fr-FR' or 'de' for 'de-DE')
          const baseLng = lng.split('-')[0];
          readFile(baseLng, ns)
            .then((baseData) => callback(null, baseData))
            .catch(callback);
        } else {
          callback(err);
        }
      });
  }
};

function getCurrentLocale() {
  const env = process.env;
  for (const name of ['LC_ALL', 'LC_MESSAGES', 'LANG']) {
    if (name in env) {
      const val = env[name];
      return val.substring(0, 2);
    }
  }
  return undefined;
}

export function init(settings) {
  if (!initPromise) {
    initPromise = new Promise((resolve) => {
      // TODO check why MessageFileLoader has wrong type
      i18next.use(MessageFileLoader as never);
      const opt = {
        // debug: true,
        defaultNS: 'runtime',
        ns: [],
        fallbackLng: defaultLang,
        keySeparator: '.',
        nsSeparator: ':',
        interpolation: {
          unescapeSuffix: 'HTML',
          escapeValue: false,
          prefix: '__',
          suffix: '__'
        }
      };
      const lang = settings.lang || getCurrentLocale();
      if (lang) {
        // @ts-ignore
        opt.lng = lang;
      }
      // TODO: check typings for opt
      // eslint-disable-next-line
      i18next.init(opt, resolve);
    });
  }
}

/**
 * Gets a message catalog.
 * @name catalog
 * @function
 * @memberof @node-red/util_i18n
 */
function getCatalog(namespace, lang) {
  let result = null;
  const lng = lang || defaultLang;
  if (/[^a-z\-]/i.test(lang)) {
    throw new Error('Invalid language: ' + lng);
  }

  if (Object.prototype.hasOwnProperty.call(resourceCache, namespace)) {
    result = resourceCache[namespace][lang];
    if (!result) {
      const langParts = lang.split('-');
      if (langParts.length === 2) {
        result = resourceCache[namespace][langParts[0]];
      }
    }
  }
  return result;
}
export const catalog = getCatalog;

/**
 * Gets a list of languages a given catalog is available in.
 * @name availableLanguages
 * @function
 * @memberof @node-red/util_i18n
 */
export function availableLanguages(namespace) {
  if (Object.prototype.hasOwnProperty.call(resourceMap, namespace)) {
    return resourceMap[namespace].lngs;
  }
}

/**
 * The underlying i18n library for when direct access is really needed
 */
export const i = i18next;

/**
 * Perform a message catalog lookup.
 * @name _
 * @function
 * @memberof @node-red/util_i18n
 */
export const _ = i18next.t;
