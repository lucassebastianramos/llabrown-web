import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lla: {
          // Color oficial según Manual de Marca La Libertad Avanza (Pantone 2627 C / RGB 55, 24, 89)
          primary: "#371859",
          dark: "#0e0417",
          deep: "#1a0b2e",
          card: "#200e38",
          border: "#431f6e",
          accent: "#6b2da8",
          light: "#9d5be3",
          gold: {
            DEFAULT: "#fbbf24",
            hover: "#f59e0b",
            light: "#fde68a",
          },
        },
      },
      fontFamily: {
        sans: ["Montserrat", "system-ui", "-apple-system", "sans-serif"],
        montserrat: ["Montserrat", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
