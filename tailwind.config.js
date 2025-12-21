/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    safelist: [
        'hidden',
        'sm:table-cell',
        'sm:block',
        'md:table-cell',
        'md:block',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#c4dafa', // From image
                    300: '#84b6f4', // From image
                    400: '#60a5fa',
                    500: '#4d82bc', // Main requested color
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#005187', // From image
                    900: '#1e3a8a',
                    950: '#172554',
                },
                success: {
                    light: '#d1fae5',
                    DEFAULT: '#10b981',
                    dark: '#047857',
                },
                danger: {
                    light: '#fee2e2',
                    DEFAULT: '#ef4444',
                    dark: '#dc2626',
                },
                warning: {
                    light: '#fef3c7',
                    DEFAULT: '#f59e0b',
                    dark: '#d97706',
                },
                info: {
                    light: '#dbeafe',
                    DEFAULT: '#3b82f6',
                    dark: '#1d4ed8',
                },
            },
        },
    },
    plugins: [],
}
