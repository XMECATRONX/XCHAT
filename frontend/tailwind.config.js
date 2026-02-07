/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'theme-bg': 'var(--bg)',
        'theme-secondary': 'var(--bg-soft)',
        'theme-accent': 'var(--accent)'
      }
    },
  },
  plugins: [],
}
