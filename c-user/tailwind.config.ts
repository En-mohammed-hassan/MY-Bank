import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bank: {
          navy: "#0f2744",
          teal: "#0d9488",
          slate: "#1e293b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
