/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#FDFCF9',
          100: '#FBF9F5', // Core soft creamy background
          200: '#F5F1E8',
          300: '#EDE6D8',
          400: '#DFD4C0',
          card: '#F8F5EE', // Subtle elevated card surface
          surface: '#F3EFE6', // Secondary contrast surface
          border: '#E8E0D2', // Parchment divider border
          DEFAULT: '#FBF9F5',
        },
        'warm-brown': {
          50: '#F7F5F4',
          100: '#E8E3E1',
          200: '#D1C7C3',
          300: '#A99B95',
          400: '#83746D',
          500: '#675751',
          600: '#554743',
          700: '#4A3E3D', // Muted headings and earth borders
          800: '#3B302F',
          900: '#2E2524', // Deep structural dark text
          950: '#1F1818',
          DEFAULT: '#4A3E3D',
        },
        sienna: {
          50: '#FDF7F4',
          100: '#FAEDE7',
          200: '#F5D6C9',
          300: '#EDB7A2',
          400: '#E2725B', // Terracotta highlight
          500: '#C85A17', // Active urgency accent
          600: '#A0522D', // Burnt-orange / Sienna signature tone
          700: '#844122',
          800: '#68331A',
          900: '#4E2512',
          DEFAULT: '#A0522D',
          accent: '#C85A17',
          light: '#E2725B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'sienna-soft': '0 4px 20px -2px rgba(74, 62, 61, 0.06)',
        'sienna-card': '0 2px 10px -1px rgba(74, 62, 61, 0.08), 0 0 0 1px rgba(232, 224, 210, 0.6)',
        'sienna-focus': '0 10px 30px -4px rgba(160, 82, 45, 0.12), 0 0 0 1px rgba(160, 82, 45, 0.2)'
      }
    },
  },
  plugins: [],
}
