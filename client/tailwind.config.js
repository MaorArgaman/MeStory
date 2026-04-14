/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Memorial primary - Deep Navy Blue (מכובד ומכבד)
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#1e3a5f',
          950: '#102a43',
        },
        // Memorial gold accent - warm and dignified
        'memorial-gold': {
          DEFAULT: '#c9a227',
          50: '#fdfcf5',
          100: '#faf5e4',
          200: '#f5eac8',
          300: '#edd9a0',
          400: '#e3c56f',
          500: '#c9a227',
          600: '#a88520',
          700: '#86691a',
          800: '#644e14',
          900: '#43340e',
        },
        // Deep background - warm dark
        'deep-space': {
          DEFAULT: '#1a1f2e',
          50: '#f5f6f8',
          100: '#e1e4e9',
          200: '#c3c9d4',
          300: '#9ca5b5',
          400: '#758196',
          500: '#5a6577',
          600: '#48505e',
          700: '#3a414d',
          800: '#2d333d',
          900: '#1a1f2e',
        },
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        // Memorial theme colors
        'memorial-accent': '#c9a227',
        'memorial-bg': '#1a1f2e',
        'memorial-warm': '#f8f6f3',
        // Accent colors
        'cosmic-purple': {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        // Warm accent
        'warm-accent': {
          DEFAULT: '#4a7c59',
          light: '#68a17a',
          dark: '#3d6549',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        display: ['Cinzel', 'serif'], // Majestic headings
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
        'slide-down': 'slideDown 0.3s ease-in-out',
        'float-stars': 'float-stars 20s ease-in-out infinite',
        'nebula-drift': 'nebula-drift 30s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'cosmic-float': 'cosmic-float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'float-stars': {
          '0%, 100%': {
            transform: 'translateY(0) translateX(0)',
            opacity: '0.3',
          },
          '50%': {
            transform: 'translateY(-20px) translateX(10px)',
            opacity: '0.6',
          },
        },
        'nebula-drift': {
          '0%': {
            transform: 'translate(0, 0) scale(1)',
            opacity: '0.1',
          },
          '50%': {
            transform: 'translate(30px, -30px) scale(1.1)',
            opacity: '0.2',
          },
          '100%': {
            transform: 'translate(0, 0) scale(1)',
            opacity: '0.1',
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3), 0 0 40px rgba(168, 85, 247, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.5), 0 0 60px rgba(168, 85, 247, 0.4)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
        'cosmic-float': {
          '0%, 100%': {
            transform: 'translateY(0px) rotate(0deg)',
          },
          '33%': {
            transform: 'translateY(-10px) rotate(2deg)',
          },
          '66%': {
            transform: 'translateY(5px) rotate(-2deg)',
          },
        },
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.4), 0 0 40px rgba(255, 215, 0, 0.2)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3)',
        'glow-cosmic': '0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(168, 85, 247, 0.2), 0 0 60px rgba(255, 215, 0, 0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
