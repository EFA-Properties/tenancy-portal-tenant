/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          '50': '#faf5f4',
          '100': '#f3e6e3',
          '200': '#e6cfc9',
          '300': '#DABCB5',
          '400': '#b9838a',
          '500': '#8f4c5c',
          '600': '#7a3a4b',
          '700': '#642E3D',
          '800': '#4f2330',
          '900': '#3d1b25',
          '950': '#26101a',
        },
        blue: {
          '50': '#faf5f4',
          '100': '#f3e6e3',
          '200': '#e6cfc9',
          '300': '#DABCB5',
          '400': '#b9838a',
          '500': '#8f4c5c',
          '600': '#7a3a4b',
          '700': '#642E3D',
          '800': '#4f2330',
          '900': '#3d1b25',
          '950': '#26101a',
        },
        slate: {
          '50': '#faf7f2',
          '100': '#f1ebe2',
          '200': '#e5ddd1',
        },
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
        'fraunces': ['Manrope', 'system-ui', 'sans-serif'],
        'sans': ['Manrope', 'system-ui', 'sans-serif'],
        'mono': ['Manrope', 'system-ui', 'sans-serif'],
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
