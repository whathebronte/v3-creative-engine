/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1a1a1a',
          raised: '#2a2a2a',
          hover: '#333333',
        },
        border: '#3a3a3a',
        accent: {
          DEFAULT: '#FF0000',
          hover: '#CC0000',
        },
        status: {
          pending: '#666666',
          running: '#FFA500',
          complete: '#00CC66',
          failed: '#FF4444',
          blocked: '#FF4444',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
