/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',

                card: 'hsl(var(--card))',
                'card-foreground': 'hsl(var(--card-foreground))',

                popover: 'hsl(var(--popover))',
                'popover-foreground': 'hsl(var(--popover-foreground))',

                primary: 'hsl(var(--primary))',
                'primary-foreground': 'hsl(var(--primary-foreground))',

                secondary: 'hsl(var(--secondary))',
                'secondary-foreground': 'hsl(var(--secondary-foreground))',

                muted: 'hsl(var(--muted))',
                'muted-foreground': 'hsl(var(--muted-foreground))',

                accent: 'hsl(var(--accent))',
                'accent-foreground': 'hsl(var(--accent-foreground))',

                destructive: 'hsl(var(--destructive))',
                'destructive-foreground': 'hsl(var(--destructive-foreground))',

                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',

                // Legacy mappings mapping to variables
                'app-bg': 'hsl(var(--background))',
                'surface': 'hsl(var(--card))',
                'surface-highlight': 'hsl(var(--secondary))',
                'text-primary': 'hsl(var(--foreground))',
                'text-secondary': 'hsl(var(--muted-foreground))',
                'text-muted': 'hsl(var(--muted-foreground))',

                'accent-primary': 'hsl(var(--primary))',
                'accent-secondary': '#14b8a6',
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
                mono: ['Geist Mono', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
            },
            borderRadius: {
                'xl': '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            boxShadow: {
                'soft': '0 0 0 1px hsl(var(--border))',
                'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                'glow': '0 0 20px -10px hsl(var(--primary) / 0.3)',
            },
            animation: {
                'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
            },
            keyframes: {
                'shake': {
                    '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
                    '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
                    '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
                    '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
                }
            }
        },
    },
    plugins: [],
}
