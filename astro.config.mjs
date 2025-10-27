// Archivo: electrical-event/astro.config.mjs (Versión Corregida)

import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: 'https://www.vangoghfusionsetcafe.com', 
  output: "server",
  adapter: vercel(),
  integrations: [react(), tailwind(), sitemap()]
});