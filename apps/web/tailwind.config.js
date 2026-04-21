import { designTokens } from './src/lib/design-tokens/index.ts';

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Import all color scales from design tokens
        primary: designTokens.colors.primary,
        // Base scale uses CSS variables for theme switching (RGB format for opacity support)
        base: {
          50: 'rgb(var(--tw-base-50) / <alpha-value>)',
          100: 'rgb(var(--tw-base-100) / <alpha-value>)',
          200: 'rgb(var(--tw-base-200) / <alpha-value>)',
          300: 'rgb(var(--tw-base-300) / <alpha-value>)',
          400: 'rgb(var(--tw-base-400) / <alpha-value>)',
          500: 'rgb(var(--tw-base-500) / <alpha-value>)',
          600: 'rgb(var(--tw-base-600) / <alpha-value>)',
          700: 'rgb(var(--tw-base-700) / <alpha-value>)',
          800: 'rgb(var(--tw-base-800) / <alpha-value>)',
          900: 'rgb(var(--tw-base-900) / <alpha-value>)',
          950: 'rgb(var(--tw-base-950) / <alpha-value>)',
          DEFAULT: 'rgb(var(--tw-base-500) / <alpha-value>)',
        },
        success: designTokens.colors.success,
        warning: designTokens.colors.warning,
        danger: designTokens.colors.danger,
        info: designTokens.colors.info,
        
        // Legacy aliases for backward compatibility
        ink: 'rgb(var(--tw-base-950) / <alpha-value>)',
        surface: 'rgb(var(--tw-base-900) / <alpha-value>)',
        "surface-raised": 'rgb(var(--tw-base-800) / <alpha-value>)',
        border: "rgba(255,255,255,0.08)",
        muted: 'rgb(var(--tw-base-500) / <alpha-value>)',
        body: 'rgb(var(--tw-base-300) / <alpha-value>)',
      },
      spacing: designTokens.spacing,
      fontSize: designTokens.typography.fontSizes,
      lineHeight: designTokens.typography.lineHeights,
      fontWeight: designTokens.typography.fontWeights,
      fontFamily: {
        sans: ["Geist", "Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        ...designTokens.shadows,
        // Legacy aliases
        "elite-card": designTokens.shadows.sm,
        "elite-elevated": designTokens.shadows.xl,
        "elite-primary": "0 0 20px rgba(99,91,255,0.1)",
      },
      borderRadius: {
        ...designTokens.borderRadius,
        // Legacy aliases
        pro: designTokens.borderRadius.sm,
        "pro-lg": designTokens.borderRadius.md,
      },
      transitionDuration: designTokens.transitions,
      keyframes: {
        shiver: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-2px)" },
          "75%": { transform: "translateX(2px)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        }
      },
      animation: {
        shiver: "shiver 0.2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
