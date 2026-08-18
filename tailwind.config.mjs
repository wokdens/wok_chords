/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        wok: {
          bg: '#0b0f17',
          panel: '#111827',
          accent: '#f97316',
          chord: '#22d3ee',
          text: '#e5e7eb',
          muted: '#94a3b8',
        },
      },
    },
  },
  plugins: [],
};
