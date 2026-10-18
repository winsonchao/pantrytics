import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig, type Plugin } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

/**
 * Compatibility shim: TanStack Start 1.169 internally uses rolldownOptions.input
 * which doesn't exist in Vite 6's rollupOptions API. This plugin mirrors the value.
 */
function syncRolldownToRollupPlugin(): Plugin {
  return {
    name: 'sync-rolldown-to-rollup',
    config(config) {
      if (config.environments) {
        for (const [, env] of Object.entries(config.environments)) {
          const envBuild = (env as any)?.build
          if (envBuild?.rolldownOptions?.input && !envBuild?.rollupOptions?.input) {
            envBuild.rollupOptions = {
              ...envBuild.rollupOptions,
              input: envBuild.rolldownOptions.input,
            }
          }
        }
      }
    },
  }
}

// The Cloudflare plugin runs the dev server inside miniflare, which only works
// under Node.js. Enable it for builds only so `bun dev` uses Vite's own server.
export default defineConfig(({ command }) => ({
  server: {
    port: 3000,
  },
  plugins: [
    command === 'build' && cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    syncRolldownToRollupPlugin(),
    viteReact(),
  ],
}))
