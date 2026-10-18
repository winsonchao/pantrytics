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

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    syncRolldownToRollupPlugin(),
    viteReact(),
  ],
})
