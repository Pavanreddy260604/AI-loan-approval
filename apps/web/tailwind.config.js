import { designTokens } from './src/lib/design-tokens/index.ts';

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Import all color scales from design tokens
        primary: designTokens.colors.primary,
        base: designTokens.colors.base,
        success: designTokens.colors.success,
        warning: designTokens.colors.warning,
        danger: designTokens.colors.danger,
        info: designTokens.colors.info,
        
        // Legacy aliases for backward compatibility
        ink: designTokens.colors.base[950],
        surface: designTokens.colors.base[900],
        "surface-raised": designTokens.colors.base[800],
        border: "rgba(255,255,255,0.08)",
        muted: designTokens.colors.base[500],
        body: designTokens.colors.base[300],
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
