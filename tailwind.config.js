/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'bg-void': '#0A0A0F',
        'bg-surface': '#12121A',
        'bg-elevated': '#1C1C2E',
        'accent-primary': '#7C3AED',
        'accent-glow': '#A855F7',
        'rarity-common': '#6B7280',
        'rarity-rare': '#3B82F6',
        'rarity-epic': '#8B5CF6',
        'rarity-legendary': '#F59E0B',
        'text-primary': '#F8FAFC',
        'text-secondary': '#94A3B8',
        'text-muted': '#475569',
        success: '#10B981',
        danger: '#EF4444',
        'border-subtle': 'rgba(255,255,255,0.06)',
      },
      fontFamily: {
        display: ['SpaceGrotesk-Bold'],
        body: ['Inter-Regular'],
        mono: ['JetBrainsMono-Regular'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};
