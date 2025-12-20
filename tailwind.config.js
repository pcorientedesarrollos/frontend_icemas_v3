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
                    50: '#fff8f1',
                    100: '#fef5e7', // Sidebar light
                    200: '#fde6c4',
                    300: '#fbd094',
                    400: '#f9b158',
                    500: '#F5A623', // Sidebar Brand Color
                    600: '#E89317', // Sidebar Hover
                    700: '#c2760c',
                    800: '#9f5e0f',
                    900: '#834d12',
                    950: '#482705',
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
