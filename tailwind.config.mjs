/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        wok: {
          bg: 'rgb(var(--wok-bg) / <alpha-value>)',
          panel: 'rgb(var(--wok-panel) / <alpha-value>)',
          accent: 'rgb(var(--wok-accent) / <alpha-value>)',
          chord: 'rgb(var(--wok-chord) / <alpha-value>)',
          text: 'rgb(var(--wok-text) / <alpha-value>)',
          muted: 'rgb(var(--wok-muted) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
