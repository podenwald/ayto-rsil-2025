/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: { 
    extend: {
      gridTemplateColumns: {
        '4': 'repeat(4, minmax(0, 1fr))',
      },
      spacing: {
        '14': '3.5rem', // 56px for 44pt touch targets
        '16': '4rem',   // 64px
        '20': '5rem',   // 80px
      },
      borderRadius: {
        '2xl': '1rem',  // 16px
        '3xl': '1.5rem', // 24px
      },
      backdropBlur: {
        'xl': '24px',
      },
      boxShadow: {
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      }
    } 
  },
  plugins: [],
}
  