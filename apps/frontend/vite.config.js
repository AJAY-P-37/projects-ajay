import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";
// https://vitejs.dev/config/
export default defineConfig((function () {
    return {
        plugins: [react()],
        server: {
            open: true,
            port: 5000,
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
                "shadcn-lib": path.resolve(__dirname, "../../packages/shadcn-lib"),
            },
        },
        build: {
            lib: {
                entry: path.resolve(__dirname, "src/main.tsx"),
                name: "Frontend",
                fileName: "main",
            },
            sourcemap: "inline",
            emptyOutDir: true,
        },
        define: {
            "import.meta.env.VITE_BUILD_TIMESTAMP": JSON.stringify(new Date().toISOString()),
        },
        optimizeDeps: {
            esbuildOptions: {
                plugins: [],
            },
        },
        envDir: "../../",
    };
}));
