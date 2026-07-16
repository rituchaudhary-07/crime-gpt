/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          50: '#f0f5fa',
          100: '#dbe7f4',
          200: '#bfd5ea',
          300: '#94b8db',
          400: '#6395c5',
          500: '#4177ad',
          600: '#315f90',
          700: '#284c75',
          800: '#233d5b',
          900: '#101d2c',
          950: '#0a0f18',
        },
        cyber: {
          cyan: '#06b6d4',
          blue: '#3b82f6',
          purple: '#8b5cf6',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'cyber-glow': '0 0 20px rgba(6, 182, 212, 0.25)',
      }
    },
  },
  plugins: [],
}
