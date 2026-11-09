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
          // Paleta oficial La Libertad Avanza Nacional (lalibertadavanza.com.ar)
          primary: "#371859",      // --color-principal (Pantone 2627 C)
          secondary: "#2f0163",    // --color-secundario-01
          deep: "#230552",         // --color-secundario-02
          dark: "#120629",
          violet: "#6c4c99",       // --color-02
          celeste: "#39b5e6",      // --color-01
          magenta: "#b23c8e",      // --color-03
          charcoal: "#1d1d1d",     // --color-07
          surface: "#f5f4f8",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "system-ui", "-apple-system", "sans-serif"],
        montserrat: ["var(--font-montserrat)", "Montserrat", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
