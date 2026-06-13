/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1440px',
      '3xl': '1920px',
    },
    extend: {
      fontFamily: {
        sans: ['Geist', 'figmaSans Fallback', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'figmaMono Fallback', 'SF Mono', 'ui-monospace', 'monospace'],
        display: ['Geist', 'figmaSans Fallback', 'SF Pro Display', 'system-ui', 'sans-serif'],
        label: ['Geist Mono', 'figmaMono Fallback', 'SF Mono', 'ui-monospace', 'monospace'],
      },
      fontWeight: {
        'thin': '320',
        'extralight': '330',
        'light': '340',
        'book': '450',
        'medium': '480',
        'semibold': '540',
        'bold': '700',
      },
      colors: {
        figma: {
          black: '#000000',
          white: '#ffffff',
          glass: 'rgba(0, 0, 0, 0.08)',
          'glass-light': 'rgba(255, 255, 255, 0.16)',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#000000',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      letterSpacing: {
        'tighter-display': '-1.72px',
        'tighter-section': '-0.96px',
        'tight-sub': '-0.26px',
        'tight-body': '-0.14px',
        'tight-label': '0.54px',
        'tight-tag': '0.6px',
      },
      borderRadius: {
        'pill': '50px',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'figma-sm': '0 1px 2px rgba(0,0,0,0.04)',
        'figma': '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'figma-lg': '0 8px 24px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'figma-card': '0 20px 40px -15px rgba(0,0,0,0.05)',
        'inner-light': 'inset 0 1px 0 rgba(255,255,255,0.1)',
        'glow': '0 0 30px -5px rgba(16,185,129,0.15)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      }
    },
  },
  plugins: [],
}
