import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      // HIG Spacing Scale (4px base)
      spacing: {
        'hig-1': 'var(--space-1)',
        'hig-2': 'var(--space-2)',
        'hig-3': 'var(--space-3)',
        'hig-4': 'var(--space-4)',
        'hig-5': 'var(--space-5)',
        'hig-6': 'var(--space-6)',
        'hig-8': 'var(--space-8)',
        'hig-10': 'var(--space-10)',
        'hig-12': 'var(--space-12)',
        'hig-16': 'var(--space-16)',
        'touch-min': 'var(--touch-target-min)',
        'touch-comfortable': 'var(--touch-target-comfortable)',
        'touch-large': 'var(--touch-target-large)',
      },
      // HIG Font Sizes (responsive clamp)
      fontSize: {
        'hig-xs': 'var(--text-xs)',
        'hig-sm': 'var(--text-sm)',
        'hig-base': 'var(--text-base)',
        'hig-lg': 'var(--text-lg)',
        'hig-xl': 'var(--text-xl)',
        'hig-2xl': 'var(--text-2xl)',
        'hig-3xl': 'var(--text-3xl)',
      },
      // HIG Line Heights
      lineHeight: {
        'hig-tight': 'var(--leading-tight)',
        'hig-snug': 'var(--leading-snug)',
        'hig-normal': 'var(--leading-normal)',
        'hig-relaxed': 'var(--leading-relaxed)',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        purple: {
          300: "hsl(var(--purple-300))",
          400: "hsl(var(--purple-400))",
          500: "hsl(var(--purple-500))",
          600: "hsl(var(--purple-600))",
          700: "hsl(var(--purple-700))",
          800: "hsl(var(--purple-800))",
          900: "hsl(var(--purple-900))",
        },
        dark: {
          600: "hsl(var(--bg-dark-600))",
          700: "hsl(var(--bg-dark-700))",
          800: "hsl(var(--bg-dark-800))",
          900: "hsl(var(--bg-dark-900))",
          950: "hsl(var(--bg-dark-950))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        'hig-sm': 'var(--radius-sm)',
        'hig': 'var(--radius)',
        'hig-lg': 'var(--radius-lg)',
        'hig-xl': 'var(--radius-xl)',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "var(--radius-lg)",
        "2xl": "var(--radius-xl)",
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        "glow-intense": "var(--shadow-glow-intense)",
        card: "var(--shadow-card)",
        // HIG Elevation System
        'elevation-0': 'var(--elevation-0)',
        'elevation-1': 'var(--elevation-1)',
        'elevation-2': 'var(--elevation-2)',
        'elevation-3': 'var(--elevation-3)',
      },
      // HIG Animation Timing
      transitionDuration: {
        'hig-instant': 'var(--duration-instant)',
        'hig-fast': 'var(--duration-fast)',
        'hig-normal': 'var(--duration-normal)',
        'hig-slow': 'var(--duration-slow)',
        'hig-slower': 'var(--duration-slower)',
      },
      transitionTimingFunction: {
        'hig-default': 'var(--ease-default)',
        'hig-spring': 'var(--ease-spring)',
        'hig-out': 'var(--ease-out)',
        'hig-in': 'var(--ease-in)',
        'hig-in-out': 'var(--ease-in-out)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 3s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-purple": "var(--gradient-purple)",
        "gradient-dark": "var(--gradient-dark)",
        "gradient-glass": "var(--gradient-glass)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
