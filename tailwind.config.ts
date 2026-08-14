import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#05060f",
          900: "#0a0c1c",
          800: "#12142b",
        },
        violet: {
          500: "#7c3aed",
          600: "#6d28d9",
        },
        cashlime: {
          400: "#a3e635",
          500: "#84cc16",
        },
        cyan: {
          400: "#22d3ee",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.35), transparent 55%), radial-gradient(circle at 80% 0%, rgba(34,211,238,0.25), transparent 50%), linear-gradient(180deg, #05060f 0%, #0a0c1c 100%)",
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "gradient-x": "gradient-x 6s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;
