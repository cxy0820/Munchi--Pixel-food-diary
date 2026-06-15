import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const onnxRuntimeAssets = ["ort-wasm-simd-threaded.asyncify.mjs", "ort-wasm-simd-threaded.asyncify.wasm"];

export default defineConfig({
  root,
  plugins: [
    react(),
    {
      name: "onnx-runtime-assets",
      apply: "build",
      generateBundle() {
        for (const fileName of onnxRuntimeAssets) {
          this.emitFile({
            type: "asset",
            fileName: `assets/${fileName}`,
            source: fs.readFileSync(path.join(root, "node_modules", "onnxruntime-web", "dist", fileName))
          });
        }
      }
    }
  ],
  build: {
    rollupOptions: {
      input: path.join(root, "index.html")
    }
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:4174"
    }
  }
});
