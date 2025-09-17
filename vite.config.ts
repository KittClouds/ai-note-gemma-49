import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    },
    // Configure WASM MIME type for development server
    middlewareMode: false,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Add WASM support plugin
    {
      name: 'wasm-support',
      configureServer(server: ViteDevServer) {
        server.middlewares.use('/node_modules', (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.url && req.url.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          }
          next();
        });
      },
      load(id: string) {
        if (id.endsWith('.wasm')) {
          return `export default "${id}";`;
        }
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      // Force LiveStore dependencies to be bundled instead of externalized
      external: [],
      output: {
        manualChunks: (id) => {
          // Bundle all LiveStore dependencies together
          if (id.includes('@livestore')) {
            return 'livestore';
          }
          // Bundle other dependencies
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Ensure WASM files are properly handled
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.wasm')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Increase chunk size warning limit for LiveStore
    chunkSizeWarningLimit: 1000,
    // Ensure all dependencies are bundled
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Add WASM support to build
    assetsInclude: ['**/*.wasm'],
  },
  worker: {
    format: 'es',
    plugins: () => [
      react(),
    ],
    rollupOptions: {
      // Force bundle all LiveStore worker dependencies
      external: [],
      output: {
        // Ensure worker files are properly bundled
        entryFileNames: 'assets/[name]-[hash].js',
        format: 'es',
        // Handle WASM files in workers
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.wasm')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  optimizeDeps: {
    // Include all LiveStore packages in optimization
    include: [
      '@livestore/adapter-web',
      '@livestore/common',
      '@livestore/react',
      '@livestore/livestore',
      '@effect/rpc'
    ],
    // Force re-optimization in development
    force: mode === 'development',
    // Exclude WASM files from pre-bundling
    exclude: ['**/*.wasm'],
  },
  define: {
    // Ensure proper environment variables for LiveStore
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  // Add WASM support
  assetsInclude: ['**/*.wasm'],
  esbuild: {
    // Ensure proper handling of WASM in development
    supported: {
      'top-level-await': true,
    },
  },
}));
