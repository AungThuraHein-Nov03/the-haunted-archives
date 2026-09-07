import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aungthurahein-nov03.github.io',
  base: '/the-haunted-archives',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
