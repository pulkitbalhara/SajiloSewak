/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF6',
          100: '#FAF6EC',
          200: '#F3ECD9',
        },
        gold: {
          50: '#FBF3E4',
          100: '#F6E6C7',
          200: '#EFD199',
          300: '#E7BC6B',
          400: '#DDA13D',
          500: '#C9861E',
          600: '#A66A16',
          700: '#7E4F13',
        },
        ink: {
          400: '#8A8175',
          500: '#6B6357',
          700: '#413B32',
          900: '#2A251E',
        },
        moss: { 400: '#7BAe6b', 500: '#5E9450', 600: '#4A7A3F' },
        amber2: { 500: '#E0A83C' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(42,37,30,0.04), 0 8px 24px -12px rgba(42,37,30,0.12)',
        pop: '0 8px 40px -8px rgba(42,37,30,0.22)',
      },
      borderRadius: {
        xl2: '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
}
