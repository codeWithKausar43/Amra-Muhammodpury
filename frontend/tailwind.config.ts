import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        brand: {
          emerald: '#087A55',
          'emerald-hover': '#066345',
          'emerald-light': '#0a9367',
          mint: '#D9F0E6',
          'mint-dark': '#bce3d2',
          gold: '#C49A45',
          'gold-light': '#dfb768',
          charcoal: '#17231F',
          'charcoal-dark': '#0E1714',
          'charcoal-light': '#24342E',
        },
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(8, 122, 85, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        glow: '0 0 20px -3px rgba(8, 122, 85, 0.35)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
