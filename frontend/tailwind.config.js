/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fffbeb', 100: '#fef3c7', 200: '#fde68a',
          300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b',
          600: '#d97706', 700: '#b45309', 800: '#92400e'
        },
        // royal = Sri Ayyanar green palette (replaces blue)
        royal: {
          50:  '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0',
          300: '#86efac', 400: '#4ade80', 500: '#22c55e',
          600: '#16a34a', 700: '#15803d', 800: '#166534',
          900: '#14532d', 950: '#052e16'
        },
        forest: {
          50:  '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
          400: '#34d399', 500: '#10b981', 600: '#059669',
          700: '#047857', 800: '#065f46', 900: '#064e3b'
        },
        sb: {
          navy:  '#052e16',
          blue:  '#166534',
          light: '#16a34a',
          gold:  '#f59e0b',
          green: '#059669',
          bg:    '#f0fdf4',
        }
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':    '0 2px 16px 0 rgba(22,101,52,0.08), 0 1px 4px 0 rgba(22,101,52,0.04)',
        'card-lg': '0 8px 32px 0 rgba(22,101,52,0.12), 0 2px 8px 0 rgba(22,101,52,0.06)',
        'gold':    '0 4px 20px 0 rgba(245,158,11,0.30)',
        'blue':    '0 4px 20px 0 rgba(22,163,74,0.30)',
        'green':   '0 4px 20px 0 rgba(5,150,105,0.25)',
      },
      backgroundImage: {
        'sb-gradient':    'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)',
        'gold-gradient':  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'green-gradient': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'blue-gradient':  'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
        'card-gradient':  'linear-gradient(135deg, #ffffff 0%, #f8fff9 100%)',
      }
    }
  },
  plugins: []
};
