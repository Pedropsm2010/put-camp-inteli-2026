import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";

const SERVER_FN_BASE = "/_serverFn/";

function fixServerFnBasePlugin(): Plugin {
  return {
    name: "fix-server-fn-base",
    enforce: "post",
    transform(code, id) {
      if (
        id.includes("createClientRpc") ||
        id.includes("createServerRpc") ||
        id.includes("createSsrRpc")
      ) {
        code = code.replace(
          "process.env.TSS_SERVER_FN_BASE",
          JSON.stringify(SERVER_FN_BASE),
        );
      }
      return { code };
    },
  };
}

export default defineConfig({
  appType: "custom",
  css: { transformer: "lightningcss" },
  server: { host: "::", port: 8080 },
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
    ignoreOutdatedRequests: true,
  },
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      serverFns: {
        disableIdValidation: true,
      },
    }),
    react(),
    fixServerFnBasePlugin(),
  ],
});
