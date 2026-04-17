import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/*
 * Vite config for Anime Pictionary.
 *
 * `base` is driven by the VITE_BASE env var so the GitHub Actions workflow
 * can set it per deploy:
 *   - Project Pages (username.github.io/anime-pictionary/) → VITE_BASE="/anime-pictionary/"
 *   - Custom domain                                        → VITE_BASE="/"
 *
 * Default `/` is safe for local dev and most custom-domain setups.
 *
 * Next steps (if you care): you can set build.rollupOptions.output.manualChunks
 * to split vendor code once the bundle grows — right now it's small enough
 * that a single chunk is faster.
 */
export default defineConfig({
    base: process.env.VITE_BASE ?? "/",
    plugins: [react(), tailwindcss()],
    build: {
        outDir: "dist",
        // The anime-catalog.json is one big static asset. Keep it as one file
        // so a single fetch (and a single CDN cache-hit) loads the whole thing.
        assetsInlineLimit: 0,
        target: "es2022",
    },
    server: {
        port: 5173,
        host: true,
    },
});
