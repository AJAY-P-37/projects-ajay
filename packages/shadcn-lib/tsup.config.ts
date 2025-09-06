import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/**/*.{ts,tsx,css}"],
  dts: true, // ✅ just pass string path
  clean: true,
  sourcemap: true,
  format: ["esm"],
  outDir: "dist",
  external: ["react", "react-dom"],
  minify: false, // Optional: set true for production
  splitting: false, // Only needed if you have multiple entries
  bundle: false, // Don't bundle node_modules; treat as external
});
