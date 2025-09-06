import type { Config } from "tailwindcss";

const config: Config = {
  // darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx}", "../../packages/shadcn-lib/src/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("tailwindcss-animate")],
};
export default config;
