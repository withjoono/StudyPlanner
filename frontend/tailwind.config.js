/** @type {import('tailwindcss').Config} */
export default {
  presets: [require('geobuk-shared/tailwind-preset')],
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../node_modules/geobuk-shared/dist/**/*.js',
    '../../node_modules/geobuk-shared/dist/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        // StudyPlanner 고유: ultrasonic CSS 변수 기반 (기존 방식 보존)
        ultrasonic: {
          50: 'hsl(var(--ultrasonic-50))',
          100: 'hsl(var(--ultrasonic-100))',
          200: 'hsl(var(--ultrasonic-200))',
          300: 'hsl(var(--ultrasonic-300))',
          400: 'hsl(var(--ultrasonic-400))',
          500: 'hsl(var(--ultrasonic-500))',
          600: 'hsl(var(--ultrasonic-600))',
          700: 'hsl(var(--ultrasonic-700))',
          800: 'hsl(var(--ultrasonic-800))',
          900: 'hsl(var(--ultrasonic-900))',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
