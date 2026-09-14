import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: '.',
  base: './',
  // ExcelJS 在浏览器端依赖 global，vite 默认不提供，需指向 globalThis 以规避运行时 "global is not defined"
  define: {
    global: 'globalThis'
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        assess: resolve(__dirname, 'assess.html'),
        result: resolve(__dirname, 'result.html'),
        admin: resolve(__dirname, 'admin.html'),
        reset: resolve(__dirname, 'reset.html'),
        recover: resolve(__dirname, 'recover.html'),
        rigorAnalysis: resolve(__dirname, 'assessment-rigor-analysis.html'),
        rigorProof: resolve(__dirname, 'assessment-rigor-proof.html'),
      }
    }
  }
});
