import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        abyss: "#050816",
        night: "#0d1328",
        cyan: "#5ef2ff",
        mint: "#5bffa5",
        ember: "#ff9766",
        ink: "#d7def0"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(94, 242, 255, 0.16), 0 24px 80px rgba(3, 10, 24, 0.55)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        flip: {
          "0%": { transform: "rotateY(0deg) scale(1)" },
          "50%": { transform: "rotateY(900deg) scale(1.06)" },
          "100%": { transform: "rotateY(1800deg) scale(1)" }
        },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(91, 255, 165, 0.45)" },
          "100%": { boxShadow: "0 0 0 18px rgba(91, 255, 165, 0)" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        flip: "flip 900ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        pulseRing: "pulseRing 1.2s ease-out infinite"
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)"],
        body: ["var(--font-manrope)"],
        mono: ["var(--font-plex-mono)"]
      }
    }
  },
  plugins: []
};

export default config;
