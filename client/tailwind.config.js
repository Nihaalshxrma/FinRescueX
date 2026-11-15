/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../shared/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        paytm: {
          blue: '#002E6E',
          sky: '#00BAF2',
          lightSky: '#E8F8FD',
          navy: '#0F2042',
          bg: '#F5F9FD',
          card: '#FFFFFF',
          accent: '#00B9F5'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'mobile': '0 20px 40px -15px rgba(0, 46, 110, 0.15)',
        'card': '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
