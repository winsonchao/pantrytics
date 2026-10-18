import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig, type Plugin } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function syncRolldownToRollupPlugin(): Plugin {
  return {
    name: 'sync-rolldown-to-rollup',
    config(config) {
      if (config.environments) {
        for (const [name, env] of Object.entries(config.environments)) {
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
    tailwindcss(),
    tanstackStart(),
    syncRolldownToRollupPlugin(),
    viteReact(),
  ],
})
