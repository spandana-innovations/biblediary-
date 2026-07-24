import adapter from "@sveltejs/adapter-static";
import { fileURLToPath } from "node:url";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // Static hosting on Cloudflare Pages (REBUILD_PLAN §3).
    adapter: adapter({
      fallback: "404.html"
    }),
    // Set BASE_PATH=/biblediary- in CI for GitHub project Pages; empty locally.
    paths: {
      base: process.env.BASE_PATH || ""
    },
    alias: {
      $editions: fileURLToPath(new URL("../../editions", import.meta.url))
    },
    prerender: {
      // Fail loudly on broken internal links so a bad build can't ship.
      handleHttpError: "fail"
    }
  }
};

export default config;
