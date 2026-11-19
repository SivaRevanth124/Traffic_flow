/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        traffic: {
          bg: '#0B0F19',
          surface: '#111827',
          card: '#161F30',
          border: '#1F293D',
          hover: '#1E293B',
          accent: '#2563EB',
          accentHover: '#1D4ED8',
          cyan: '#06B6D4',
          cyanGlow: '#22D3EE',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          muted: '#94A3B8',
          text: '#F8FAFC'
        }
      }
    },
  },
  plugins: [],
}
