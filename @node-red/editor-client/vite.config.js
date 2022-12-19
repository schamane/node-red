const { resolve } = require('node:path');
const { defineConfig } = require('vite');

// https://vitejs.dev/config/build-options.html#build-lib
export default defineConfig(() => ({
  build: {
    outDir: 'lib',
    target: 'node12',
    lib: {
      entry: resolve(__dirname, 'src', 'index.js'),
      formats: ['cjs'],
      fileName: 'index'
    }
  }
}));
