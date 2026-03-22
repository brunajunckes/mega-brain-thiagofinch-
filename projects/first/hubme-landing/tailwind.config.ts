import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
        accent: '#06b6d4',
        dark: '#0f172a',
        'dark-light': '#1e293b',
      },
    },
  },
  plugins: [],
};

export default config;
