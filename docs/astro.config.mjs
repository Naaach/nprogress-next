import { defineConfig } from 'astro/config';
import { site, base } from './src/config.js';

export default defineConfig({
  site,
  base,
  output: 'static',
  adapter: undefined,
  integrations: [],
  vite: {
    ssr: {
      noExternal: ['nprogress-next', 'nprogress-next-react', 'nprogress-next-vue']
    }
  }
});