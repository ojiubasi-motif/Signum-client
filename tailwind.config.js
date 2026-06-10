/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#131320',
          dark: '#0a0a14',
          sidebar: '#0e0e1a',
        },
      },
    },
  },
  plugins: [],
};
