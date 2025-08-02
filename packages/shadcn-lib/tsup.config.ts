import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/**/*.{ts,tsx}"],
  dts: true,
  clean: true,
  sourcemap: true,
  format: ["esm", "cjs"],
  outDir: "dist",
  target: "node16",
  external: ["react", "react-dom"],
});
