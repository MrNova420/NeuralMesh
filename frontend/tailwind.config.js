/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neural: {
          bg: '#0d1117',
          panel: '#161b22',
          border: '#30363d',
          hover: '#21262d',
          text: '#c9d1d9',
          'text-secondary': '#8b949e',
          blue: '#58a6ff',
          green: '#3fb950',
          yellow: '#d29922',
          red: '#f85149',
          purple: '#a371f7',
          cyan: '#39c5cf',
          orange: '#ff7b42',
        }
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        }
      },
      boxShadow: {
        'neural': '0 0 20px rgba(88, 166, 255, 0.3)',
        'neural-lg': '0 0 40px rgba(88, 166, 255, 0.5)',
      }
    },
  },
  plugins: [],
}
