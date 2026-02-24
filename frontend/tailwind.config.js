/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6366F1",   // Indigo
          dark: "#4338CA",     // Darker Indigo
          light: "#A5B4FC"     // Light Indigo
        }
      },
      container: {
        center: true,
        padding: "1rem",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in-from-left-4': 'slideInFromLeft 0.5s ease-out',
        'slide-in-from-right-4': 'slideInFromRight 0.5s ease-out',
        'slide-in-from-bottom-4': 'slideInFromBottom 0.5s ease-out',
        'slide-in-from-bottom-10': 'slideInFromBottom 0.5s ease-out',
        'zoom-in': 'zoomIn 0.5s ease-out',
        'zoom-in-95': 'zoomIn95 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInFromLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInFromRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        zoomIn95: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [],
};