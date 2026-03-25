/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bcdcff',
          300: '#8ec6ff',
          400: '#59a5ff',
          500: '#3380ff',
          600: '#1b5cf5',
          700: '#1449e1',
          800: '#173bb6',
          900: '#19358f',
          950: '#142257',
        },
        severity: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#22c55e',
          info: '#3b82f6',
        },
        navy: {
          800: '#1e293b',
          850: '#172032',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
