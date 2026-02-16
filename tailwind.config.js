import tailwindAnimate from 'tailwindcss-animate';
import containerQuery from '@tailwindcss/container-queries';
import intersect from 'tailwindcss-intersect';

export default {
    darkMode: ['class'],
    content: [
        './index.html',
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
        './node_modules/streamdown/dist/**/*.js'
    ],
    safelist: ['border', 'border-border'],
    prefix: '',
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px'
            }
        },
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                borderColor: {
                    border: 'hsl(var(--border))'
                },
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                text: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                brand: {
                    blue: 'hsl(var(--brand-blue))',
                    navy: 'hsl(var(--brand-navy))',
                    teal: 'hsl(var(--brand-teal))',
                    cyan: 'hsl(var(--brand-cyan))',
                    lime: 'hsl(var(--brand-lime))',
                    background: 'hsl(var(--brand-bg))',
                    'background-secondary': 'hsl(var(--brand-bg-secondary))',
                    border: 'hsl(var(--brand-border))',
                    muted: 'hsl(var(--brand-muted))'
                },
                education: {
                    blue: 'hsl(var(--education-blue))',
                    green: 'hsl(var(--education-green))'
                },
                success: 'hsl(var(--success))',
                warning: 'hsl(var(--warning))',
                info: 'hsl(var(--info))',
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-background))',
                    background: 'hsl(var(--sidebar-background))',
                    foreground: 'hsl(var(--sidebar-foreground))',
                    primary: 'hsl(var(--sidebar-primary))',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
                    accent: 'hsl(var(--sidebar-accent))',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                    border: 'hsl(var(--sidebar-border))',
                    ring: 'hsl(var(--sidebar-ring))'
                },
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                },
                lesson: {
                    navy: '#050a1d',
                    panel: '#0b1530',
                    cyan: '#22d3ee',
                    blue: '#3b82f6',
                    indigo: '#6366f1',
                    light: '#f2f7ff'
                }
            },
            borderRadius: {
                card: 'var(--radius)',
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            backgroundImage: {
                'gradient-primary': 'var(--gradient-primary)',
                'gradient-card': 'var(--gradient-card)',
                'gradient-background': 'var(--gradient-background)',
                'gradient-progress': 'var(--gradient-progress)'
            },
            boxShadow: {
                card: 'var(--shadow-card)',
                hover: 'var(--shadow-hover)',
                glow: 'var(--shadow-glow)',
                'lesson-glass': '0 14px 38px rgba(15,23,42,0.34)',
                'lesson-hover': '0 18px 42px rgba(37,99,235,0.24)',
                'lesson-neon': '0 0 0 1px rgba(34,211,238,0.35), 0 0 24px rgba(34,211,238,0.24)'
            },
            keyframes: {
                'accordion-down': {
                    from: {
                        height: '0'
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)'
                    }
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)'
                    },
                    to: {
                        height: '0'
                    }
                },
                'fade-in': {
                    from: {
                        opacity: '0',
                        transform: 'translateY(10px)'
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)'
                    }
                },
                'slide-in': {
                    from: {
                        opacity: '0',
                        transform: 'translateX(-20px)'
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateX(0)'
                    }
                },
                'lesson-caret-blink': {
                    '0%, 45%': { opacity: '1' },
                    '50%, 100%': { opacity: '0' }
                },
                'lesson-current-pulse': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(34,211,238,0.45)' },
                    '50%': { boxShadow: '0 0 0 8px rgba(34,211,238,0)' }
                },
                'lesson-glow-pulse': {
                    '0%, 100%': { boxShadow: '0 0 0 rgba(34,211,238,0)' },
                    '50%': { boxShadow: '0 0 18px rgba(34,211,238,0.38)' }
                },
                'lesson-gradient-shift': {
                    '0%': { transform: 'scale(1) translate3d(0, 0, 0)', opacity: '0.82' },
                    '50%': { transform: 'scale(1.03) translate3d(0, -10px, 0)', opacity: '0.94' },
                    '100%': { transform: 'scale(1.02) translate3d(0, 6px, 0)', opacity: '0.8' }
                },
                'lesson-ripple-wave': {
                    '0%': { opacity: '0.5', transform: 'translate(-50%, -50%) scale(0.01)' },
                    '70%': { opacity: '0.2', transform: 'translate(-50%, -50%) scale(26)' },
                    '100%': { opacity: '0', transform: 'translate(-50%, -50%) scale(36)' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 0.5s ease-out',
                'slide-in': 'slide-in 0.5s ease-out',
                'lesson-caret-blink': 'lesson-caret-blink 1s steps(1) infinite',
                'lesson-current-pulse': 'lesson-current-pulse 1.1s ease-in-out infinite',
                'lesson-glow-pulse': 'lesson-glow-pulse 1.3s ease-in-out infinite',
                'lesson-gradient-shift': 'lesson-gradient-shift 14s ease-in-out infinite alternate',
                'lesson-ripple-wave': 'lesson-ripple-wave 0.65s ease-out'
            }
        }
    },
    plugins: [
        tailwindAnimate,
        containerQuery,
        intersect,
        function ({addUtilities}) {
            addUtilities(
                {
                    '.border-t-solid': {'border-top-style': 'solid'},
                    '.border-r-solid': {'border-right-style': 'solid'},
                    '.border-b-solid': {'border-bottom-style': 'solid'},
                    '.border-l-solid': {'border-left-style': 'solid'},
                    '.border-t-dashed': {'border-top-style': 'dashed'},
                    '.border-r-dashed': {'border-right-style': 'dashed'},
                    '.border-b-dashed': {'border-bottom-style': 'dashed'},
                    '.border-l-dashed': {'border-left-style': 'dashed'},
                    '.border-t-dotted': {'border-top-style': 'dotted'},
                    '.border-r-dotted': {'border-right-style': 'dotted'},
                    '.border-b-dotted': {'border-bottom-style': 'dotted'},
                    '.border-l-dotted': {'border-left-style': 'dotted'},
                },
                ['responsive']
            );
        },
    ],
};
