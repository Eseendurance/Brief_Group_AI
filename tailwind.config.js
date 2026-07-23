/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        // NOTE ON NAMING: these Tailwind color *keys* (amber, cyan, emerald,
        // alert) are historical from the first dark-theme build and are used
        // all over app/ and components/. Rather than rename every className
        // across ~15 files, we repoint what each key means here — this is
        // the entire re-theme to the black/white/red/blue brand palette.
        //   amber   -> PRIMARY RED   (brand action color: CTAs, active nav, highlights)
        //   cyan    -> NAVY BLUE     (structural/secondary color: links, secondary buttons, data)
        //   emerald -> kept GREEN, deliberately, ONLY for "Healthy / Low risk" status —
        //              see note below on why this one exception exists.
        //   alert   -> deep RED      (Critical/danger only — one shade darker than the brand red)
        base: {
          950: '#FFFFFF',
          900: '#FFFFFF',
          800: '#F4F5F7',
          700: '#ECEEF2',
          600: '#E2E5EA',
        },
        surface: '#FFFFFF',
        border: '#E3E6EC',
        amber: {
          DEFAULT: '#D7263D', // primary red — buttons, active states, hero highlight
          soft: '#F0616F',
        },
        cyan: {
          DEFAULT: '#12294F', // navy — structural color, secondary accents, links
          soft: '#3E5C8C',
        },
        emerald: {
          DEFAULT: '#178A4C', // kept as a single deliberate exception — see README
        },
        alert: {
          DEFAULT: '#A81126', // deep red — Critical/danger only
        },
        ink: {
          100: '#0B0B0D', // primary text — near-black
          300: '#454B57', // secondary text
          500: '#8A93A3', // muted text/labels
        }
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      backgroundImage: {
        'grid-fade': 'radial-gradient(circle at 50% 0%, rgba(18,41,79,0.06), transparent 60%)',
        'amber-glow': 'radial-gradient(circle, rgba(215,38,61,0.16), transparent 70%)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(18,41,79,0.12)',
        'glow-amber': '0 8px 24px rgba(215,38,61,0.25)',
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
      },
      keyframes: {
        pulseLine: {
          '0%': { strokeDashoffset: '240' },
          '100%': { strokeDashoffset: '0' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        nodeGlow: {
          '0%,100%': { opacity: '0.5', filter: 'drop-shadow(0 0 2px currentColor)' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 8px currentColor)' },
        }
      },
      animation: {
        pulseLine: 'pulseLine 3s linear infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        nodeGlow: 'nodeGlow 2.4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
