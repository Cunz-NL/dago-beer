/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        amber: {
          brand: '#0F2044',
        },
        surface: '#EEF2F8',
        muted: '#1E293B',
      },
      fontFamily: {
        heading: ['Oswald', 'sans-serif'],
        body: ['Exo', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
