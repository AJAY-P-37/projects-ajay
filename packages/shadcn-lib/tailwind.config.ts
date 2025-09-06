import tailwindcssAnimate from "tailwindcss-animate";
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector"],
  content: [
    "./src/**/**/*.{js,ts,jsx,tsx}", // library
    "../../apps/frontend/src/**/*.{js,ts,jsx,tsx}", // frontend app
  ],
  plugins: [tailwindcssAnimate],
};

export default config;
