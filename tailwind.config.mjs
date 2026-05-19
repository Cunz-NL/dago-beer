/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg: '#1a1a1a',
        amber: {
          brand: '#D4860B',
        },
        surface: '#242424',
        muted: '#F5F5F5',
      },
      fontFamily: {
        heading: ['Oswald', 'sans-serif'],
        body: ['Exo', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
