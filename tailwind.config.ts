// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#144336",
          600: "#144336",
          700: "#10372C",
        },
        accent: {
          DEFAULT: "#FBBF24", // amarillo
          600: "#F59E0B",
        },
      },
      fontFamily: {
        display: ["'Albert Sans'", "Montserrat", "Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
