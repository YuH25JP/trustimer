/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#f8f7f2",
          dark: "#141414",
          muted: "#eceae2",
          border: "#262626",
        },
        sumi: {
          DEFAULT: "#18181b",
          light: "#27272a",
          dark: "#09090b",
          muted: "#71717a",
        },
        vermilion: {
          DEFAULT: "#d64045",
          hover: "#b53539",
        },
        timer: {
          idle: "currentColor",
          hold: "#ef4444",
          ready: "#22c55e",
          running: "currentColor",
          inspect: "#f97316",
        },
      },
      borderWidth: {
        '1.5': '1.5px',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
};
