// astro.config.mjs

import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  output: "server",
  adapter: vercel({
    rewrites: [
      {
        source: "/api/(.*)",
        destination: "/api/[...catchall].js"
      }
    ]
  }),
  integrations: [react(), tailwind()]
});