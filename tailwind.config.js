/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Бренд Нової Пошти: графіт + червоний
        np: {
          red: '#DA291C',
          red2: '#B71C12',
          graphite: '#2B2B2B',
          ink: '#1E1E1E',
          slate: '#5A5F66',
          line: '#E6E8EB',
          bg: '#F4F5F7',
          panel: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
