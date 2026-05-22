import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const treatJsFilesAsJsx = () => ({
  name: "treat-js-files-as-jsx",
  async transform(code, id) {
    if (!id.endsWith(".js") || id.includes("node_modules")) {
      return null;
    }
    return transformWithEsbuild(code, id, {
      loader: "jsx",
      jsx: "automatic",
    });
  },
});

export default defineConfig({
  plugins: [treatJsFilesAsJsx(), react()],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  root: __dirname,
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    origin: "http://localhost:20100",
  },
  build: {
    outDir: path.resolve(__dirname, "../../assets"),
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(__dirname, "main.jsx"),
      output: {
        entryFileNames: "js/kirki-ecommerce.bundle.js",
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === "kirki-ecommerce.vendor") {
            return "js/kirki-ecommerce.vendor.js";
          }
          return "js/pages/[name]-[hash].chunk.js";
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "css/kirki-ecommerce.bundle.css";
          }
          return "assets/[name]-[hash][extname]";
        },
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "kirki-ecommerce.vendor";
          }
        },
      },
    },
  },
});
