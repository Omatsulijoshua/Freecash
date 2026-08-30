/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Emerald money-oriented primary
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        dark: {
          50: '#f6f6f7',
          100: '#e3e3e5',
          200: '#c7c7cb',
          300: '#a3a3aa',
          400: '#797984',
          500: '#5c5c67',
          600: '#484852',
          700: '#3a3a42',
          800: '#1e1e24',
          900: '#121216',
          950: '#0b0b0e',
        },
      },
    },
  },
  plugins: [],
};
