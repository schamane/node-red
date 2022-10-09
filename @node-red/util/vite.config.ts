/* eslint-disable */
import {resolve} from 'path';
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import dts from 'vite-plugin-dts';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import nodePolyfills from 'rollup-plugin-polyfill-node';

// https://vitejs.dev/config/build-options.html#build-lib
export default defineConfig(() => ({
  plugins: [
    eslint(),
    dts({
      insertTypesEntry: true,
    }),
  ],
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
                buffer: true
            }),
            NodeModulesPolyfillPlugin()
        ]
    }
  },
  build: {
    outDir: 'lib',
    target: "node12",
    lib: {
      entry: resolve(__dirname, 'src', 'index.ts'),
      formats: ['cjs'],
      fileName: 'index'
    },
    rollupOptions: {
      plugins: [nodePolyfills()],
    },
    sourcemap: true
  }
}));
