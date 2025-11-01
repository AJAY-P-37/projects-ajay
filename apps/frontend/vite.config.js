import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";
// https://vitejs.dev/config/
export default defineConfig((function (_a) {
    var mode = _a.mode;
    return {
        plugins: [react()],
        server: {
            open: true,
            port: 5000,
            // proxy: {
            //   "/api": {
            //     target: "http://127.0.0.1:5001/projects-ajay/asia-south1",
            //     changeOrigin: true,
            //     secure: false,
            //   },
            // },
            watch: {
                ignored: ["**/dist/**", "**/node_modules/**"],
            },
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
                "shadcn-lib": path.resolve(__dirname, "../../packages/shadcn-lib"),
                "common-types": path.resolve(__dirname, "../../packages/common"),
            },
            preserveSymlinks: true,
        },
        build: {
            lib: {
                entry: path.resolve(__dirname, "src/main.tsx"),
                name: "Frontend",
                fileName: "main",
            },
            sourcemap: "inline",
            emptyOutDir: true,
            rollupOptions: {
                external: ["react", "react-dom"],
            },
        },
        define: {
            "import.meta.env.VITE_BUILD_TIMESTAMP": JSON.stringify(new Date().toISOString()),
        },
        optimizeDeps: {
            esbuildOptions: {
                plugins: [],
            },
        },
        envDir: "./",
    };
}));
