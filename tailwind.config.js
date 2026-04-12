/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Abode design system
        abode: {
          bg: '#f7f6f4',
          bg2: '#ffffff',
          bg3: '#f0eeeb',
          border: '#e2deda',
          text: '#181613',
          text2: '#6b6560',
          text3: '#a8a099',
          teal: '#0d7377',
          'teal-light': '#f0fafa',
          green: '#2d7a4f',
          amber: '#b45309',
          red: '#b91c1c',
        }
      },
      fontFamily: {
        'instrument': ['Instrument Serif', 'serif'],
        'sans': ['DM Sans', 'sans-serif'],
        'mono': ['DM Mono', 'monospace'],
      },
      borderRadius: {
        'DEFAULT': '14px',
        'md': '14px',
        'lg': '14px',
        'card': '14px',
      },
    },
  },
  plugins: [],
}
