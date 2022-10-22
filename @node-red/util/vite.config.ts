import { resolve } from 'path';
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import dts from 'vite-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';
// import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
// import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

// https://vitejs.dev/config/build-options.html#build-lib
export default defineConfig(() => ({
  plugins: [
    eslint(),
    dts({
      insertTypesEntry: true
    })
  ],
  resolve: {
    alias: {
      events: 'rollup-plugin-node-polyfills/polyfills/events',
      'node:events': 'rollup-plugin-node-polyfills/polyfills/events',
      util: 'rollup-plugin-node-polyfills/polyfills/util',
      'node:util': 'rollup-plugin-node-polyfills/polyfills/util',
      sys: 'util'
    }
  },
  /*
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
      // Enable esbuild polyfill plugins
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
          util: true,
          events: true
        }),
        NodeModulesPolyfillPlugin()
      ]
    }
  },
  */
  build: {
    outDir: 'lib',
    target: 'node12',
    lib: {
      entry: resolve(__dirname, 'src', 'index.ts'),
      formats: ['cjs'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'events',
        'node:events',
        'util',
        'node:util',
        'fs',
        'node:fs',
        'path',
        'node:path',
        'process',
        'os',
        'events',
        'node:events',
        'util',
        'node:util',
        'fs',
        'node:fs',
        'path',
        'node:path',
        'process',
        'os',
        'i18next',
        'json-stringify-safe',
        'jsonata',
        'lodash.clonedeep',
        'moment-timezone'
      ],
      plugins: [nodeResolve()]
    },
    sourcemap: true
  }
}));
