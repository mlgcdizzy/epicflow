import type { Config } from 'tailwindcss';

// EpicFlow design tokens
// Palette chosen for a principal-PM / exec-facing portfolio tool:
// deep ink-navy for structure, a single amber accent reserved for
// priority/attention signals, and a cool neutral field so status
// colors (green/amber/red) stay legible and don't compete with the UI.
const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B2942',
          50: '#EAF0F5',
          100: '#CBDAE6',
          200: '#9CB8CE',
          300: '#6D96B6',
          400: '#3E749E',
          500: '#215680',
          600: '#173F60',
          700: '#0B2942',
          800: '#081C2E',
          900: '#050F1A',
        },
        field: '#F4F6F9',
        surface: '#FFFFFF',
        line: '#E2E7EE',
        muted: '#64748B',
        accent: {
          DEFAULT: '#E0952E',
          50: '#FCF2E2',
          100: '#F8E1B9',
          500: '#E0952E',
          600: '#BC7A20',
        },
        status: {
          idea: '#8B93A6',
          discovery: '#5C7FA8',
          validated: '#3E749E',
          planned: '#6D5CA8',
          committed: '#215680',
          progress: '#1F7A6C',
          blocked: '#C1432B',
          released: '#1E8A5F',
          cancelled: '#94A3B8',
        },
        health: {
          green: '#1E8A5F',
          amber: '#D97706',
          red: '#C1432B',
        },
      },
      fontFamily: {
        sans: ['var(--font-plex-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(11, 41, 66, 0.06), 0 1px 1px rgba(11, 41, 66, 0.04)',
        pop: '0 8px 24px rgba(11, 41, 66, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
