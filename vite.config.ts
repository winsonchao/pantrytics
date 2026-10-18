import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig, type Plugin } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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

// Use Cloudflare plugin when building for Workers deployment
// Installed via: bun add -d @cloudflare/vite-plugin wrangler
let cloudflarePlugin: Plugin | null = null
try {
  // Dynamic import so the app still works locally without the package installed
  const { cloudflare } = await import('@cloudflare/vite-plugin')
  cloudflarePlugin = cloudflare({ viteEnvironment: { name: 'ssr' } })
} catch {
  // @cloudflare/vite-plugin not installed — running in local/Node.js mode
}

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    ...(cloudflarePlugin ? [cloudflarePlugin] : []),
    tailwindcss(),
    tanstackStart(),
    syncRolldownToRollupPlugin(),
    viteReact(),
  ],
})
