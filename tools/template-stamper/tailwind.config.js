/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Agent Collective Design System Colors
        bg: {
          primary: '#0a0a0a',
          secondary: '#1a1a1a',
          tertiary: '#2a2a2a',
          input: '#1f1f1f',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          tertiary: '#6b6b6b',
          accent: '#ef4444',
        },
        accent: {
          red: '#ef4444',
          'red-hover': '#dc2626',
          'red-light': '#fca5a5',
        },
        status: {
          online: '#10b981',
          offline: '#6b7280',
          warning: '#f59e0b',
        },
        border: {
          subtle: '#2a2a2a',
          input: '#3a3a3a',
          focus: '#ef4444',
          dashed: '#4a4a4a',
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
