/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ['class', 'class'],
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
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				'card-foreground': 'hsl(var(--card-foreground))',
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				'popover-foreground': 'hsl(var(--popover-foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				'primary-foreground': 'hsl(var(--primary-foreground))',
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				'secondary-foreground': 'hsl(var(--secondary-foreground))',
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				'muted-foreground': 'hsl(var(--muted-foreground))',
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				'accent-foreground': 'hsl(var(--accent-foreground))',
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				'destructive-foreground': 'hsl(var(--destructive-foreground))',
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				'app-bg': 'hsl(var(--background))',
				surface: 'hsl(var(--card))',
				'surface-highlight': 'hsl(var(--secondary))',
				'text-primary': 'hsl(var(--foreground))',
				'text-secondary': 'hsl(var(--muted-foreground))',
				'text-muted': 'hsl(var(--muted-foreground))',
				'accent-primary': 'hsl(var(--primary))',
				'accent-secondary': '#14b8a6',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			fontFamily: {
				sans: [
					'Inter',
					'ui-sans-serif',
					'system-ui',
					'-apple-system',
					'BlinkMacSystemFont',
					'Segoe UI',
					'Roboto',
					'Helvetica Neue',
					'Arial',
					'sans-serif'
				],
				mono: [
					'Geist Mono',
					'JetBrains Mono',
					'ui-monospace',
					'SFMono-Regular',
					'Menlo',
					'Monaco',
					'Consolas',
					'Liberation Mono',
					'Courier New',
					'monospace'
				]
			},
			fontSize: {
				xs: ['var(--font-size-xs)', { lineHeight: 'var(--line-height-body)' }],
				sm: ['var(--font-size-sm)', { lineHeight: 'var(--line-height-body)' }],
				base: ['var(--font-size-base)', { lineHeight: 'var(--line-height-body)' }],
				lg: ['var(--font-size-lg)', { lineHeight: 'var(--line-height-body)' }],
				xl: ['var(--font-size-xl)', { lineHeight: 'var(--line-height-tight)' }],
				'2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-tight)' }],
				'3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-tight)' }],
				'4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-tight)' }],
				'5xl': ['var(--font-size-5xl)', { lineHeight: 'var(--line-height-tight)' }],
				'6xl': ['var(--font-size-6xl)', { lineHeight: 'var(--line-height-tight)' }],
			},
			borderRadius: {
				lg: 'var(--radius-lg)',
				md: 'var(--radius-md)',
				sm: 'var(--radius-sm)',
				xs: 'var(--radius-xs)',
				xl: '0.75rem',
				'2xl': '1rem',
				'3xl': '1.5rem',
			},
			boxShadow: {
				soft: '0 0 0 1px hsl(var(--border))',
				card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
				glow: '0 0 20px -10px hsl(var(--primary) / 0.3)'
			},
			keyframes: {
				shake: {
					'10%, 90%': {
						transform: 'translate3d(-1px, 0, 0)'
					},
					'20%, 80%': {
						transform: 'translate3d(2px, 0, 0)'
					},
					'30%, 50%, 70%': {
						transform: 'translate3d(-4px, 0, 0)'
					},
					'40%, 60%': {
						transform: 'translate3d(4px, 0, 0)'
					}
				},
				"border-beam": {
					"100%": {
						"offset-distance": "100%",
					},
				},
				ani: {
					"0%": { transform: "translateX(0%) scale(1)" },
					"50%": { transform: "translateX(-100%) scale(0.8)" },
					"100%": { transform: "translateX(0%) scale(1)" },
				},
				shine: {
					"0%": { top: "100%", left: "-100%" },
					"50%, 100%": { top: "0%", left: "70%" },
				},
			},
			animation: {
				shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
				"border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
				ani: "ani 28s ease-in-out infinite",
				shine: "shine 10s ease infinite",
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
}
