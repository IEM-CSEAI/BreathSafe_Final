const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        border: token("border"),
        fg: token("text"),
        muted: token("muted"),
        accent: token("accent"),
        ok: token("ok"),
        info: token("info"),
        warn: token("warn"),
        danger: token("danger"),
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        display: ["Syne", "system-ui", "sans-serif"],
        diagnosis: ['"Share Tech Mono"', '"Courier New"', "monospace"],
      },
    },
  },
  plugins: [],
};