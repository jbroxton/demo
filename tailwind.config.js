/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring))",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary))",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary))",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive))",
          foreground: "oklch(var(--destructive-foreground))",
        },
        warning: {
          DEFAULT: "oklch(var(--warning))",
          foreground: "oklch(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted))",
          foreground: "oklch(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "oklch(var(--accent))",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "drop-in": {
          "0%": { 
            transform: "translateY(-100%)",
            opacity: "0" 
          },
          "100%": { 
            transform: "translateY(0)",
            opacity: "1" 
          },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-left": {
          "0%": { 
            transform: "translateX(-100%)",
            opacity: "0" 
          },
          "100%": { 
            transform: "translateX(0)",
            opacity: "1" 
          },
        },
        "wave-left": {
          "0%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(-30deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        "wave-right": {
          "0%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(30deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        "dance-leg-left": {
          "0%": { transform: "translateY(0)" },
          "25%": { transform: "translateY(-5px)" },
          "50%": { transform: "translateY(0)" },
          "75%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(0)" },
        },
        "dance-leg-right": {
          "0%": { transform: "translateY(0)" },
          "25%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
          "75%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(0)" },
        },
        "blink-left": {
          "0%": { opacity: "1" },
          "48%": { opacity: "1" },
          "50%": { opacity: "0.2" },
          "52%": { opacity: "1" },
          "98%": { opacity: "1" },
          "100%": { opacity: "0.2" },
        },
        "blink-right": {
          "0%": { opacity: "1" },
          "28%": { opacity: "1" },
          "30%": { opacity: "0.2" },
          "32%": { opacity: "1" },
          "78%": { opacity: "1" },
          "80%": { opacity: "0.2" },
          "82%": { opacity: "1" },
        },
        "slight-tilt": {
          "0%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(2deg)" },
          "75%": { transform: "rotate(-2deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        "pulse-slow": {
          "0%": { opacity: "0.6" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.6" },
        },
        "pulse-delayed": {
          "0%": { opacity: "0.7" },
          "40%": { opacity: "0.7" },
          "60%": { opacity: "1" },
          "80%": { opacity: "0.7" },
          "100%": { opacity: "0.7" },
        },
        "pulse-random": {
          "0%": { opacity: "0.7" },
          "20%": { opacity: "1" },
          "40%": { opacity: "0.7" },
          "60%": { opacity: "0.9" },
          "80%": { opacity: "0.7" },
          "90%": { opacity: "1" },
          "100%": { opacity: "0.7" },
        },
        "pulse-core": {
          "0%": { opacity: "0.7", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
          "100%": { opacity: "0.7", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%": { opacity: "0.1" },
          "50%": { opacity: "0.2" },
          "100%": { opacity: "0.1" },
        },
        "glow": {
          "0%": { filter: "brightness(1) drop-shadow(0 0 2px #ff3333)" },
          "50%": { filter: "brightness(1.5) drop-shadow(0 0 8px #ff3333)" },
          "100%": { filter: "brightness(1) drop-shadow(0 0 2px #ff3333)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "drop-in": "drop-in 0.5s ease-out forwards",
        "spin-slow": "spin-slow 5s linear infinite",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-in-left": "slide-in-left 0.5s ease-out forwards",
        "wave-left": "wave-left 1s ease-in-out infinite",
        "wave-right": "wave-right 1s ease-in-out infinite",
        "dance-leg-left": "dance-leg-left 2s ease-in-out infinite",
        "dance-leg-right": "dance-leg-right 2s ease-in-out infinite",
        "blink-left": "blink-left 4s ease-in-out infinite",
        "blink-right": "blink-right 5s ease-in-out infinite", 
        "slight-tilt": "slight-tilt 4s ease-in-out infinite",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "pulse-delayed": "pulse-delayed 2s ease-in-out infinite",
        "pulse-random": "pulse-random 2.5s ease-in-out infinite",
        "pulse-core": "pulse-core 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 