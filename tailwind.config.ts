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
          50: "#f4f0fe",
          100: "#ece4fd",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
        },
        cashlime: {
          50: "#f4fbe8",
          400: "#a3e635",
          500: "#84cc16",
          700: "#3f6212",
        },
        cyan: {
          400: "#22d3ee",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.35), transparent 55%), radial-gradient(circle at 80% 0%, rgba(34,211,238,0.25), transparent 50%), linear-gradient(180deg, #05060f 0%, #0a0c1c 100%)",
        "chrome-gradient": "linear-gradient(180deg, #05060f 0%, #12142b 55%, #1b1033 100%)",
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
