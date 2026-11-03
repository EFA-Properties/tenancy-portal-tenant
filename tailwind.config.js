/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#642E3D',
          dark: '#4f2330',
          oat: '#F5F0E7',
          rose: '#DABCB5',
          roseLight: '#efe0dc',
          ink: '#302D2E',
          card: '#fbf8f3',
        },
      },
      fontFamily: {
        'manrope': ['Manrope', 'system-ui', 'sans-serif'],
        'fraunces': ['Fraunces', 'serif'],
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
