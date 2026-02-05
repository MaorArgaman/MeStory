/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Cosmic theme colors
        'magic-gold': {
          DEFAULT: '#FFD700',
          50: '#FFFEF0',
          100: '#FFFACC',
          200: '#FFF699',
          300: '#FFF066',
          400: '#FFEA33',
          500: '#FFD700',
          600: '#CCAC00',
          700: '#998100',
          800: '#665600',
          900: '#332B00',
        },
        'deep-space': {
          DEFAULT: '#0a0a1f',
          50: '#e6e6f0',
          100: '#b3b3d6',
          200: '#8080bd',
          300: '#4d4da3',
          400: '#26268f',
          500: '#0a0a1f',
          600: '#09091c',
          700: '#070716',
          800: '#050511',
          900: '#03030b',
        },
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'cosmic-purple': {
          DEFAULT: '#a855f7',
          light: '#c084fc',
          dark: '#7e22ce',
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
