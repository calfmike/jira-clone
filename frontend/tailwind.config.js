/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(222, 18%, 9%)",
        foreground: "hsl(213, 20%, 92%)",
        card: "hsl(222, 16%, 12%)",
        border: "hsl(222, 14%, 18%)",
        input: "hsl(222, 14%, 16%)",
        primary: "hsl(217, 91%, 60%)",
        muted: "hsl(222, 14%, 14%)",
        "muted-foreground": "hsl(215, 12%, 50%)",
        accent: "hsl(222, 14%, 18%)",
        sidebar: "hsl(222, 20%, 7%)",
        "sidebar-foreground": "hsl(213, 15%, 70%)",
        "sidebar-border": "hsl(222, 14%, 14%)",
        "sidebar-accent": "hsl(222, 14%, 13%)",
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};