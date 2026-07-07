import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F4EFE6',
          2: '#ECE4D4',
          3: '#E3D8C2',
        },
        surface: '#FAF6EE',
        'surface-hi': '#FFFEFB',
        ink: {
          DEFAULT: '#1A1612',
          2: '#2A241F',
          3: '#6A6258',
          4: '#9A9285',
        },
        hair: '#D8CFC0',
        'hair-2': '#C7BFAE',
        cinnabar: {
          DEFAULT: '#B33A2D',
          2: '#8E2A1F',
          3: '#D9543E',
        },
        gold: {
          DEFAULT: '#B89968',
          2: '#8C7448',
        },
        mute: '#8A8275',
        positive: '#2D7A4A',
        warning: '#A86A1A',
      },
      fontFamily: {
        // Editorial display — Fraunces (variable optical size)
        display: ['"Fraunces"', 'serif'],
        // Italic accent — Cormorant Garamond
        accent: ['"Cormorant Garamond"', 'serif'],
        // Body — Manrope
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
        // Tech / SKU — JetBrains Mono
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        md: '14px',
        lg: '18px',
        xl: '22px',
        '2xl': '24px',
      },
      boxShadow: {
        lift: '0 14px 36px rgba(26,22,18,0.10), 0 2px 6px rgba(26,22,18,0.04)',
        soft: '0 4px 14px rgba(26,22,18,0.06)',
        seal: '0 6px 18px rgba(179,58,45,0.25)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 700ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
        'lift-in': 'liftIn 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
        marquee: 'marquee 40s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        liftIn: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      letterSpacing: {
        tightest: '-0.025em',
        editorial: '-0.015em',
        tracked: '0.18em',
      },
    },
  },
  plugins: [],
}

export default config
